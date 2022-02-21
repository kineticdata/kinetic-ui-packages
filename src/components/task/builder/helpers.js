import { isImmutable, List, Map, OrderedMap } from 'immutable';
import { isObject } from 'lodash-es';
import { Intersection, ShapeInfo } from 'kld-intersections';
import * as constants from './constants';
import { dispatch } from '../../../store';
import {
  processErbTemplate,
  processRuby,
} from '../../common/code_input/languageHelpers';
import {
  Node,
  Connector,
  NodeParameter,
  NodeResultDependency,
  NodeMessage,
  Point,
} from './models';
import { NEW_TASK_DX, NEW_TASK_DY, NEW_TASK_GAP_REQUIED } from './constants';

export const isIE11 = document.documentMode === 11;

export const getRectIntersections = ({
  dragging,
  head,
  headType,
  tail,
  tailType,
}) => {
  // Compute the points that make up the full path of the connector before
  // accounting for intersections. This will either be between the center of two
  // rects or from a dragging point to the center of a rect.
  const headCenter = dragging === 'head' ? head : getNodeCenter(headType, head);
  const tailCenter = dragging === 'tail' ? tail : getNodeCenter(tailType, tail);
  // Loop connectors are special in that we just draw them from the center of
  // the two nodes rather than calculating the intersections and drawing from
  // there.
  if (tailType === 'loop-head' && headType === 'loop-tail') {
    return [tailCenter, headCenter];
  }
  // Use kld-intersections to define the node shapes and connector lines used
  // to determine the intersections
  const line = ShapeInfo.line(tailCenter, headCenter);
  const headShape = getNodeShape(headType, head);
  const tailShape = getNodeShape(tailType, tail);
  const headIntersection = Intersection.intersect(headShape, line).points[0];
  const tailIntersection = Intersection.intersect(tailShape, line).points[0];
  return [
    dragging === 'tail' ? tail : tailIntersection || tailCenter,
    dragging === 'head' ? head : headIntersection || headCenter,
  ];
};

export const isPointInNode = point => node =>
  point &&
  node &&
  point.x >= node.position.x &&
  point.x <= node.position.x + constants.NODE_WIDTH &&
  point.y >= node.position.y &&
  point.y <= node.position.y + constants.NODE_HEIGHT;

export const getNodeType = node =>
  node
    ? node.definitionId.startsWith('system_join_v')
      ? 'join'
      : node.definitionId.startsWith('system_junction_v')
        ? 'junction'
        : node.definitionId.startsWith('system_loop_head_v')
          ? 'loop-head'
          : node.definitionId.startsWith('system_loop_tail_v')
            ? 'loop-tail'
            : node.definitionId.startsWith('system_start_v')
              ? 'start'
              : null
    : null;

export const getNodeShape = (type, { x, y }) =>
  type === 'start'
    ? ShapeInfo.circle(
        x + constants.NODE_START_RADIUS,
        y + constants.NODE_START_RADIUS,
        constants.NODE_START_RADIUS + constants.NODE_PADDING,
      )
    : ShapeInfo.rectangle(
        x - constants.NODE_PADDING,
        y - constants.NODE_PADDING,
        constants.NODE_WIDTH + 2 * constants.NODE_PADDING,
        (type === 'join' || type === 'junction'
          ? constants.NODE_JOIN_JUNCTION_HEIGHT
          : constants.NODE_HEIGHT) +
          2 * constants.NODE_PADDING,
      );

export const getNodeCenter = (type, { x, y }) => ({
  x:
    x +
    (type === 'start' ? constants.NODE_START_RADIUS : constants.NODE_CENTER_X),
  y:
    y +
    (type === 'start'
      ? constants.NODE_START_RADIUS
      : type === 'join' || type === 'junction'
        ? constants.NODE_JOIN_JUNCTION_CENTER_Y
        : constants.NODE_CENTER_Y),
});

const concatMap = (map1, map2) =>
  map2.reduce((reduction, value, key) => reduction.set(key, value), map1);

// gets the parents for the given node by searching through the tree's
// connectors by `headId` then retrieving the parent nodes from the tree's node
// map
const getParents = (tree, node) =>
  tree.connectors
    .toList()
    .filter(connector => connector.headId === node.id)
    .map(connector => tree.nodes.get(connector.tailId));

// gets the ancestors for the given node by recursively traversing the parent
// nodes, as a map, the result should not contain duplicates and this processes
// in depth-first order
export const getAncestors = (tree, node, result = Map()) =>
  // get the direct parents of the node, adding them to the result and making
  // recursive call from the parent if necessary
  getParents(tree, node).reduce(
    (reduction, parent) =>
      // if the parent is already inside the result we do not want to re-add and
      // definitely do not want to make a recursive call
      reduction.has(parent.id)
        ? reduction
        : // make the recursive call for ancestors from the parent node (making
          // sure to add it to the result map passed forward), then concat the
          // result of the recursive call with the our current reduction value (so
          // sibling recursive calls will not reprocess nodes already present)
          concatMap(
            reduction,
            getAncestors(tree, parent, reduction.set(parent.id, parent)),
          ),
    result,
  );

// recursive helper that calls bindify if the current raw value is an object
// or returns the leaf value object if not (removing the erb tags at the same
// time)
const bindify = raw =>
  Map(raw)
    .sortBy((_, key) => key)
    .map(
      value =>
        isImmutable(value)
          ? value
          : isObject(value)
            ? Map({ children: bindify(value) })
            : Map({ value: value.replace(/^<%=(.*)%>$/, '$1') }),
    );

export const buildBindings = (tree, tasks, node) => {
  const Results = Map({
    children: tree.nodes
      // convert the node map to use the name as the key
      .mapKeys((_, node) => node.name)
      .sortBy((value, key) => key)
      // normalize the outputs / results property (routine / handler
      // respectively)
      .map(node => {
        const task = tasks.get(node.definitionId);
        return (task && (task.results || task.outputs)) || [];
      })
      // filter out any nodes that have no outputs / results
      .filter(results => results.length > 0)
      // convert the results list to the bindings map using the name property
      // of each result object
      .map((results, nodeNode) =>
        Map({
          children: OrderedMap(
            results.map(result => [
              result.name,
              Map({
                value: `@results['${nodeNode}']['${result.name}']`,
              }),
            ]),
          ),
        }),
      ),
  });
  return bindify(
    Results.get('children').isEmpty()
      ? tree.bindings
      : { ...tree.bindings, Results },
  );
};

// implements the process of adding a new task node and connector to the tree,
// it curries some parameters that should be applied by the click event in the
// parent node, then returns a function called selectTaskDefinition which the
// should be called with a task definition, then it stubs out a node and
// connector and passes a complete function which should be called with the
// fully configured node and connector
export const addNewTask = (treeKey, tree, parent, position) => ({
  tree: tree,
  selectCloneNode: cloneNode =>
    addNewTaskNext({ cloneNode, parent, tree, treeKey }),
  selectTaskDefinition: task =>
    addNewTaskNext({ parent, position, task, tree, treeKey }),
});

const addNewTaskNext = ({
  cloneNode,
  parent,
  position,
  task,
  tree,
  treeKey,
}) => {
  const { connectors, nextConnectorId, nextNodeId, nodes } = tree;
  const definitionId = task ? task.definitionId : cloneNode.definitionId;
  // stub out the new connector and node, these will be provided via return and
  // are meant to be passed to <ConnectorForm> and <NodeForm> respectively to be
  // further configured by the consumer of the <TreeBuilder>
  const connector = Connector({
    id: nextConnectorId,
    headId: nextNodeId,
    tailId: parent.id,
  });
  const node = Node({
    id: nextNodeId,
    position,
    deferrable: task ? task.deferrable : cloneNode.deferrable,
    defers: task ? task.deferrable : cloneNode.defers,
    definitionId,
    visible: task ? task.visible : cloneNode.visible,
    parameters: cloneNode
      ? cloneNode.parameters
      : List(task.parameters || task.inputs || [])
          .map(normalizeParameter)
          .map(NodeParameter),
    messages: cloneNode
      ? cloneNode.messages
      : List(
          task.deferrable ? ['Create', 'Update', 'Complete'] : ['Complete'],
        ).map(type => NodeMessage({ type, value: '' })),
  });
  // add the stubbed connector and node to the current tree, this is done to
  // accommodate the <CodeInput> bindings helper in <ConnectorForm> and
  // <NodeForm>
  const stagedTree = tree.merge({
    connectors: connectors.set(connector.id, connector),
    nextConnectorId: nextConnectorId + 1,
    nextNodeId: nextNodeId + 1,
    nodes: nodes.set(node.id, node),
  });
  // return the pieces of data that will be passed to <ConnectorForm> and
  // <NodeForm> instances and also pass a `complete` function that should be
  // called with the final connector and node records that are to be added to
  // the tree and persisted
  return {
    connector,
    node,
    stagedTree,
    complete: ({ connector, node }) => {
      return dispatch('TREE_UPDATE', {
        treeKey,
        tree: stagedTree
          .setIn(['connectors', connector.id], connector)
          .setIn(['nodes', node.id], node),
      });
    },
  };
};

// regular expression that extracts the content from a string token which will
// be wrapped with the various delimiters
const STRING_CONTENT_REGEX = /((?:%[qQiIwWxs]?)?.)(.*)(.)/;

// takes a erb / ruby strings and checks for references to @results['Node name']
// using the language helpers,
export const parseNodeResultDependencies = (context, value, erb) =>
  (erb ? processErbTemplate : processRuby)(value).reduce(
    ([reduction, index, last1, last2], token) => {
      const [content, type] = token;
      // if the current token is just whitespace we do not want to
      // change the last1, last2 values, just increment the index
      if ((type === undefined || type === 'erb') && content.match(/\s+/)) {
        return [reduction, index + content.length, last1, last2];
      }
      // check to see if this token represents a node name dependency,
      // if it is a string preceded by the [ punctuation preceded by the
      // @results variable
      const match =
        type === 'string' &&
        last1 &&
        last1[0] === '[' &&
        last1[1] === 'punctuation' &&
        last2 &&
        last2[0] === '@results' &&
        last2[1] === 'variable'
          ? content.match(STRING_CONTENT_REGEX)
          : null;
      // if it matched then we add the string's contents to the reduction along
      // with the index of the contents (using the first part of the match to
      // because there are different lengths of delimiters ", %^, %Q(, etc.)
      const newReduction = match
        ? reduction.push(
            NodeResultDependency({
              context: List(context),
              name: match[2],
              index: index + match[1].length,
            }),
          )
        : reduction;
      return [newReduction, index + content.length, token, last1];
    },
    [List(), 0, null, null],
  )[0];

export const getConnectorDependencies = ({ condition, id }) =>
  parseNodeResultDependencies(['connectors', id, 'condition'], condition);

export const getNodeDependencies = ({ id, messages, parameters }) =>
  List().concat(
    messages.flatMap(({ value }, i) =>
      parseNodeResultDependencies(
        ['nodes', id, 'messages', i, 'value'],
        value,
        true,
      ),
    ),
    parameters.flatMap(({ value }, i) =>
      parseNodeResultDependencies(
        ['nodes', id, 'parameters', i, 'value'],
        value,
        true,
      ),
    ),
  );

export const searchNodeResultDependencies = (tree, nodeName) =>
  List()
    .concat(
      tree.connectors.toList().flatMap(getConnectorDependencies),
      tree.nodes.toList().flatMap(getNodeDependencies),
    )
    .filter(dependency => dependency.name === nodeName);

// helper function that curries the dependency record and the new node name and
// then it takes the value and it splices the new node name into the value at
// the index defined in the dependency record also using the length of the old
// name in the dependency record
export const replace = (dependency, newName) => value =>
  value.slice(0, dependency.index) +
  newName +
  value.slice(dependency.index + dependency.name.length);

export const renameDependencies = (dependencies = List(), newName) => tree =>
  dependencies
    // sort the dependencies by index and reverse so that replacements made in
    // the same value will not affect each other (renaming Fooo to Foo would
    // change the index of following dependencies)
    .sortBy(dep => dep.index)
    .reverse()
    .reduce(
      (tree, dependency) =>
        tree.updateIn(dependency.context, replace(dependency, newName)),
      tree,
    );

// routines have `inputs` and handlers have `parameters` with slightly different
// properties so this is a helper function to take one or the other and return
// a consistent object
export const normalizeParameter = ({ name, id, defaultValue, ...rest }) => ({
  id: id || name,
  label: name,
  value: defaultValue,
  ...rest,
});

const defaultOutputs = List([
  { id: 'content', name: 'Content' },
  {
    id: 'content_type',
    name: 'Content Type',
    defaultValue: 'application/json',
  },
  { id: 'headers_json', name: 'Headers (JSON)', defaultValue: '{}' },
  { id: 'response_code', name: 'Response Code', defaultValue: '200' },
]).map(Map);

export const treeReturnTask = tree => ({
  deferrable: false,
  definitionId: 'system_tree_return_v1',
  definitionName: 'system_tree_return',
  definitionVersion: '1',
  description: 'Complete a task tree.',
  name: 'Tree Return',
  selectionCriterion: null,
  status: 'Active',
  visible: false,
  parameters: (tree.definitionId ? tree.outputs : defaultOutputs)
    .map(output => output.toObject())
    .map(output => ({
      name: output.name,
      defaultValue: output.defaultValue || '',
      menu: null,
      dependsOnId: null,
      dependsOnValue: null,
      description: output.description,
      id: output.id || output.name,
      required: false,
    })),
  results: [],
});

export const getNewNodePosition = (node, childNodes) => {
  if (childNodes.length === 0) {
    return node.position.update('y', y => y + NEW_TASK_DY);
  } else if (childNodes.length === 1) {
    return childNodes[0].position.update('x', x => x + NEW_TASK_DX);
  } else {
    const sortedChildren = List(childNodes).sortBy(node => node.position.x);
    const betweenNodes = sortedChildren
      .skip(2)
      // build a list of adjacent pairs of nodes
      .reduce(
        (reduction, child) => reduction.push([reduction.last()[1], child]),
        List.of([sortedChildren.first(), sortedChildren.get(1)]),
      )
      // filter out pairs of nodes that don't have enough space between them
      // for a new node
      .filter(
        ([left, right]) =>
          right.position.x - left.position.x >= NEW_TASK_GAP_REQUIED,
      )
      // use the first pair of nodes with a large enough space between them
      .first();
    if (betweenNodes) {
      const [left, right] = betweenNodes;
      return Point({
        x: (left.position.x + right.position.x) / 2,
        y: (left.position.y + right.position.y) / 2,
      });
    } else {
      return sortedChildren.last().position.update('x', x => x + NEW_TASK_DX);
    }
  }
};

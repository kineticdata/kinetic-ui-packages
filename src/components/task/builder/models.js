import { List, Map, OrderedMap, Record } from 'immutable';

/*******************************************************************************
 * Immutable records                                                           *
 ******************************************************************************/

export const Point = Record({ x: 0, y: 0 }, 'Point');

export const WebApi = Record({
  createdAt: null,
  createdBy: null,
  method: null,
  securityPolicies: null,
  slug: null,
  kappSlug: null,
  updatedAt: null,
  updatedBy: null,
});

export const Tree = Record({
  bindings: OrderedMap(),
  categories: List(),
  connectors: OrderedMap(),
  definitionId: null,
  event: null,
  guid: null,
  inputs: null,
  name: '',
  nextNodeId: 0,
  nextConnectorId: 0,
  nodes: OrderedMap(),
  notes: '',
  outputs: null,
  ownerEmail: '',
  platformItemId: null,
  platformItemType: null,
  schemaVersion: '',
  sourceGroup: '',
  sourceName: '',
  status: '',
  type: '',
  versionId: '0',
});

export const Node = Record({
  configured: true,
  deferrable: false,
  defers: false,
  definitionId: '',
  id: null,
  messages: List(),
  name: '',
  parameters: List(),
  position: Point(),
  version: 1,
  visible: true,
});

export const NodeParameter = Record({
  dependsOnId: '',
  dependsOnValue: '',
  description: '',
  id: '',
  label: '',
  menu: '',
  required: false,
  value: '',
});

export const NodeMessage = Record({ type: '', value: '' });

export const Connector = Record({
  condition: '',
  headId: null,
  id: null,
  label: '',
  tailId: null,
  type: 'Complete',
});

export const TreeBuilderState = Record({
  categories: OrderedMap(),
  error: null,
  kappSlug: null,
  lastSave: null,
  lastWebApi: null,
  loading: true,
  platformItem: null,
  redoStack: List(),
  saving: false,
  tasks: OrderedMap(),
  tree: null,
  undoStack: List(),
  webApi: null,
});

export const NodeResultDependency = Record({
  // where the dependency was found, one of:
  // connector id | node id message type | node id parameter id
  context: List(),
  // name of the node being referenced
  name: '',
  // position of the node name in the value
  index: 0,
});

/*******************************************************************************
 * Serialization functions                                                     *
 * Should take native objects that are returned from the API endpoints and     *
 * convert them to immutable records used by the builder implementation        *
 ******************************************************************************/

const deserializeNodeId = id => {
  const match = id.match(/_(\d+)$/);
  // the start node will not match the pattern above so we give that an id of 0
  return match ? parseInt(match[1]) : 0;
};

export const serializeNodeId = node =>
  node.id === 0 ? 'start' : `${node.definitionId}_${node.id}`;

export const deserializeNode = ({
  id,
  messages,
  parameters,
  position,
  ...props
}) => {
  return Node({
    ...props,
    id: deserializeNodeId(id),
    messages: List(messages.map(NodeMessage)),
    parameters: List(parameters.map(NodeParameter)),
    position: Point(position),
  });
};

export const serializeNode = node =>
  node.set('id', serializeNodeId(node)).toJS();

export const deserializeConnector = ({ from, label, to, type, value }, id) => {
  const headId = deserializeNodeId(to);
  const tailId = deserializeNodeId(from);
  return Connector({
    condition: value,
    headId,
    id,
    label,
    tailId,
    type,
  });
};

export const serializeConnector = nodes => ({
  condition,
  headId,
  label,
  tailId,
  type,
}) => ({
  from: serializeNodeId(nodes.get(tailId)),
  label,
  to: serializeNodeId(nodes.get(headId)),
  type,
  value: condition,
});

export const deserializeTree = ({
  bindings,
  categories,
  definitionId,
  event,
  guid,
  inputs,
  name,
  notes,
  outputs,
  ownerEmail,
  platformItemId,
  platformItemType,
  sourceGroup,
  sourceName,
  status,
  treeJson,
  type,
  versionId,
}) =>
  Tree({
    bindings,
    categories: List(categories).map(c => c.name),
    connectors: OrderedMap(
      treeJson.connectors.map(deserializeConnector).map(c => [c.id, c]),
    ),
    definitionId,
    event,
    guid,
    inputs: List(inputs).map(Map),
    name,
    notes,
    outputs: List(outputs).map(Map),
    ownerEmail,
    platformItemId,
    platformItemType,
    nextNodeId: treeJson.lastId + 1,
    nextConnectorId: treeJson.connectors.length,
    nodes: OrderedMap(treeJson.nodes.map(deserializeNode).map(n => [n.id, n])),
    schemaVersion: treeJson.schemaVersion,
    sourceGroup,
    sourceName,
    status,
    type,
    versionId,
  });

export const serializeTree = (
  {
    connectors,
    categories,
    definitionId,
    event,
    inputs,
    name,
    nextNodeId,
    nodes,
    notes,
    outputs,
    ownerEmail,
    platformItemId,
    platformItemType,
    schemaVersion,
    sourceGroup,
    sourceName,
    status,
    versionId,
  },
  overwrite = false,
) => ({
  categories,
  definitionId,
  event,
  inputs,
  name,
  notes,
  outputs,
  ownerEmail,
  platformItemId,
  platformItemType,
  sourceGroup,
  sourceName,
  status,
  treeJson: {
    connectors: connectors
      .toList()
      .map(serializeConnector(nodes))
      .toJS(),
    lastId: nextNodeId - 1,
    nodes: nodes
      .toList()
      .map(serializeNode)
      .toJS(),
    schemaVersion,
  },
  versionId: overwrite ? null : versionId,
});

export const deserializeWebApi = (
  {
    createdAt,
    createdBy,
    method,
    securityPolicies,
    slug,
    updatedAt,
    updatedBy,
  },
  kappSlug,
) =>
  WebApi({
    createdAt,
    createdBy,
    method,
    securityPolicies: List(securityPolicies).map(Map),
    slug,
    kappSlug,
    updatedAt,
    updatedBy,
  });

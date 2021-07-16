import React, { createRef, Component, Fragment } from 'react';
import { pick } from 'lodash-es';
import { connect, dispatch } from '../../../store';
import { configureTreeBuilder } from './builder.redux';
import * as constants from './constants';
import { isPointInNode } from './helpers';
import { Connector as ConnectorModel } from './models';
import { SvgCanvas } from './SvgCanvas';
import { Node } from './Node';
import { Connector } from './Connector';
import { is } from 'immutable';

export class TreeBuilderComponent extends Component {
  constructor(props) {
    super(props);
    this.state = { newConnector: null };
    this.newConnector = createRef();
    this.canvasRef = createRef();
    this.connectorMap = {
      byHead: {},
      byTail: {},
    };
    this.nodeMap = {};
    this.sidebarRef = createRef();
  }

  componentDidMount() {
    this.checkConfig();
    this.checkHighlight();
    window.addEventListener('beforeunload', this.beforeunload.bind(this));
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    this.checkConfig();
    this.checkHighlight(prevProps);
    window.removeEventListener('beforeunload', this.beforeunload.bind(this));
  }

  beforeunload(e) {
    if (this.isDirty(this.props.treeBuilderState)) {
      e.preventDefault();
      e.returnValue = true;
    }
  }

  checkConfig() {
    // until this instance of the tree builder is mounted the builder state will
    // be undefined (not in redux at all), once mounted it will be set to a null
    // placeholder then we will call configureTreeBuilder with the component's
    // props at that time
    if (this.props.treeBuilderState === null) {
      configureTreeBuilder(
        pick(this.props, ['treeKey', 'sourceName', 'sourceGroup', 'name']),
      );
    }
  }

  checkHighlight(prevProps = {}) {
    if (this.props.treeBuilderState && !this.props.treeBuilderState.loading) {
      // one the first "real" render of the tree builder check for the highlight
      // node and focus if one is specified
      if (
        (!prevProps.treeBuilderState || prevProps.treeBuilderState.loading) &&
        this.props.highlight
      ) {
        this.panTo(this.props.highlight);
      }
      // otherwise check for changes to the highlight prop and focus if it changes
      // and its a truthy value
      else if (
        this.props.highlight &&
        !this.props.highlight.equals(prevProps.highlight)
      ) {
        this.panTo(this.props.highlight);
      }
    }
  }

  findNodeByPoint = point => this.props.tree.nodes.find(isPointInNode(point));

  findDuplicateConnector = (nodeId1, nodeId2) =>
    this.props.tree.connectors.some(
      connector =>
        (connector.headId === nodeId1 && connector.tailId === nodeId2) ||
        (connector.headId === nodeId2 && connector.tailId === nodeId1),
    );

  panTo = ([type, id]) => {
    if (type === 'node') {
      const node = this.props.tree.nodes.find(node => node.name === id);
      if (node) {
        this.canvasRef.current.focusPoint(
          {
            x: node.position.x + constants.NODE_CENTER_X,
            y: node.position.y + constants.NODE_CENTER_Y,
          },
          this.sidebarRef.current,
        );
      }
    } else {
      const connector = this.props.tree.connectors.find(
        connector => connector.id === id,
      );
      const headPosition = this.props.tree.nodes.get(connector.headId).position;
      const tailPosition = this.props.tree.nodes.get(connector.tailId).position;
      this.canvasRef.current.focusPoint(
        {
          x: (headPosition.x + tailPosition.x + constants.NODE_WIDTH) / 2,
          y: (headPosition.y + tailPosition.y + constants.NODE_HEIGHT) / 2,
        },
        this.sidebarRef.current,
      );
    }
  };

  getConnectorsByHead = nodeId =>
    Object.values(this.connectorMap.byHead[nodeId] || {});

  getConnectorsByTail = nodeId =>
    Object.values(this.connectorMap.byTail[nodeId] || {});

  getChildNodes = nodeId =>
    Object.keys(this.connectorMap.byTail[nodeId] || {})
      .map(connectorId => this.props.tree.connectors.get(parseInt(connectorId)))
      .map(connector => this.props.tree.nodes.get(connector.headId));

  // helper provided so that the plus button on a node can start the process of
  // creating a new connector, since the drop position may not be valid we do
  // not want to persist anything to redux state until we can confirm the drop
  // is valid so we store the temp connector in component state so it will be
  // rendered and then on move we update the Connector instance (by ref) with
  // the new position
  dragNewConnector = node => position => {
    if (!this.state.newConnector) {
      this.setState(state => ({
        newConnector: state.newConnector || ConnectorModel({ tailId: node.id }),
      }));
    }
    if (this.newConnector.current) {
      this.newConnector.current.setTreeBuilder(this);
      this.newConnector.current.setHead(position, true);
    }
  };

  // helper provided so that the plus button on a node can create a new
  // connector in conjunction with `dragNewConnector` above
  dropNewConnector = () => {
    if (this.newConnector.current) {
      this.newConnector.current.dropHead();
    }
    this.setState({ newConnector: null });
  };

  registerConnector = connector => connectorInstance => {
    const { headId, id, tailId } = connector;
    this.connectorMap.byHead[headId] = this.connectorMap.byHead[headId] || {};
    this.connectorMap.byTail[tailId] = this.connectorMap.byTail[tailId] || {};
    if (connectorInstance) {
      connectorInstance.setTreeBuilder(this);
      this.connectorMap.byHead[headId][id] = connectorInstance;
      this.connectorMap.byTail[tailId][id] = connectorInstance;
    } else {
      delete this.connectorMap.byHead[headId][id];
      delete this.connectorMap.byTail[tailId][id];
    }
  };

  registerNode = node => nodeInstance => {
    const { id } = node;
    if (nodeInstance) {
      nodeInstance.setTreeBuilder(this);
      this.nodeMap[id] = nodeInstance;
    } else {
      delete this.nodeMap[id];
    }
  };

  watchDrag = (...args) => this.canvasRef.current.watchDrag(...args);

  isDirty = treeBuilderState =>
    treeBuilderState && !is(treeBuilderState.lastSave, treeBuilderState.tree);

  render() {
    const { highlight, selected, treeBuilderState, treeKey } = this.props;
    const [highlightType, highlightId] = highlight || [];
    if (treeBuilderState) {
      const { redoStack, saving, tasks, tree, undoStack } = treeBuilderState;
      return this.props.children({
        actions: {
          deleteConnector: id =>
            dispatch('TREE_REMOVE_CONNECTOR', { treeKey, id }),
          deleteNode: id => dispatch('TREE_REMOVE_NODE', { treeKey, id }),
          updateConnector: values =>
            dispatch('TREE_UPDATE_CONNECTOR', { treeKey, ...values }),
          updateNode: (values, dependencies) =>
            dispatch('TREE_UPDATE_NODE', { treeKey, ...values, dependencies }),
          save: ({
            overwrite = false,
            newName = '',
            onError = this.props.onError,
            onSave = this.props.onSave,
          }) => {
            dispatch('TREE_SAVE', {
              newName,
              overwrite,
              onError,
              onSave,
              treeKey,
            });
          },
          undo: !undoStack.isEmpty()
            ? () => dispatch('TREE_UNDO', { treeKey })
            : null,
          redo: !redoStack.isEmpty()
            ? () => dispatch('TREE_REDO', { treeKey })
            : null,
          zoomIn: () => this.canvasRef.current.zoomIn(),
          zoomOut: () => this.canvasRef.current.zoomOut(),
        },
        dirty: this.isDirty(treeBuilderState),
        name: tree ? tree.name : null,
        saving,
        sidebarRef: this.sidebarRef,
        tasks,
        tree,
        treeBuilder: tree && (
          <Fragment>
            <SvgCanvas ref={this.canvasRef}>
              {tree.connectors
                .map(connector => (
                  <Connector
                    key={connector.id}
                    ref={this.registerConnector(connector)}
                    treeKey={treeKey}
                    connector={connector}
                    headNode={tree.nodes.get(connector.headId)}
                    tailNode={tree.nodes.get(connector.tailId)}
                    highlighted={
                      highlightType === 'connector' &&
                      highlightId === connector.id
                    }
                    primary={
                      selected.getIn([0, 'connectorId']) === connector.id
                    }
                    selected={selected.some(
                      ({ connectorId }) => connectorId === connector.id,
                    )}
                    onSelect={this.props.onSelectConnector}
                  />
                ))
                .toList()}
              {this.state.newConnector && (
                <Connector
                  ref={this.newConnector}
                  treeKey={treeKey}
                  connector={this.state.newConnector}
                  tailNode={tree.nodes.get(this.state.newConnector.tailId)}
                />
              )}
              {tree.nodes
                .map(node => (
                  <Node
                    key={node.id}
                    ref={this.registerNode(node)}
                    treeKey={treeKey}
                    node={node}
                    highlighted={
                      highlightType === 'node' && highlightId === node.name
                    }
                    primary={selected.getIn([0, 'nodeId']) === node.id}
                    selected={selected.some(({ nodeId }) => nodeId === node.id)}
                    onNew={this.props.onNew}
                    onSelect={this.props.onSelectNode}
                    tasks={tasks}
                    tree={tree}
                  />
                ))
                .toList()}
            </SvgCanvas>
          </Fragment>
        ),
      });
    }
    return null;
  }
}

const mapStateToProps = (state, props) => ({
  treeBuilderState: state.getIn(['trees', props.treeKey]),
  tree: state.getIn(['trees', props.treeKey, 'tree']),
});
export const TreeBuilder = connect(mapStateToProps)(TreeBuilderComponent);

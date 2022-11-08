import React, { Component, createRef, Fragment } from 'react';
import classNames from 'classnames';
import { is } from 'immutable';
import { dispatch } from '../../../store';
import * as constants from './constants';
import { getNodeType, getRectIntersections, isIE11 } from './helpers';
import { SvgText } from './SvgText';
import filter from '../../../../assets/task/icons/filter.svg';
import { isNumber } from 'lodash-es';

export class Connector extends Component {
  constructor(props) {
    super(props);
    this.connector = createRef();
    this.connectorBody = createRef();
    this.connectorTail = createRef();
    this.connectorLabel = createRef();
  }

  setTreeBuilder = treeBuilder => {
    this.treeBuilder = treeBuilder;
  };

  /*****************************************************************************
   * Click handlers                                                            *
   ****************************************************************************/

  onSelect = event => {
    if (typeof this.props.onSelect === 'function') {
      this.props.onSelect(this.props.connector, event.shiftKey);
    }
  };

  /*****************************************************************************
   * Drag-and-drop support                                                     *
   * Leverages the `watchDrag` helper exposed by the `TreeBuilder` instance.   *
   * On move we update this instance's `head` or `tail` properties and set     *
   * `dragging` to either "head" or "tail" so that the `draw` method knows if  *
   * we are drawing to a dragging point or to the center of a node.            *
   * On drop we check to see if the point we are dropping at is within a node  *
   * (we check that its a valid node as well) and dispatch a redux action to   *
   * persist the change or we reset the `head` or `tail` properties and `draw` *
   ****************************************************************************/

  dragHead = event => {
    this.treeBuilder.watchDrag({
      relative: false,
      event,
      onMove: this.setHead,
      onDrop: this.dropHead,
    });
  };

  dragTail = event => {
    this.treeBuilder.watchDrag({
      relative: false,
      event,
      onMove: this.setTail,
      onDrop: this.dropTail,
    });
  };

  dropHead = () => {
    const node = this.treeBuilder.findNodeByPoint(this.head);
    const { headId, id, tailId } = this.props.connector;
    if (
      node &&
      node.id !== headId &&
      node.id !== tailId &&
      !this.treeBuilder.findDuplicateConnector(node.id, tailId)
    ) {
      isNumber(id)
        ? dispatch('TREE_UPDATE_CONNECTOR_HEAD', {
            treeKey: this.props.treeKey,
            id,
            nodeId: node.id,
          })
        : dispatch('TREE_ADD_CONNECTOR', {
            treeKey: this.props.treeKey,
            tailId: this.props.connector.tailId,
            headId: node.id,
          });
    }
    // when dropping a new connector the `headNode` prop will be undefined
    else if (this.props.headNode) {
      this.setHead(this.props.headNode.position, false);
    }
  };

  dropTail = () => {
    const node = this.treeBuilder.findNodeByPoint(this.tail);
    const { headId, id, tailId } = this.props.connector;
    if (
      node &&
      node.id !== headId &&
      node.id !== tailId &&
      !this.treeBuilder.findDuplicateConnector(node.id, headId)
    ) {
      dispatch('TREE_UPDATE_CONNECTOR_TAIL', {
        treeKey: this.props.treeKey,
        id,
        nodeId: node.id,
      });
    } else {
      this.setTail(this.props.tailNode.position, false);
    }
  };

  // Dragging will be true when dragging by the head and false when called via
  // dragging node.
  setHead = (point, dragging = true) => {
    this.dragging = dragging ? 'head' : null;
    this.head = point;
    this.draw();
  };

  // Dragging will be true when dragging by the tail and false when called via
  // dragging node.
  setTail = (point, dragging = true) => {
    this.dragging = dragging ? 'tail' : null;
    this.tail = point;
    this.draw();
  };

  /*****************************************************************************
   * React lifecycle                                                           *
   * Check the `connector` prop for change, which should be an immutable       *
   * record. If that prop changes we need to sync the instance's `head` and    *
   * `tail` values and call `draw`.                                            *
   ****************************************************************************/

  shouldComponentUpdate(nextProps) {
    return (
      !is(this.props.connector, nextProps.connector) ||
      !is(this.props.headNode, nextProps.headNode) ||
      !is(this.props.tailNode, nextProps.tailNode) ||
      this.props.highlighted !== nextProps.highlighted ||
      this.props.primary !== nextProps.primary ||
      this.props.selected !== nextProps.selected
    );
  }

  componentDidMount() {
    this.sync();
  }

  componentDidUpdate() {
    this.sync();
  }

  sync() {
    this.dragging = null;
    this.tail = this.props.tailNode.position;
    this.tailType = getNodeType(this.props.tailNode);
    // when dragging a new connector, there will not be a `headNode` prop passed
    // so in that case do not want to call draw until `this.head` is set after
    // mouse move
    if (this.props.headNode) {
      this.head = this.props.headNode.position;
      this.headType = getNodeType(this.props.headNode);
      this.draw();
    }
  }

  /*****************************************************************************
   * Rendering                                                                 *
   * To make the drag-and-drop perform as fast as possible we manually         *
   * manipulate some DOM elements in the `draw` method below. Anything that    *
   * changes the instance's `head` or `tail` properties should also call       *
   * `draw`                                                                    *
   ****************************************************************************/

  draw = () => {
    this.connector.current.parentElement.style.display = '';
    const [{ x: x1, y: y1 }, { x: x2, y: y2 }] = getRectIntersections(this);
    const dx = x2 - x1;
    const dy = y2 - y1;
    const length = Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));
    const angle = (Math.atan2(dy, dx) * 180) / Math.PI + 180;
    const connectorValue = isIE11
      ? `translate(${x2} ${y2}) rotate(${angle})`
      : `translate(${x2}px, ${y2}px) rotate(${angle}deg)`;
    const connectorLabelValue = isIE11
      ? `translate(${x1 + dx / 2} ${y1 + dy / 2})`
      : `translate(${x1 + dx / 2}px, ${y1 + dy / 2}px)`;

    if (isIE11) {
      this.connector.current.transform = connectorValue;
      if (this.connectorLabel.current) {
        this.connectorLabel.current.transform = connectorLabelValue;
      }
    } else {
      this.connector.current.style.transform = connectorValue;
      if (this.connectorLabel.current) {
        this.connectorLabel.current.style.transform = connectorLabelValue;
      }
    }

    // this.connector.current.setAttribute(attribute, connectorValue);
    if (this.connectorTail.current) {
      this.connectorTail.current.setAttribute('cx', length);
    }
    this.connectorBody.current.setAttribute('x2', length);
    // if (this.connectorLabel.current) {
    //   this.connectorLabel.current.setAttribute(attribute, connectorLabelValue);
    // }
  };

  render() {
    const {
      connector,
      headNode,
      highlighted,
      primary,
      selected,
      tailNode,
    } = this.props;
    const { condition, id, label, type } = connector;
    const invalid = condition && !label;
    const loop =
      getNodeType(tailNode) === 'loop-head' &&
      getNodeType(headNode) === 'loop-tail';
    return (
      <g
        className={classNames('connector', {
          highlighted,
          invalid,
          loop,
          primary,
          selected,
          complete: type === 'Complete',
          create: type === 'Create',
          update: type === 'Update',
        })}
        style={{ display: 'none' }}
      >
        <g ref={this.connector}>
          <line
            ref={this.connectorBody}
            className="connector-body"
            x1="0"
            y1="0"
            y2="0"
            strokeWidth={constants.CONNECTOR_STROKE_WIDTH}
          />
          {!loop && (
            <circle
              ref={this.connectorTail}
              className="connector-tail high-detail"
              r={constants.CONNECTOR_TAIL_RADIUS}
              cy="0"
              onMouseDown={this.dragTail}
            />
          )}
          {!loop && (
            <polygon
              className="connector-head high-detail"
              points={constants.CONNECTOR_HEAD_POINTS}
              onMouseDown={this.dragHead}
            />
          )}
        </g>
        {id !== null && (
          <g
            ref={this.connectorLabel}
            className="connector-button"
            onClick={this.onSelect}
          >
            {loop ? (
              <g transform="rotate(45)">
                <rect
                  x={-constants.ICON_CENTER}
                  y={-constants.ICON_CENTER}
                  height={constants.ICON_SIZE}
                  width={constants.ICON_SIZE}
                  rx={constants.CONNECTOR_LABEL_RADIUS}
                  ry={constants.CONNECTOR_LABEL_RADIUS}
                  strokeWidth={constants.NODE_DECORATION_STROKE_WIDTH}
                />
              </g>
            ) : label ? (
              <Fragment>
                <rect
                  className="high-detail"
                  x={-constants.CONNECTOR_LABEL_CENTER_X}
                  y={-constants.CONNECTOR_LABEL_CENTER_Y}
                  height={constants.CONNECTOR_LABEL_HEIGHT}
                  width={constants.CONNECTOR_LABEL_WIDTH}
                  rx={constants.CONNECTOR_LABEL_RADIUS}
                  ry={constants.CONNECTOR_LABEL_RADIUS}
                />
                <SvgText
                  className="connector-label med-detail"
                  x={-constants.CONNECTOR_LABEL_CENTER_X}
                  y={-constants.CONNECTOR_LABEL_CENTER_Y}
                  width={constants.CONNECTOR_LABEL_WIDTH}
                  height={constants.CONNECTOR_LABEL_HEIGHT}
                  padding={constants.CONNECTOR_LABEL_PADDING}
                >
                  {label}
                </SvgText>
              </Fragment>
            ) : (
              <Fragment>
                <rect
                  className="high-detail"
                  x={-constants.ICON_CENTER}
                  y={-constants.ICON_CENTER}
                  height={constants.ICON_SIZE}
                  width={constants.ICON_SIZE}
                  rx={constants.CONNECTOR_LABEL_RADIUS}
                  ry={constants.CONNECTOR_LABEL_RADIUS}
                />
                <image
                  className="high-detail"
                  xlinkHref={filter}
                  x={-constants.ICON_CENTER}
                  y={-constants.ICON_CENTER}
                  height={constants.ICON_SIZE}
                  width={constants.ICON_SIZE}
                />
              </Fragment>
            )}
          </g>
        )}
      </g>
    );
  }
}

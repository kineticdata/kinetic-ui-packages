import React, { Component, createRef, Fragment } from 'react';
import classNames from 'classnames';
import { dispatch } from '../../../store';
import * as constants from './constants';
import { getRectIntersections, isIE11 } from './helpers';
import { SvgText } from './SvgText';
import filter from '../../../assets/task/icons/filter.svg';

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
    const { headId, headPosition, id, tailId } = this.props.connector;
    if (
      node &&
      node.id !== headId &&
      node.id !== tailId &&
      !this.treeBuilder.findDuplicateConnector(node.id, tailId)
    ) {
      id
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
    } else {
      this.setHead(headPosition, false);
    }
  };

  dropTail = () => {
    const node = this.treeBuilder.findNodeByPoint(this.tail);
    const { headId, id, tailId, tailPosition } = this.props.connector;
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
      this.setTail(tailPosition, false);
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
      !this.props.connector.equals(nextProps.connector) ||
      this.props.primary !== nextProps.primary ||
      this.props.selected !== nextProps.selected
    );
  }

  componentDidMount() {
    this.dragging = this.props.connector.dragging;
    this.tail = this.props.connector.tailPosition;
    this.head = this.props.connector.headPosition;
    this.draw();
  }

  componentDidUpdate() {
    this.dragging = this.props.connector.dragging;
    this.tail = this.props.connector.tailPosition;
    this.head = this.props.connector.headPosition;
    this.draw();
  }

  /*****************************************************************************
   * Rendering                                                                 *
   * To make the drag-and-drop perform as fast as possible we manually         *
   * manipulate some DOM elements in the `draw` method below. Anything that    *
   * changes the instance's `head` or `tail` properties should also call       *
   * `draw`                                                                    *
   ****************************************************************************/

  draw = () => {
    const [{ x: x1, y: y1 }, { x: x2, y: y2 }] = getRectIntersections(this);
    const dx = x2 - x1;
    const dy = y2 - y1;
    const length = Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));
    const angle = (Math.atan2(dy, dx) * 180) / Math.PI + 180;
    const attribute = isIE11 ? 'transform' : 'style';
    const connectorValue = isIE11
      ? `translate(${x2} ${y2}) rotate(${angle})`
      : `transform: translate(${x2}px, ${y2}px) rotate(${angle}deg)`;
    const connectorLabelValue = isIE11
      ? `translate(${x1 + dx / 2} ${y1 + dy / 2})`
      : `transform: translate(${x1 + dx / 2}px, ${y1 + dy / 2}px)`;
    this.connector.current.setAttribute(attribute, connectorValue);
    this.connectorTail.current.setAttribute('cx', length);
    this.connectorBody.current.setAttribute('x2', length);
    if (this.connectorLabel.current) {
      this.connectorLabel.current.setAttribute(attribute, connectorLabelValue);
    }
  };

  render() {
    const { connector, primary, selected } = this.props;
    const { condition, id, label, type } = connector;
    const invalid = condition && !label;
    return (
      <g
        className={classNames('connector', {
          invalid,
          primary,
          selected,
          complete: type === 'Complete',
          create: type === 'Create',
          update: type === 'Update',
        })}
      >
        <g ref={this.connector}>
          <line
            ref={this.connectorBody}
            className="connector-body"
            x1="0"
            y1="0"
            y2="0"
          />
          <circle
            ref={this.connectorTail}
            className="connector-tail high-detail"
            r={constants.CONNECTOR_TAIL_RADIUS}
            cy="0"
            onMouseDown={this.dragTail}
          />
          <polygon
            className="connector-head high-detail"
            points={constants.CONNECTOR_HEAD_POINTS}
            onMouseDown={this.dragHead}
          />
        </g>
        {id !== null && (
          <g
            ref={this.connectorLabel}
            className="connector-button"
            onClick={this.onSelect}
          >
            <rect
              className="high-detail"
              x={-constants.ICON_CENTER}
              y={-constants.ICON_CENTER}
              height={constants.ICON_SIZE}
              width={constants.ICON_SIZE}
              rx={constants.CONNECTOR_LABEL_RADIUS}
              ry={constants.CONNECTOR_LABEL_RADIUS}
            />
            {label ? (
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
              <image
                className="high-detail"
                xlinkHref={filter}
                x={-constants.ICON_CENTER}
                y={-constants.ICON_CENTER}
                height={constants.ICON_SIZE}
                width={constants.ICON_SIZE}
              />
            )}
          </g>
        )}
      </g>
    );
  }
}

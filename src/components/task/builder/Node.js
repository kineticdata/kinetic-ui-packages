import React, { Component, createRef } from 'react';
import { isArray, isFunction } from 'lodash-es';
import classNames from 'classnames';
import { dispatch } from '../../../store';
import * as constants from './constants';
import { addNewTask, getNodeType, isIE11 } from './helpers';
import { Point } from './models';
import { SvgText } from './SvgText';
import plusIcon from '../../../assets/task/icons/plus_small.svg';

export class Node extends Component {
  constructor(props) {
    super(props);
    this.el = createRef();
  }

  setTreeBuilder(treeBuilder) {
    this.treeBuilder = treeBuilder;
  }

  /*****************************************************************************
   * Click handlers                                                            *
   ****************************************************************************/

  addNewNode = () => {
    if (isFunction(this.props.onNew)) {
      this.props.onNew(
        addNewTask(this.props.treeKey, this.props.tree, this.props.node),
      );
    }
  };

  onSelect = shiftKey => () => {
    if (isFunction(this.props.onSelect)) {
      this.props.onSelect(this.props.node, shiftKey);
    }
  };

  /*****************************************************************************
   * Drag-and-drop support                                                     *
   * Leverages the `watchDrag` helper exposed by the `TreeBuilder` instance.   *
   * On move we need to update any related connectors manually (for maximum    *
   * performance).                                                             *
   * On drop we dispatch an action to update the node in redux to persist the  *
   * change.                                                                   *
   * We also watch for drag on the plus button, which should leverage the      *
   * `TreeBuilder` instance to start creating a new connector                  *
   ****************************************************************************/

  drag = event => {
    this.treeBuilder.watchDrag({
      event,
      onMove: this.move,
      onDrop: this.drop,
      onClick: this.onSelect(event.shiftKey),
    });
  };

  dragPlus = event => {
    this.treeBuilder.watchDrag({
      event,
      relative: false,
      onMove: this.treeBuilder.dragNewConnector(this.props.node),
      onDrop: this.treeBuilder.dropNewConnector,
      onClick: this.addNewNode,
    });
  };

  drop = () => {
    dispatch('TREE_UPDATE_NODE_POSITION', {
      treeKey: this.props.treeKey,
      id: this.props.node.id,
      position: this.position,
    });
  };

  move = ({ dx, dy }) => {
    this.position = Point({ x: this.position.x + dx, y: this.position.y + dy });
    this.treeBuilder
      .getConnectorsByHead(this.props.node.id)
      .forEach(connector => connector.setHead(this.position, false));

    this.treeBuilder
      .getConnectorsByTail(this.props.node.id)
      .forEach(connector => connector.setTail(this.position, false));
    this.draw();
  };

  /*****************************************************************************
   * React lifecycle                                                           *
   * Check the `node` prop for change, which should be an immutable record.    *
   * If that prop changes we need to sync the instance's `position` value and  *
   * call `draw`.                                                              *
   ****************************************************************************/

  shouldComponentUpdate(nextProps) {
    return (
      !this.props.node.equals(nextProps.node) ||
      this.props.primary !== nextProps.primary ||
      this.props.selected !== nextProps.selected ||
      this.props.highlighted !== nextProps.highlighted
    );
  }

  componentDidMount() {
    this.position = this.props.node.position;
    this.draw();
  }

  componentDidUpdate() {
    this.position = this.props.node.position;
    this.draw();
  }

  /*****************************************************************************
   * Rendering                                                                 *
   * To make the drag-and-drop perform as fast as possible we manually         *
   * manipulate some DOM elements in the `draw` method below. Anything that    *
   * changes the instance's `position` property should also call `draw`        *
   ****************************************************************************/

  draw() {
    const attribute = isIE11 ? 'transform' : 'style';
    const value = isIE11
      ? `translate(${this.position.x} ${this.position.y})`
      : `transform: translate(${this.position.x}px,  ${this.position.y}px)`;
    this.el.current.setAttribute(attribute, value);
  }

  render() {
    const { node, highlighted, primary, selected, tasks } = this.props;
    const { defers, definitionId, name } = node;
    const invalid =
      !name ||
      node.parameters.some(
        parameter => parameter.required && parameter.value === '',
      );
    const isRoutine =
      tasks.get(definitionId) && isArray(tasks.get(definitionId).inputs);
    const type = getNodeType(node);
    const height =
      type === 'join' || type === 'junction'
        ? constants.NODE_JOIN_JUNCTION_HEIGHT
        : type === 'start'
        ? constants.NODE_START_RADIUS * 2
        : constants.NODE_HEIGHT;
    const width =
      type === 'start' ? constants.NODE_START_RADIUS * 2 : constants.NODE_WIDTH;
    return (
      <g ref={this.el}>
        {type === 'start' ? (
          <circle
            className={classNames('node', type, {
              highlighted,
              invalid,
              primary,
              selected,
            })}
            cx={constants.NODE_START_RADIUS}
            cy={constants.NODE_START_RADIUS}
            r={constants.NODE_START_RADIUS}
            strokeWidth={constants.NODE_STROKE_WIDTH}
            onMouseDown={this.drag}
          />
        ) : (
          <rect
            className={classNames('node', type, {
              highlighted,
              invalid,
              primary,
              selected,
            })}
            height={height}
            width={constants.NODE_WIDTH}
            rx={constants.NODE_RADIUS}
            ry={constants.NODE_RADIUS}
            strokeWidth={constants.NODE_STROKE_WIDTH}
            onMouseDown={this.drag}
          />
        )}
        <SvgText
          className={classNames('node-name med-detail', type)}
          x={0}
          y={0}
          height={height}
          width={width}
          padding={constants.NODE_NAME_PADDING}
        >
          {type === 'junction' ? 'Junction' : type === 'join' ? 'Join' : name}
        </SvgText>
        {isRoutine && (
          <path d={constants.NODE_LEFT_BAR_PATH} className="routine-bar" />
        )}
        {type === 'loop-head' && (
          <path d={constants.NODE_BOTTOM_BAR_PATH} className="loop-bar" />
        )}
        {type === 'loop-tail' && (
          <path d={constants.NODE_TOP_BAR_PATH} className="loop-bar" />
        )}
        {defers && (
          <path d={constants.NODE_CORNER_TAB_PATH} className="defers-tab" />
        )}
        <image
          className="high-detail"
          xlinkHref={plusIcon}
          height={constants.ICON_SIZE}
          width={constants.ICON_SIZE}
          x={
            (type === 'start'
              ? constants.NODE_START_RADIUS
              : constants.NODE_CENTER_X) - constants.ICON_CENTER
          }
          y={height - constants.ICON_CENTER}
          onMouseDown={this.dragPlus}
        />
      </g>
    );
  }
}

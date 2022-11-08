import React, { createRef, Component } from 'react';
import { throttle } from 'lodash-es';
import { isIE11 } from './helpers';
import * as constants from './constants';
import { Point } from './models';

export class SvgCanvas extends Component {
  constructor(props) {
    super(props);
    this.canvas = createRef();
    this.transformer = createRef();
    // Since the scroll event is throttled and we get the incremental scroll
    // changes we need to accumulate them outside of the throttled logic.
    this.scrollDelta = 0;
    this.viewport = { largeMode: false, scale: 1.0, x: 80, y: 32 };
  }

  watchDrag = ({
    event,
    nativeEvent,
    onClick,
    onMove,
    onDrop,
    scaled = true,
    relative = true,
  }) => {
    event && event.preventDefault();
    event && event.stopPropagation();
    // boolean to prevent race condition where onMove could be called after
    // onDrop was called
    let dragging = false;
    // set a threshold before we consider the mode to be dragging to prevent
    // clicks that result as really short drags
    setTimeout(() => (dragging = true), 100);
    // track whether or not the mousemove event was fired before the mouseup,
    // if not we will call onClick instead of onDrop
    let dragged = false;
    // for relative mode, track the last x and y positions so we can pass the
    // deltas to onMove
    let lastX = event ? event.nativeEvent.clientX : nativeEvent.clientX;
    let lastY = event ? event.nativeEvent.clientY : nativeEvent.clientY;
    // for non-relative mode we want to calculate the virtual position in the
    // canvas, to do this we need to subtract the offsets below from the client
    // position (this is because offsetX and offsetY can't be trusted in IE).
    const offsetLeft = this.canvas.current.parentNode.offsetLeft;
    const offsetTop = this.canvas.current.parentNode.offsetTop;
    const moveHandler = throttle(event => {
      event.preventDefault();
      event.stopPropagation();
      const { clientX, clientY } = event;
      if (dragging) {
        dragged = true;
        if (relative) {
          const dx = (clientX - lastX) / (scaled ? this.viewport.scale : 1);
          const dy = (clientY - lastY) / (scaled ? this.viewport.scale : 1);
          lastX = clientX;
          lastY = clientY;
          onMove({ dx, dy });
        } else {
          const x =
            (clientX - offsetLeft - this.viewport.x) / this.viewport.scale;
          const y =
            (clientY - offsetTop - this.viewport.y) / this.viewport.scale;
          onMove(Point({ x, y }));
        }
      }
    }, constants.THROTTLE_DRAG);
    const dropHandler = event => {
      event.preventDefault();
      event.stopPropagation();
      dragging = false;
      this.canvas.current.removeEventListener('mousemove', moveHandler);
      this.canvas.current.removeEventListener('mouseup', dropHandler);
      this.canvas.current.removeEventListener('mouseleave', dropHandler);
      if (dragged) {
        if (onDrop) {
          onDrop();
        }
      } else {
        if (onClick) {
          onClick();
        }
      }
    };
    this.canvas.current.addEventListener('mousemove', moveHandler);
    this.canvas.current.addEventListener('mouseup', dropHandler);
    this.canvas.current.addEventListener('mouseleave', dropHandler);
  };

  drag = event => {
    this.watchDrag({ event, onMove: this.pan, scaled: false });
  };

  focusPoint = ({ x, y }, sidebar) => {
    const height = this.canvas.current.clientHeight;
    const width = sidebar
      ? sidebar.offsetLeft
      : this.canvas.current.clientWidth;
    this.viewport.x = width / 2 - x * this.viewport.scale;
    this.viewport.y = height / 2 - y * this.viewport.scale;
    this.setTransform(constants.CANVAS_ZOOM_DURATION, 'ease-in');
  };

  pan = ({ dx, dy }) => {
    this.viewport.x += dx;
    this.viewport.y += dy;
    this.setTransform();
  };

  zoom = throttle((clientX, clientY) => {
    const offsetX = clientX - this.canvas.current.parentNode.offsetLeft;
    const offsetY = clientY - this.canvas.current.parentNode.offsetTop;
    // Compute the new scale value, the deltaY from the mouse event is usually
    // somewhere between 0 and 100 so we divide that by a large number to get
    // much smaller increments.
    let scale =
      this.viewport.scale - this.scrollDelta / constants.CANVAS_ZOOM_MODIFIER;
    this.scrollDelta = 0;
    const min = constants.CANVAS_SCALE_OPTIONS.first();
    const max = this.viewport.largeMode
      ? constants.CANVAS_SCALE_OPTIONS.last()
      : 1.0;
    // If the newly computed scale value is less than the minimum or more than
    // the maximum we use those values instead.
    if (scale < min) {
      scale = min;
    } else if (scale > max) {
      scale = max;
    }
    if (scale !== this.viewport.scale) {
      // In order to keep the mouse cursor in the same position relative to the
      // svg graph while zooming we also need to adjust the viewport's x and y
      // values which result in translation of the graph.
      const svgX = (offsetX - this.viewport.x) / this.viewport.scale;
      const svgY = (offsetY - this.viewport.y) / this.viewport.scale;
      this.viewport.x += svgX * (this.viewport.scale - scale);
      this.viewport.y += svgY * (this.viewport.scale - scale);
      this.viewport.scale = scale;
      this.setTransform();
    }
  }, constants.THROTTLE_ZOOM);

  zoomIn = () => {
    const scale = constants.CANVAS_SCALE_OPTIONS.find(
      scale => scale > this.viewport.scale,
    );
    if (scale) {
      if (scale > 1) {
        this.viewport.largeMode = true;
      }
      this.zoomToScale(scale);
    }
  };

  zoomOut = () => {
    const scale = constants.CANVAS_SCALE_OPTIONS.reverse().find(
      scale => scale < this.viewport.scale,
    );
    if (scale) {
      if (scale <= 1) {
        this.viewport.largeMode = false;
      }
      this.zoomToScale(scale);
    }
  };

  zoomToScale = scale => {
    // make sure to adjust the x and y offsets so that we are zooming to / from
    // the center of the canvas element, use the following equation to determine
    // the coordinate of the virtual center point
    // cx = ( width / 2 - viewport.x ) / scale
    const height = this.canvas.current.clientHeight;
    const width = this.canvas.current.clientWidth;
    const cx = (width / 2 - this.viewport.x) / this.viewport.scale;
    const cy = (height / 2 - this.viewport.y) / this.viewport.scale;
    // then compute the new x / y values by using the equation above and
    // solving for x / y given the computed center coordinate
    this.viewport.x = width / 2 - cx * scale;
    this.viewport.y = height / 2 - cy * scale;
    this.viewport.scale = scale;
    this.setTransform(constants.CANVAS_ZOOM_DURATION, 'ease-out');
  };

  onWheel = event => {
    event.preventDefault();
    event.stopPropagation();
    this.scrollDelta += event.deltaY;
    this.zoom(event.clientX, event.clientY);
  };

  setTransform(duration, ease = '') {
    const { scale, x, y } = this.viewport;
    if (isIE11) {
      // this.transformer.current.setAttribute(
      //   'transform',
      //   `translate(${x} ${y}) scale(${scale})`,
      // );
      this.transformer.current.transform = `translate(${x} ${y}) scale(${scale})`;
    } else {
      const transition = duration ? `transform ${duration}ms ${ease}` : '';
      // this.transformer.current.setAttribute(
      //   'style',
      //   `transform: translate(${x}px, ${y}px) scale(${scale});${transition}`,
      // );

      this.transformer.current.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
      this.transformer.current.style.transition = transition;
    }
    if (
      this.viewport.scale < 0.26 &&
      this.transformer.current.className.baseVal !== 'min-detail'
    ) {
      this.transformer.current.className.baseVal = 'min-detail';
    }
    if (
      this.viewport.scale >= 0.26 &&
      this.viewport.scale < 0.5 &&
      this.transformer.current.className.baseVal !== 'med-detail'
    ) {
      this.transformer.current.className.baseVal = 'med-detail';
    }
    if (
      this.viewport.scale >= 0.5 &&
      this.transformer.current.className.baseVal !== ''
    ) {
      this.transformer.current.className.baseVal = '';
    }
  }

  componentDidMount() {
    this.canvas.current.addEventListener('wheel', this.onWheel);
    this.setTransform();
  }

  render() {
    return (
      <svg
        ref={this.canvas}
        className="rkl tree-builder"
        style={{ height: '100%', width: '100%' }}
        onMouseDown={this.drag}
      >
        <g ref={this.transformer}>{this.props.children}</g>
      </svg>
    );
  }
}

import { List } from 'immutable';

export const CANVAS_SCALE_OPTIONS = List.of(0.25, 0.5, 0.75, 1, 1.33);
export const CANVAS_ZOOM_DURATION = 200;
export const CANVAS_ZOOM_MODIFIER = 2000;
export const THROTTLE_DRAG = 16;
export const THROTTLE_ZOOM = 16;

export const CONNECTOR_HEAD_POINTS = '-8,0 4,-8 0,0 4,8';
export const CONNECTOR_TAIL_RADIUS = 6;
export const CONNECTOR_LABEL_WIDTH = 130;
export const CONNECTOR_LABEL_HEIGHT = 18;
export const CONNECTOR_LABEL_PADDING = 5;
export const CONNECTOR_LABEL_RADIUS = 2;
export const CONNECTOR_STROKE_WIDTH = 4;

export const ICON_SIZE = 16;

export const NEW_TASK_DX = 350;
export const NEW_TASK_DY = 75;

export const NODE_BADGE_OFFSET = 6;
export const NODE_BAR_THICKNESS = 8;
export const NODE_RADIUS = 8;
export const NODE_HEIGHT = 45;
export const NODE_JOIN_JUNCTION_HEIGHT = 45;
export const NODE_START_RADIUS = 28;
export const NODE_STROKE_WIDTH = 1;
export const NODE_PADDING = 10;
export const NODE_NAME_PADDING = 7.5;
export const NODE_WIDTH = 200;
export const NODE_DECORATION_STROKE_WIDTH = 1;

// Derived constants
export const NODE_CENTER_X = NODE_WIDTH / 2;
export const NODE_CENTER_Y = NODE_HEIGHT / 2;
export const NODE_JOIN_JUNCTION_CENTER_Y = NODE_JOIN_JUNCTION_HEIGHT / 2;
export const ICON_CENTER = ICON_SIZE / 2;
export const CONNECTOR_LABEL_CENTER_X = CONNECTOR_LABEL_WIDTH / 2;
export const CONNECTOR_LABEL_CENTER_Y = CONNECTOR_LABEL_HEIGHT / 2;

// Node Decorations

// compute x, y coordinates for outer boundaries of nodes (which includes the
// stroke width)
const MIN = -NODE_STROKE_WIDTH / 2 + NODE_DECORATION_STROKE_WIDTH / 2;
const MAX_X =
  NODE_WIDTH + NODE_STROKE_WIDTH / 2 - NODE_DECORATION_STROKE_WIDTH / 2;
const MAX_Y =
  NODE_HEIGHT + NODE_STROKE_WIDTH / 2 - NODE_DECORATION_STROKE_WIDTH / 2;

// compute the dimensions of the node that include the stroke width
const OUTER_WIDTH =
  NODE_WIDTH + NODE_STROKE_WIDTH - NODE_DECORATION_STROKE_WIDTH;
const OUTER_HEIGHT =
  NODE_HEIGHT + NODE_STROKE_WIDTH - NODE_DECORATION_STROKE_WIDTH;

// pre-builder arc strings because they are verbose and the key distinction is
// whether the last values are positive or negative and that gets lost in the
// paths below
const ARC_DOWN_RIGHT = `${NODE_RADIUS} ${NODE_RADIUS} 0 0 1  ${NODE_RADIUS}  ${NODE_RADIUS}`;
const ARC_UP_RIGHT = `  ${NODE_RADIUS} ${NODE_RADIUS} 0 0 1  ${NODE_RADIUS} -${NODE_RADIUS}`;
const ARC_DOWN_LEFT = ` ${NODE_RADIUS} ${NODE_RADIUS} 0 0 1 -${NODE_RADIUS}  ${NODE_RADIUS}`;
const ARC_UP_LEFT = `   ${NODE_RADIUS} ${NODE_RADIUS} 0 0 1 -${NODE_RADIUS} -${NODE_RADIUS}`;

export const NODE_BOTTOM_BAR_PATH = `
  M  ${MIN} ${MAX_Y - NODE_BAR_THICKNESS}
  h  ${OUTER_WIDTH}
  v  ${NODE_BAR_THICKNESS - NODE_RADIUS}
  a ${ARC_DOWN_LEFT}
  h -${OUTER_WIDTH - NODE_RADIUS * 2}
  a  ${ARC_UP_LEFT}
  v -${NODE_BAR_THICKNESS - NODE_RADIUS}
`;

export const NODE_LEFT_BAR_PATH = `
  M  ${MIN + NODE_BAR_THICKNESS} ${MIN}
  v  ${OUTER_HEIGHT}
  h -${NODE_BAR_THICKNESS - NODE_RADIUS}
  a  ${ARC_UP_LEFT}
  v -${OUTER_HEIGHT - NODE_RADIUS * 2}
  a  ${ARC_UP_RIGHT}
  h  ${NODE_BAR_THICKNESS - NODE_RADIUS}
 `;

export const NODE_LEFT_TOP_BAR_PATH = `
  M  ${MIN + NODE_BAR_THICKNESS} ${MIN}
  v  ${OUTER_HEIGHT / 2}
  h -${NODE_BAR_THICKNESS}
  v -${OUTER_HEIGHT / 2 - NODE_RADIUS}
  a  ${ARC_UP_RIGHT}
  h  ${NODE_BAR_THICKNESS - NODE_RADIUS}
 `;

export const NODE_LEFT_BOTTOM_BAR_PATH = `
  M  ${MIN + NODE_BAR_THICKNESS} ${MIN + OUTER_HEIGHT / 2}
  v  ${OUTER_HEIGHT / 2}
  h -${NODE_BAR_THICKNESS - NODE_RADIUS}
  a  ${ARC_UP_LEFT}
  v -${OUTER_HEIGHT / 2 - NODE_RADIUS}
  h  ${NODE_BAR_THICKNESS - NODE_RADIUS}
 `;

export const NODE_TOP_BAR_PATH = `
  M  ${MIN} ${MIN + NODE_BAR_THICKNESS}
  v -${NODE_BAR_THICKNESS - NODE_RADIUS}
  a  ${ARC_UP_RIGHT}
  h  ${OUTER_WIDTH - NODE_RADIUS * 2}
  a  ${ARC_DOWN_RIGHT}
  v  ${NODE_BAR_THICKNESS - NODE_RADIUS}
  h -${OUTER_WIDTH}
`;

export const NODE_CORNER_TAB_PATH = `
  M ${MAX_X - NODE_BAR_THICKNESS * 3} ${MIN}
  h ${NODE_BAR_THICKNESS * 3 - NODE_RADIUS}
  a ${ARC_DOWN_RIGHT}
  v ${NODE_BAR_THICKNESS * 3 - NODE_RADIUS}
  L ${MAX_X - NODE_BAR_THICKNESS * 3} ${MIN}
`;

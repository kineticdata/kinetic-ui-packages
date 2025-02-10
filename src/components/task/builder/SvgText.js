import React from 'react';

export const SvgText = props => (
  <foreignObject
    className={props.className}
    x={props.x + props.padding}
    y={props.y}
    height={props.height}
    width={props.width - props.padding * 2}
  >
    <div className="text-node">
      <span>{props.children}</span>
    </div>
  </foreignObject>
);

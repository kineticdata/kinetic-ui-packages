import React from 'react';
import { TableInput } from '../..';

export const TableField = props => (
  <div className="field">
    <h3>{props.label}</h3>
    <TableInput
      rowConfig={props.options}
      rows={props.value}
      onChange={props.onChange}
      onBlur={props.onBlur}
      onFocus={props.onFocus}
    />
  </div>
);

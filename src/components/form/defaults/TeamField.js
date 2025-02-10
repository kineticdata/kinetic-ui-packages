import React from 'react';
import { TeamSelect } from '../../common/TeamSelect';

export const TeamField = props =>
  props.visible && (
    <div className="field">
      <label htmlFor={props.id || props.name}>{props.label}</label>
      <TeamSelect
        textMode
        value={props.value}
        onChange={props.onChange}
        onBlur={props.onBlur}
        onFocus={props.onFocus}
      />
    </div>
  );

import React from 'react';
import { TeamSelect } from '../../common/TeamSelect';

export const TeamMultiField = props =>
  props.visible && (
    <div className="field">
      <label htmlFor={props.id || props.name}>{props.label}</label>
      <TeamSelect
        multiple
        value={props.value}
        onChange={props.onChange}
        onBlur={props.onBlur}
        onFocus={props.onFocus}
      />
    </div>
  );

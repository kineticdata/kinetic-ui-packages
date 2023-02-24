import React from 'react';
import { FormSelect } from '../../common/FormSelect';

export const FormField = props =>
  props.visible && (
    <div className="field">
      <label htmlFor={props.id || props.name}>{props.label}</label>
      <FormSelect
        textMode
        value={props.value}
        onChange={props.onChange}
        onBlur={props.onBlur}
        onFocus={props.onFocus}
        search={props.search}
        options={props.options}
      />
    </div>
  );

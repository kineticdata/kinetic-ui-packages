import React from 'react';
import { FormSelect } from '../../common/FormSelect';

export const FormMultiField = props =>
  props.visible && (
    <div className="field">
      <label htmlFor={props.id || props.name}>{props.label}</label>
      <FormSelect
        multiple
        value={props.value}
        onChange={props.onChange}
        onBlur={props.onBlur}
        onFocus={props.onFocus}
        search={props.search}
        options={props.options}
      />
    </div>
  );

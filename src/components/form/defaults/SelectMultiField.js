import React from 'react';

export const SelectMultiField = props =>
  props.visible && (
    <div className="field">
      <label htmlFor={props.id || props.name}>{props.label}</label>
      <select
        multiple
        id={props.id || props.name}
        name={props.name}
        value={props.value.toArray()}
        onBlur={props.onBlur}
        onChange={props.onChange}
        onFocus={props.onFocus}
      >
        {props.options.map((option, i) => (
          <option key={i} value={option.get('value')}>
            {option.get('label')}
          </option>
        ))}
      </select>
    </div>
  );

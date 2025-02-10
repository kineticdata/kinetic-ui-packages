import React from 'react';

export const RadioField = props =>
  props.visible && (
    <div className="field">
      <legend>{props.label}</legend>
      {props.options.map(option => (
        <label key={option.get('value')}>
          <input
            name={props.name}
            type="radio"
            value={option.get('value')}
            checked={props.value === option.get('value')}
            onChange={props.onChange}
            onBlur={props.onBlur}
            onFocus={props.onFocus}
          />
          {option.get('label')}
        </label>
      ))}
    </div>
  );

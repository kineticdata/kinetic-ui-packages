import React from 'react';
import t from 'prop-types';

export const PasswordField = props =>
  props.visible && (
    <div className="field">
      <label htmlFor={props.id || props.name}>{props.label}</label>
      <input
        type="password"
        id={props.id || props.name}
        name={props.name}
        value={props.value || ''}
        onBlur={props.onBlur}
        onChange={props.onChange}
        onFocus={props.onFocus}
      />
    </div>
  );

PasswordField.propTypes = {
  /** Flag that determines if the field is visible. */
  visible: t.bool,
  /** The id of the field. */
  id: t.string,
  /** The value of the field. */
  value: t.string,
  /** The name of the field. */
  name: t.string,
  /** The blur event for the field. */
  onBlur: t.func,
  /** The change event for the field. */
  onChange: t.func,
  /** The focus event for the field. */
  onFocus: t.func,
};

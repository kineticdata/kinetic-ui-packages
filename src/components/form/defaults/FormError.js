import React from 'react';

export const FormError = props => (
  <div>
    {props.error}
    <button type="button" onClick={props.clear}>
      &times;
    </button>
  </div>
);

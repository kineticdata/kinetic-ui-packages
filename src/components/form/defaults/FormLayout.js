import React from 'react';

export const FormLayout = props => (
  <form>
    {props.fields.toList()}
    {props.error}
    {props.buttons}
  </form>
);

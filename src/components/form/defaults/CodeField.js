import React from 'react';
import { CodeInput } from '../../common/code_input/CodeInput';

export const CodeField = props =>
  props.visible && (
    <div className="field">
      <label htmlFor={props.id || props.name}>{props.label}</label>
      <CodeInput
        id={props.id || props.name}
        language={props.language}
        bindings={props.options}
        value={props.value}
        onBlur={props.onBlur}
        onChange={props.onChange}
        onFocus={props.onFocus}
      />
    </div>
  );

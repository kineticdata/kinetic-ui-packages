import React from 'react';
import { CodeInput } from '../../common/code_input/CodeInput';
import { fromJS, List, Map } from 'immutable';

export const CodeField = props =>
  props.visible && (
    <div className="field">
      <label htmlFor={props.id || props.name}>{props.label}</label>
      <CodeInput
        id={props.id || props.name}
        language={props.language}
        bindings={prepareOptions(props.options)}
        value={props.value}
        onBlur={props.onBlur}
        onChange={props.onChange}
        onFocus={props.onFocus}
      >
        {({ editor, wrapperProps }) => (
          <div {...wrapperProps} className="code-input">
            <div className="content">{editor}</div>
          </div>
        )}
      </CodeInput>
    </div>
  );

// We deprecated the use of CodeInput in the consoles, but are keeping the
// component in RKL since it might be used outside the consoles. We'll also
// continue using it for this default CodeField in RKL, so we want to massage
// the new CodeEditor options into a format that will work here.
const prepareOptions = options =>
  Map.isMap(options)
    ? options
    : options
        .flatMap(opt =>
          !opt.get('siblings') || opt.get('siblings').isEmpty()
            ? List([opt])
            : opt
                .get('siblings')
                .map(sib =>
                  opt.update('label', label => `${label}:${sib.get('label')}`),
                ),
        )
        .flatMap(opt =>
          !opt.get('type') ||
          opt.get('type') === 'constant' ||
          !opt.get('children') ||
          opt.get('children').isEmpty()
            ? List([opt])
            : opt
                .get('children')
                .flatMap(child =>
                  !fromJS(child).get('siblings') ||
                  fromJS(child).get('siblings').isEmpty()
                    ? List([child])
                    : fromJS(child)
                        .get('siblings')
                        .map(sib =>
                          child.update(
                            'label',
                            label => `${label}:${sib.get('label')}`,
                          ),
                        ),
                )
                .map(child =>
                  fromJS(child).update('label', label =>
                    opt.get('type') === 'function'
                      ? `${opt.get('label')}('${label}')`
                      : opt.get('type') === 'object'
                        ? `${opt.get('label')}['${label}']`
                        : opt.get('type') === 'dot-object'
                          ? `${opt.get('label')}.${label}`
                          : opt.get('label'),
                  ),
                ),
        )
        .sortBy(opt => opt.get('label'))
        .toOrderedMap()
        .mapKeys((_, opt) => opt.get('label'))
        .map(opt =>
          Map({
            value: `${opt.get('label')}${
              opt.get('type') === 'function'
                ? "('')"
                : opt.get('type') === 'object'
                  ? "['']"
                  : ''
            }`,
          }),
        );

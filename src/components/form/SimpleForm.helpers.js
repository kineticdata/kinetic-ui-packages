import { getIn, fromJS, isImmutable, List, Map, OrderedMap } from 'immutable';
import {
  onBlur as onBlurHandler,
  onChange as onChangeHandler,
  onFocus as onFocusHandler,
} from './SimpleForm';
import {
  SimpleFormState,
  SimpleFieldState,
  SimpleFieldBinding,
} from './SimpleForm.models';
import { FIELD_DEFAULT_VALUES } from './Form.models';

// If value is null for a text or select field, change it to the default value
// to prevent HTML errors
const correctRenderValue = (
  type,
  value = FIELD_DEFAULT_VALUES.get(type, ''),
) => {
  switch (type) {
    case 'text':
    case 'select':
      return value !== null ? value : FIELD_DEFAULT_VALUES.get(type, '');
    default:
      return value;
  }
};

// Converts an array of fields to an OrderedMap using the `name` as the key
const convertFieldsToMap = fields =>
  OrderedMap(fields.filter(Boolean).map(field => [field.name, field]));

export const createFieldState =
  formKey =>
  ({
    bindings,
    constraint,
    constraintMessage,
    enabled,
    form,
    helpText,
    label,
    language,
    name,
    onFocus,
    onChange,
    onBlur,
    options,
    pattern,
    patternMessage,
    placeholder,
    renderAttributes,
    required,
    requiredMessage,
    search,
    serialize,
    transient,
    type,
    visible,
  }) =>
    SimpleFieldState({
      // Derived options
      id: btoa(`${formKey} ${name}`).replace(/=+$/, ''),
      renderAttributes: fromJS(renderAttributes),
      // Options supporting conditional expressions,
      enabled: typeof enabled === 'function' ? false : enabled,
      label: typeof label === 'function' ? '' : label,
      options: typeof options === 'function' ? List() : fromJS(options),
      placeholder: typeof placeholder === 'function' ? '' : placeholder,
      required: typeof required === 'function' ? false : required,
      search: typeof search === 'function' ? Map() : fromJS(search),
      transient: typeof transient === 'function' ? false : transient,
      visible: typeof visible === 'function' ? false : visible,
      language: typeof language === 'function' ? null : language,
      bindings: typeof bindings === 'function' ? null : bindings,
      functions: Map({
        enabled: typeof enabled === 'function' ? enabled : null,
        label: typeof label === 'function' ? label : null,
        options: typeof options === 'function' ? options : null,
        placeholder: typeof placeholder === 'function' ? placeholder : null,
        required: typeof required === 'function' ? required : null,
        search: typeof search === 'function' ? search : null,
        transient: typeof transient === 'function' ? transient : null,
        visible: typeof visible === 'function' ? visible : null,
        language: typeof language === 'function' ? language : null,
        bindings: typeof bindings === 'function' ? bindings : null,
      }),
      // Event handlers
      eventHandlers: Map({
        onBlur: null,
        onChange: null,
        onFocus: null,
      }),
      eventHandlerFunctions: Map({
        onBlur: onBlurHandler({ formKey, name }),
        onChange: onChangeHandler({
          formKey,
          type,
          name,
        }),
        onFocus: onFocusHandler({ formKey, name }),
      }),
      // Pass-through options
      constraint,
      constraintMessage,
      form,
      helpText,
      name,
      onFocus,
      onChange,
      onBlur,
      pattern,
      patternMessage,
      requiredMessage,
      serialize,
      type,
    });

export const createFormState = ({
  fields,
  formKey,
  onLoad,
  onReset,
  onSubmit,
  values,
}) =>
  SimpleFormState({
    fields: convertFieldsToMap(fields).map(createFieldState(formKey)),
    formKey,
    initialValues: values,
    onLoad,
    onReset,
    onSubmit,
  });

export const isEmpty = value =>
  value === null ||
  value === undefined ||
  value === false ||
  value === '' ||
  (isImmutable(value) && value.isEmpty());

const checkRequired = field =>
  field.required && isEmpty(field.value)
    ? List([field.requiredMessage])
    : List();

const checkPattern = bindings => field =>
  field.pattern &&
  field.type === 'text' &&
  field.value !== '' &&
  field.value !== null &&
  !field.value.match(
    typeof field.pattern === 'function'
      ? field.pattern({
          ...bindings,
          field: SimpleFieldBinding(field),
        })
      : field.pattern,
  )
    ? List([field.patternMessage])
    : List();

const checkConstraint = bindings => field => {
  if (field.constraint) {
    const result = field.constraint({
      ...bindings,
      field: SimpleFieldBinding(field),
    });
    if (!result) {
      return List([field.constraintMessage]);
    } else if (typeof result === 'string') {
      return List([result]);
    }
  }
  // Return no errors if there was no constraint or if the constraint did not
  // evaluate to false or an error string.
  return List();
};

// Validate the field
const validateField =
  (bindings, validateOnLoad = false) =>
  (field, name, fields) => {
    const errors = List([
      checkRequired,
      checkPattern({ ...bindings, fields: fields.map(SimpleFieldBinding) }),
      checkConstraint({ ...bindings, fields: fields.map(SimpleFieldBinding) }),
    ]).flatMap(fn => fn(field));
    return field.set('errors', errors).update(
      'touched',
      // Set touched to true if there are errors and the validateOnLoad flag is
      // true to allow for showing errors on load of the form
      touched => (errors.isEmpty() ? touched : touched || validateOnLoad),
    );
  };

// Resolve function props of the field
const evaluateFieldProps = bindings => (field, name, fields) =>
  field.functions
    .filter(fn => !!fn)
    .reduce(
      (reduction, fn, prop) =>
        reduction.set(
          prop,
          fromJS(fn({ ...bindings, fields: fields.map(SimpleFieldBinding) })),
        ),
      field,
    );

const evaluateFieldHandlers = bindings => (field, name, fields) =>
  field.eventHandlerFunctions
    .filter(fn => !!fn)
    .reduce(
      (reduction, fn, prop) =>
        reduction.setIn(
          ['eventHandlers', prop],
          fromJS(fn({ ...bindings, fields: fields.map(SimpleFieldBinding) })),
        ),
      field,
    );

// Set the value into the field state object and set the dirty flag
const evaluateFieldValue = bindings => field => {
  const value = getIn(bindings, ['values', field.name]);
  const initialValue = getIn(bindings, ['initialValues', field.name]);
  return field
    .set('value', fromJS(value))
    .set(
      'dirty',
      typeof initialValue !== 'undefined'
        ? value !== initialValue
        : field.touched,
    );
};

export const evaluateFields = (fields, bindings, validateOnLoad) =>
  fields
    ? fields
        .map(evaluateFieldValue(bindings))
        .map(evaluateFieldProps(bindings))
        .map(evaluateFieldHandlers(bindings))
        .map(validateField(bindings, validateOnLoad))
    : fields;

export const getComponentName = field =>
  field.type
    ? field.type
        .split('-')
        .map(word => `${word.charAt(0).toUpperCase()}${word.substring(1)}`)
        .join('') + 'Field'
    : null;

export const getFieldComponents = fields =>
  convertFieldsToMap(fields)
    .filter(fieldConfig => fieldConfig.component)
    .map(fieldConfig => fieldConfig.component);

export const getFieldComponentProps = (field, readOnly) => ({
  bindings: field.bindings,
  dirty: field.dirty,
  enabled: readOnly ? false : field.enabled,
  errors: field.errors,
  focused: field.focused,
  form: field.form,
  helpText: field.helpText,
  id: field.id,
  label: field.label,
  language: field.type === 'code' ? field.language : undefined,
  name: field.name,
  onBlur: field.eventHandlers.get('onBlur'),
  onChange: field.eventHandlers.get('onChange'),
  onFocus: field.eventHandlers.get('onFocus'),
  options: [
    'attributes',
    'checkbox-multi',
    'code',
    'form',
    'form-multi',
    'list',
    'map',
    'radio',
    'select',
    'select-multi',
    'table',
    'text',
    'text-multi',
  ].includes(field.type)
    ? field.options
    : undefined,
  placeholder: field.placeholder,
  renderAttributes: field.renderAttributes,
  required: field.required,
  search: ['form', 'form-multi'].includes(field.type)
    ? field.search
    : undefined,
  touched: field.touched,
  value: correctRenderValue(field.type, field.value),
  visible: field.visible,
});

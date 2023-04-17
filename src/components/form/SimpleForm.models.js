import { List, Map, Record } from 'immutable';

export const SimpleFormState = Record({
  callOnLoad: true,
  fields: null,
  formKey: null,
  initialValues: null,
  onLoad: null,
  onReset: null,
  onSubmit: null,
});

export const SimpleFieldState = Record({
  constraint: null,
  constraintMessage: 'Invalid',
  dirty: undefined,
  enabled: true,
  errors: undefined,
  eventHandlers: Map(),
  focused: false,
  form: null,
  functions: Map(),
  helpText: '',
  id: '',
  label: '',
  language: '',
  name: '',
  onChange: null,
  options: List(),
  pattern: null,
  patternMessage: 'Invalid format',
  placeholder: '',
  renderAttributes: Map(),
  required: false,
  requiredMessage: 'This field is required',
  search: Map(),
  serialize: null,
  touched: false,
  type: '',
  value: undefined,
  visible: true,
});

export const SimpleFieldBinding = Record({
  dirty: undefined,
  errors: undefined,
  focused: false,
  id: '',
  name: '',
  touched: false,
  type: '',
  value: undefined,
});

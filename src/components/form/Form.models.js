import { List, Map, OrderedMap, Record } from 'immutable';

export const FormState = Record({
  addFields: List(),
  alterFields: Map(),
  bindings: {},
  callOnLoad: false,
  dataSources: null,
  error: null,
  fields: null,
  fieldsFn: null,
  formKey: null,
  formOptions: Map(),
  initialValuesFn: null,
  onError: null,
  onLoad: null,
  onSave: null,
  onSubmit: null,
  submitting: false,
});

export const DATA_SOURCE_STATUS = {
  PENDING: 'PENDING',
  RESOLVED: 'RESOLVED',
  REJECTED: 'REJECTED',
};

export const DataSource = Record({
  data: null,
  fn: null,
  params: null,
  paramsFn: null,
  status: DATA_SOURCE_STATUS.PENDING,
  transform: null,
});

export const FIELD_DEFAULT_VALUES = Map({
  attributes: Map(),
  checkbox: false,
  'checkbox-multi': List(),
  form: null,
  'form-multi': List(),
  map: OrderedMap(),
  'select-multi': List(),
  team: null,
  'team-multi': List(),
  'text-multi': List(),
  user: null,
  'user-multi': List(),
});

export const Field = Record({
  constraint: null,
  constraintMessage: 'Invalid',
  dirty: false,
  enabled: true,
  errors: List(),
  eventHandlers: Map(),
  focused: false,
  form: null,
  functions: Map(),
  helpText: '',
  id: '',
  initialValue: null,
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
  transient: false,
  type: '',
  valid: true,
  value: null,
  visible: true,
});

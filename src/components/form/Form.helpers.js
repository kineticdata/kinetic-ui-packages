import { fromJS, List, Map, OrderedMap } from 'immutable';
import { isFunction } from 'lodash-es';
import {
  DataSource,
  Field,
  FIELD_DEFAULT_VALUES,
  FormState,
} from './Form.models';
import { onBlur, onChange as onChangeHandler, onFocus } from './Form';

const sameName = field1 => field2 => field1.name === field2.name;

export const handleFormErrors = (key, message) => results => {
  const { error } = results;
  if (error) {
    throw (error.statusCode === 400 && error.message) ||
      message ||
      'There was an error saving.';
  }
  return key ? results[key] : results;
};

export const resolveFieldConfig = (
  formOptions,
  bindings,
  fieldsFn,
  addFieldsParam = [],
  alterFieldsParam = {},
) => {
  const fields = fieldsFn(formOptions)(bindings);
  const addFields =
    typeof addFieldsParam === 'function'
      ? addFieldsParam(formOptions)(bindings)
      : addFieldsParam;
  const alterFields =
    typeof alterFieldsParam === 'function'
      ? alterFieldsParam(formOptions)(bindings)
      : alterFieldsParam;
  if (fields && addFields && alterFields) {
    return OrderedMap(
      [
        ...fields,
        ...addFields
          .filter(field => !fields.find(sameName(field)))
          .map(field => ({ ...field, transient: true })),
      ]
        .filter(field => !!field)
        .map(({ name, type, ...fieldConfig }) => ({
          ...fieldConfig,
          ...(alterFields[name] || {}),
          name,
          type,
        }))
        .map(field => [field.name, field]),
    );
  }
};

export const initializeValue = (
  type,
  // if the initialValue option is undefined look up the appropriate empty value
  // for the field's type
  value = FIELD_DEFAULT_VALUES.get(type, ''),
) =>
  type === 'map'
    ? OrderedMap(value).map(value => fromJS(value))
    : fromJS(value);

export const createField = formKey => ({
  bindings,
  constraint,
  constraintMessage,
  enabled,
  form,
  helpText,
  initialValue,
  label,
  language,
  name,
  onChange,
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
  Field({
    // Derived options
    id: btoa(`${formKey} ${name}`).replace(/=+$/, ''),
    initialValue: initializeValue(type, initialValue),
    renderAttributes: fromJS(renderAttributes),
    value: initializeValue(type, initialValue),
    // Options supporting conditional expressions,
    bindings: typeof bindings === 'function' ? {} : bindings,
    enabled: typeof enabled === 'function' ? false : enabled,
    label: typeof label === 'function' ? '' : label,
    options: typeof options === 'function' ? List() : fromJS(options),
    placeholder: typeof placeholder === 'function' ? '' : placeholder,
    required: typeof required === 'function' ? false : required,
    search: typeof search === 'function' ? Map() : fromJS(search),
    transient: typeof transient === 'function' ? false : transient,
    visible: typeof visible === 'function' ? false : visible,
    functions: Map({
      bindings: typeof bindings === 'function' ? bindings : null,
      enabled: typeof enabled === 'function' ? enabled : null,
      label: typeof label === 'function' ? label : null,
      options: typeof options === 'function' ? options : null,
      placeholder: typeof placeholder === 'function' ? placeholder : null,
      required: typeof required === 'function' ? required : null,
      search: typeof search === 'function' ? search : null,
      transient: typeof transient === 'function' ? transient : null,
      visible: typeof visible === 'function' ? visible : null,
    }),
    // Event handlers
    eventHandlers: Map({
      onBlur: onBlur({ formKey, name }),
      onChange: onChangeHandler({ formKey, type, name }),
      onFocus: onFocus({ formKey, name }),
    }),
    // Pass-through options
    constraint,
    constraintMessage,
    form,
    helpText,
    language,
    name,
    onChange,
    pattern,
    patternMessage,
    requiredMessage,
    serialize,
    type,
  });

export const createDataSource = ({ fn, params, transform, errorTransform }) => {
  const paramProp = typeof params === 'function' ? 'paramsFn' : 'params';
  return DataSource({
    fn,
    [paramProp]: params,
    transform,
    errorTransform,
  });
};

export const createFormState = ({
  addDataSources,
  addFields,
  alterFields,
  dataSources,
  fields,
  formKey,
  formOptions,
  onError,
  onLoad,
  onSave,
  onSubmit,
}) =>
  FormState({
    addFields,
    alterFields,
    dataSources: Map(addDataSources)
      .merge(Map(dataSources(formOptions)))
      .map(createDataSource),
    fieldsFn: fields,
    formKey,
    formOptions,
    onError: onError && onError(formOptions),
    onLoad: onLoad && onLoad(formOptions),
    onSave: onSave && onSave(formOptions),
    onSubmit: onSubmit && onSubmit(formOptions),
  });

export const buildPropertyFields = ({
  isNew,
  properties,
  getName,
  getLabel,
  getOptions,
  getRequired,
  getSensitive,
  getCertificate,
  getHelpText,
  getValue,
}) => ({
  propertiesFields: properties
    .flatMap(property => {
      const name = getName(property);
      const label = (isFunction(getLabel) && getLabel(property)) || name;
      const options = isFunction(getOptions) && getOptions(property);
      const required = isFunction(getRequired) && getRequired(property);
      const sensitive = isFunction(getSensitive) && getSensitive(property);
      const certificate =
        isFunction(getCertificate) && getCertificate(property);
      const helpText = isFunction(getHelpText) && getHelpText(property);
      const value = getValue(property);
      return !!certificate
        ? [
            {
              name: `property_${name}`,
              label,
              type: 'certificate',
              required: required,
              transient: true,
              options,
              helpText,
              initialValue: certificate,
              visible: ({ values }) => !values.get(`changeProperty_${name}`),
            },
            {
              name: `property_new_${name}`,
              label,
              type: 'file',
              required: required,
              transient: true,
              helpText,
              visible: ({ values }) => values.get(`changeProperty_${name}`),
            },
            {
              name: `changeProperty_${name}`,
              label: `Change ${label}`,
              type: 'toggle',
              transient: true,
              initialValue: false,
              onChange: ({ values }, { setValue }) => {
                if (
                  !List.isList(values.get(`property_new_${name}`)) ||
                  values.get(`property_new_${name}`).size > 0
                ) {
                  setValue(`property_new_${name}`, List());
                }
              },
            },
          ]
        : !sensitive || isNew
          ? [
              {
                name: `property_${name}`,
                label,
                type: sensitive ? 'password' : options ? 'select' : 'text',
                required: required,
                transient: true,
                options,
                helpText,
                initialValue: value,
              },
            ]
          : [
              {
                name: `property_${name}`,
                label,
                type: 'secret',
                required: required
                  ? ({ values }) => values.get(`changeProperty_${name}`)
                  : false,
                transient: true,
                helpText,
                initialValue: '',
                visible: ({ values }) => values.get(`changeProperty_${name}`),
              },
              {
                name: `changeProperty_${name}`,
                label: `Change ${label}`,
                type: 'toggle',
                transient: true,
                initialValue: false,
                onChange: ({ values }, { setValue }) => {
                  if (values.get(`property_${name}`) !== '') {
                    setValue(`property_${name}`, '');
                  }
                },
              },
            ];
    })
    .toArray(),
  propertiesSerialize: ({ values }) =>
    properties
      .reduce((reduction, property) => {
        const name = getName(property);
        const sensitive = isFunction(getSensitive) && getSensitive(property);
        const certificate =
          isFunction(getCertificate) && getCertificate(property);

        if (certificate) {
          // If certificate field, serialize value if the corresponding
          // changeProperty field has a value. Set to the new uploaded file, or
          // an empty string if no file uploaded.
          if (values.get(`changeProperty_${name}`)) {
            return reduction.set(
              name,
              values.getIn([`property_new_${name}`, 0]) || '',
            );
          }
        } else if (sensitive) {
          // If sensitive field, serialize value if the corresponding
          // changeProperty field has a value. Set to the new provided value.
          if (isNew || values.get(`changeProperty_${name}`)) {
            return reduction.set(name, values.get(`property_${name}`));
          }
        } else {
          return reduction.set(name, values.get(`property_${name}`));
        }
        return reduction;
      }, Map())
      .toObject(),
});

export const getComponentName = field =>
  field.type
    ? field.type
        .split('-')
        .map(word => `${word.charAt(0).toUpperCase()}${word.substring(1)}`)
        .join('') + 'Field'
    : null;

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
  value: field.value,
  visible: field.visible,
});

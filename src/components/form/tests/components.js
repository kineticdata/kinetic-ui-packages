import React from 'react';
import { isImmutable, List, OrderedMap, Map, Record } from 'immutable';

const stringifyProps = props =>
  JSON.stringify(
    props,
    // Make sure functions are stringified to an empty function string
    // instead of being omitted
    (k, v) => (typeof v === 'function' ? '() => {}' : v),
    2,
  );

const stringifyImmutablePropTypes = props =>
  JSON.stringify(
    Object.entries(props).reduce(
      (o, [k, v]) =>
        isImmutable(v)
          ? {
              ...o,
              [k]: `Immutable${
                List.isList(v)
                  ? '.List'
                  : OrderedMap.isOrderedMap(v)
                    ? '.OrderedMap'
                    : Map.isMap(v)
                      ? '.Map'
                      : Record.isRecord(v)
                        ? '.Record'
                        : ''
              }`,
            }
          : o,
      {},
    ),
    null,
    2,
  );

// Create a mock component that renders a div and all of its props as
// stringified attributes on that div
const generateMock = name => props => (
  <div
    data-testid={name}
    // Store the stringified props for the component
    data-props={stringifyProps(props)}
    // Store the immutable types for the relevant props because JSON.stringify
    // removes that metadata in the data-props above, and we want to verify
    // that certain props are Immutable instances in some tests
    data-immutable-props={stringifyImmutablePropTypes(props)}
  />
);

// Define mock functional components for each of the form fields, form buttons
// and form error. We define them explicitly like this because this is the name
// that we want to be used in the snapshot. When testing overrides we will then
// be able to determine that the override was used instead of the mock.
const AttributesFieldMock = generateMock('AttributesFieldMock');
const CheckboxFieldMock = generateMock('CheckboxFieldMock');
const CodeFieldMock = generateMock('CodeFieldMock');
const FormButtonsMock = generateMock('FormButtonsMock');
const FormErrorMock = generateMock('FormErrorMock');
const FormFieldMock = generateMock('FormFieldMock');
const FormMultiFieldMock = generateMock('FormMultiFieldMock');
const PasswordFieldMock = generateMock('PasswordFieldMock');
const RadioFieldMock = generateMock('RadioFieldMock');
const TeamFieldMock = generateMock('TeamFieldMock');
const TeamMultiFieldMock = generateMock('TeamMultiFieldMock');
const SelectFieldMock = generateMock('SelectFieldMock');
const SelectMultiFieldMock = generateMock('SelectMultiFieldMock');
const TextFieldMock = generateMock('TextFieldMock');
const TextMultiFieldMock = generateMock('TextMultiFieldMock');
const UserFieldMock = generateMock('UserFieldMock');
const UserMultiFieldMock = generateMock('UserMultiFieldMock');
const TableFieldMock = generateMock('TableFieldMock');

export const mockFieldConfig = {
  AttributesField: AttributesFieldMock,
  CheckboxField: CheckboxFieldMock,
  CodeField: CodeFieldMock,
  FormButtons: FormButtonsMock,
  FormError: FormErrorMock,
  FormField: FormFieldMock,
  FormMultiField: FormMultiFieldMock,
  // FormLayout is the one component we actually want to render so that the
  // <Field> components end up being rendered and are then testable.
  FormLayout: ({ fields, error, buttons, ...props }) => (
    <form
      data-testid="FormLayout"
      data-props={stringifyProps(props)}
      data-immutable-props={stringifyImmutablePropTypes(props)}
    >
      {fields.toList()}
      {error}
      {buttons}
    </form>
  ),
  PasswordField: PasswordFieldMock,
  RadioField: RadioFieldMock,
  TeamField: TeamFieldMock,
  TeamMultiField: TeamMultiFieldMock,
  SelectField: SelectFieldMock,
  SelectMultiField: SelectMultiFieldMock,
  TextField: TextFieldMock,
  TextMultiField: TextMultiFieldMock,
  UserField: UserFieldMock,
  UserMultiField: UserMultiFieldMock,
  TableField: TableFieldMock,
};

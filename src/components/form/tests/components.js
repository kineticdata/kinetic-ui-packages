import React, { Fragment } from 'react';

// Define mock functional components for each of the form fields, form buttons
// and form error. We define them explicitly like this because this is the name
// that we want to be used in the snapshot. When testing overrides we will then
// be able to determine that the override was used instead of the mock.
const AttributesFieldMock = () => null;
const CheckboxFieldMock = () => null;
const CodeFieldMock = () => null;
const FormButtonsMock = () => null;
const FormErrorMock = () => null;
const FormFieldMock = () => null;
const FormMultiFieldMock = () => null;
const PasswordFieldMock = () => null;
const RadioFieldMock = () => null;
const TeamFieldMock = () => null;
const TeamMultiFieldMock = () => null;
const SelectFieldMock = () => null;
const SelectMultiFieldMock = () => null;
const TextFieldMock = () => null;
const TextMultiFieldMock = () => null;
const UserFieldMock = () => null;
const UserMultiFieldMock = () => null;
const TableFieldMock = () => null;

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
  FormLayout: ({ buttons, error, fields }) => (
    <Fragment>
      {fields.toList()}
      {error}
      {buttons}
    </Fragment>
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

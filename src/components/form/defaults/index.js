import { Map } from 'immutable';
import { AttributesField } from './AttributesField';
import { CheckboxField } from './CheckboxField';
import { CodeField } from './CodeField';
import { FormButtons } from './FormButtons';
import { FormError } from './FormError';
import { FormField } from './FormField';
import { FormMultiField } from './FormMultiField';
import { FormLayout } from './FormLayout';
import { PasswordField } from './PasswordField';
import { RadioField } from './RadioField';
import { TeamField } from './TeamField';
import { TeamMultiField } from './TeamMultiField';
import { SelectField } from './SelectField';
import { SelectMultiField } from './SelectMultiField';
import { TextField } from './TextField';
import { TextMultiField } from './TextMultiField';
import { UserField } from './UserField';
import { UserMultiField } from './UserMultiField';
import { TableField } from './TableField';

export const DefaultFieldConfig = Map({
  AttributesField,
  CheckboxField,
  CodeField,
  FormButtons,
  FormError,
  FormField,
  FormMultiField,
  FormLayout,
  PasswordField,
  RadioField,
  TeamField,
  TeamMultiField,
  SelectField,
  SelectMultiField,
  TextField,
  TextMultiField,
  UserField,
  UserMultiField,
  TableField,
});

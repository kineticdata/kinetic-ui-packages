import { get } from 'immutable';
import { generateForm } from '../form/Form';
import { fetchSystemUser, updateSystemUser } from '../../apis/system';
import { handleFormErrors } from '../form/Form.helpers';

const dataSources = () => ({
  user: {
    fn: fetchSystemUser,
    params: [],
    transform: result => result.user,
  },
});

const handleSubmit = () => values => {
  const user = values.toJS();
  return updateSystemUser({ user }).then(
    handleFormErrors('user', 'There was an error saving the User.'),
  );
};

const fields = () => ({ user }) =>
  user && [
    {
      name: 'username',
      label: 'Username',
      type: 'text',
      required: true,
      initialValue: get(user, 'username') || '',
    },
    {
      name: 'password',
      label: 'Password',
      type: 'password',
      required: ({ values }) => values.get('changePassword'),
      visible: ({ values }) => values.get('changePassword'),
      transient: ({ values }) => !values.get('changePassword'),
    },
    {
      name: 'passwordConfirmation',
      label: 'Password Confirmation',
      type: 'password',
      required: ({ values }) => values.get('changePassword'),
      visible: ({ values }) => values.get('changePassword'),
      transient: ({ values }) => !values.get('changePassword'),
      constraint: ({ values }) =>
        values.get('passwordConfirmation') === values.get('password'),
      constraintMessage: 'Password Confirmation does not match',
    },
    {
      name: 'changePassword',
      label: 'Change Password',
      type: 'checkbox',
      initialValue: false,
      transient: true,
      onChange: ({ values }, { setValue }) => {
        if (values.get('password') !== '') {
          setValue('password', '');
        }
        if (values.get('passwordConfirmation') !== '') {
          setValue('passwordConfirmation', '');
        }
      },
    },
  ];

export const SystemUserForm = generateForm({
  dataSources,
  fields,
  handleSubmit,
});

SystemUserForm.displayName = 'SystemUserForm';

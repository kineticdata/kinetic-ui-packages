import { generateForm } from '../form/Form';
import {
  fetchSystemDefaultSmtpAdapter,
  updateSystemDefaultSmtpAdapter,
} from '../../apis/system';
import { handleFormErrors } from '../form/Form.helpers';

const dataSources = () => ({
  adapter: {
    fn: fetchSystemDefaultSmtpAdapter,
    params: [],
    transform: result => result.adapter,
  },
});

const handleSubmit = () => values =>
  updateSystemDefaultSmtpAdapter({
    adapter: values.toJS(),
  }).then(handleFormErrors('adapter'));

const fields = () => ({ adapter }) => {
  const initialValue = (fieldName, defaultValue = '') => {
    const property = adapter.find(p => p.get('name') === fieldName);
    return property ? property.get('value') || '' : defaultValue;
  };

  return (
    adapter && [
      {
        name: 'host',
        label: 'Host',
        type: 'text',
        required: true,
        enabled: true,
        visible: true,
        initialValue: initialValue('host'),
      },
      {
        name: 'port',
        label: 'Port',
        type: 'text',
        required: true,
        enabled: true,
        visible: true,
        initialValue: initialValue('port'),
      },
      {
        name: 'username',
        label: 'Username',
        type: 'text',
        enabled: true,
        visible: true,
        initialValue: initialValue('username'),
      },
      {
        name: 'password',
        label: 'Password',
        type: 'password',
        enabled: true,
        transient: ({ values }) => !values.get('passwordChange'),
        required: ({ values }) => values.get('passwordChange'),
        visible: ({ values }) => values.get('passwordChange'),
        initialValue: initialValue('password'),
      },
      {
        name: 'passwordChange',
        label: 'Change Password',
        type: 'checkbox',
        visible: true,
        transient: true,
        initialValue: false,
        onChange: ({ values }, { setValue }) => {
          if (values.get('password') !== '') {
            setValue('password', '');
          }
        },
      },
      {
        name: 'tlsEnabled',
        label: 'Enable TLS',
        type: 'select',
        options: [
          { label: 'True', value: 'true' },
          { label: 'False', value: 'false' },
        ],
        required: true,
        enabled: true,
        visible: true,
        initialValue: initialValue('tlsEnabled', 'false'),
      },
      {
        name: 'fromAddress',
        label: 'From Address',
        type: 'text',
        required: true,
        enabled: true,
        visible: true,
        initialValue: initialValue('fromAddress'),
      },
      {
        name: 'fromName',
        label: 'From Name',
        type: 'text',
        enabled: true,
        visible: true,
        initialValue: initialValue('fromName'),
      },
      {
        name: 'toAddress',
        label: 'To Address',
        type: 'text',
        enabled: true,
        visible: true,
        required: true,
        initialValue: initialValue('toAddress'),
      },
    ]
  );
};

export const SystemSmtpForm = generateForm({
  dataSources,
  fields,
  handleSubmit,
});

SystemSmtpForm.displayName = 'SystemMailForm';

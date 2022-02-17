import { List, fromJS, get } from 'immutable';
import { generateForm } from '../form/Form';
import { fetchSystemSecurity, updateSystemSecurity } from '../../apis';
import { handleFormErrors } from '../form/Form.helpers';

const handleSubmit = () => values =>
  updateSystemSecurity({ systemSecurity: values.toJS() }).then(
    handleFormErrors(),
  );

const dataSources = () => ({
  systemSecurity: {
    fn: fetchSystemSecurity,
    params: [],
    transform: result => result.systemSecurity,
  },
});

const fields = () => ({ systemSecurity }) =>
  systemSecurity && [
    {
      name: 'allowedSystemIps',
      label: 'Allowed IPs',
      type: 'select',
      options: () =>
        fromJS([
          { name: 'description', label: 'Description', type: 'text' },
          { name: 'value', label: 'IP Range', type: 'text' },
        ]),
      visible: ({ values }) => values.get('allowedSystemIpsEnabled', false),
      initialValue: get(systemSecurity, 'allowedSystemIps', List()),
      serialize: ({ values }) =>
        values.get('allowedSystemIpsEnabled', false)
          ? values.get('allowedSystemIps')
          : [],
    },
    {
      name: 'allowedSystemIpsEnabled',
      label: 'Enabled Allowed IP Restrictions?',
      type: 'checkbox',
      initialValue: get(systemSecurity, 'allowedSystemIps', List()).size > 0,
      transient: true,
    },
  ];

export const SystemSecurityForm = generateForm({
  formOptions: [],
  dataSources,
  fields,
  handleSubmit,
});

SystemSecurityForm.displayName = 'SystemSecurityForm';

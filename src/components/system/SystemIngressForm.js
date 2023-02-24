import { get } from 'immutable';
import { generateForm } from '../form/Form';

const fetchSystemIngress = () =>
  Promise.resolve({
    ingress: {
      status: 'active',
      cn: '*.acme.com',
      createdAt: 'March 11, 2020 11:31 PM',
      expiresAt: 'July 1, 2021 11:31 PM',
      certificatePem: 'certificate pem',
      privateKeyPem: 'private key pem',
    },
  });

const updateSystemConfiguration = () => Promise.resolve();

const handleSubmit = () => values => {
  return updateSystemConfiguration({ systemConfiguration: values });
};

const dataSources = () => ({
  ingress: {
    fn: fetchSystemIngress,
    params: [],
    transform: result => {
      console.log('xform', result);
      return result.ingress;
    },
  },
});

const fields = () => ({ ingress }) =>
  ingress && [
    {
      name: 'certificatePem',
      label: 'Certificate',
      type: 'textarea',
      required: true,
      initialValue: get(ingress, 'certificatePem') || '',
    },
    {
      name: 'privateKeyPem',
      label: 'Private Key',
      type: 'textarea',
      initialValue: '',
    },
  ];

export const SystemIngressForm = generateForm({
  formOptions: [],
  dataSources,
  fields,
  handleSubmit,
});

SystemIngressForm.displayName = 'SystemIngressForm';

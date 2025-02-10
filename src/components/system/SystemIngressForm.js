import { generateForm } from '../form/Form';
import { fetchSystemIngress, updateSystemIngress } from '../../apis/system';
import { handleFormErrors } from '../form/Form.helpers';
import { List } from 'immutable';

const handleSubmit = () => values => {
  return updateSystemIngress({
    ingress: values
      .map(value => (List.isList(value) ? value.get(0) : value))
      .filter(Boolean)
      .toObject(),
    multipart: true,
  }).then(handleFormErrors('ingress'));
};

const dataSources = () => ({
  ingress: {
    fn: fetchSystemIngress,
    params: [],
    transform: result => result.ingress,
  },
});

const fields = () => ({ ingress }) =>
  ingress && [
    {
      name: 'current_key',
      label: 'Private Key',
      type: 'secret',
      transient: true,
      visible: false,
      initialValue: '',
    },
    {
      name: 'key',
      label: 'Private Key',
      type: 'file',
      required: ({ values }) => !!values.get('change_key'),
    },
    {
      name: 'change_key',
      label: 'Change Private Key',
      type: 'toggle',
      transient: true,
      initialValue: false,
      onChange: ({ values }, { setValue }) => {
        if (!List.isList(values.get('key')) || values.get('key').size > 0) {
          setValue('key', List());
        }
      },
    },
    {
      name: 'current_certificate',
      label: 'Certificate',
      type: 'certificate',
      transient: true,
      initialValue: ingress,
    },
    {
      name: 'certificate',
      label: 'Certificate',
      type: 'file',
      required: ({ values }) => !!values.get('change_certificate'),
    },
    {
      name: 'ca-chain',
      label: 'CA Chain',
      type: 'file',
      visible: ({ values }) => !!values.get('change_certificate'),
      required: ({ values }) => !!values.get('change_certificate'),
    },
    {
      name: 'change_certificate',
      label: 'Change Certificate',
      type: 'toggle',
      transient: true,
      initialValue: false,
      onChange: ({ values }, { setValue }) => {
        if (
          !List.isList(values.get('certificate')) ||
          values.get('certificate').size > 0
        ) {
          setValue('certificate', List());
        }
        if (
          !List.isList(values.get('ca-chain')) ||
          values.get('ca-chain').size > 0
        ) {
          setValue('ca-chain', List());
        }
      },
    },
  ];

export const SystemIngressForm = generateForm({
  formOptions: [],
  dataSources,
  fields,
  handleSubmit,
});

SystemIngressForm.displayName = 'SystemIngressForm';

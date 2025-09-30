import { fetchSpace, updateSpace } from '../../../apis';
import { fromJS, get } from 'immutable';
import { generateForm } from '../../form/Form';
import { handleFormErrors } from '../../form/Form.helpers';

const dataSources = ({ slug }) => ({
  space: {
    fn: fetchSpace,
    params: slug && [{ slug, include: 'details,allowedIps' }],
    transform: result => result.space,
  },
});

const handleSubmit =
  ({ slug }) =>
  values =>
    updateSpace({
      slug,
      space: values,
    }).then(handleFormErrors('space', 'There was an error saving the Space.'));

const fields =
  () =>
  ({ space }) =>
    space && [
      {
        name: 'name',
        label: 'Name',
        type: 'text',
        required: true,
        initialValue: get(space, 'name', '') || '',
      },
      {
        name: 'slug',
        label: 'Slug',
        type: 'text',
        required: false,
        enabled: false,
        initialValue: get(space, 'slug', '') || '',
      },
      {
        name: 'sharedBundleBase',
        label: 'Shared Bundle Base Directory',
        type: 'text',
        initialValue: get(space, 'sharedBundleBase') || '',
        helpText: 'Directory used as path prefix for bundles.',
        visible: false,
        required: false,
      },
      {
        name: 'bundlePath',
        label: 'Bundle Path',
        type: 'text',
        initialValue: get(space, 'bundlePath') || '',
        visible: false,
        required: false,
      },
      {
        name: 'allowedIps',
        label: 'Allowed IPs',
        type: 'select',
        options: () =>
          fromJS([
            { name: 'description', label: 'Description', type: 'text' },
            { name: 'value', label: 'IP Range', type: 'text' },
          ]),
        visible: ({ values }) => values.get('allowedIpsEnabled', false),
        initialValue: get(space, 'allowedIps', []),
        serialize: ({ values }) =>
          values.get('allowedIpsEnabled', false)
            ? values.get('allowedIps')
            : [],
      },
      {
        name: 'allowedIpsEnabled',
        label: 'Allowed IP Restrictions',
        type: 'checkbox',
        initialValue: get(space, 'allowedIpsEnabled', false) || false,
      },
    ];

export const SystemSpaceForm = generateForm({
  formOptions: ['slug'],
  dataSources,
  fields,
  handleSubmit,
});

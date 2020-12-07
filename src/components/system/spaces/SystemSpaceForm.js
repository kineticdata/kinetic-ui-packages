import { fetchSpace, updateSpace } from '../../../apis';
import { get } from 'immutable';
import { generateForm } from '../../form/Form';
import { handleFormErrors } from '../../form/Form.helpers';

const dataSources = ({ slug }) => ({
  space: {
    fn: fetchSpace,
    params: slug && [{ slug, include: 'details' }],
    transform: result => result.space,
  },
});

const handleSubmit = ({ slug }) => values =>
  updateSpace({
    slug,
    space: values,
  }).then(handleFormErrors('space', 'There was an error saving the Space.'));

const fields = ({ slug }) => ({ space }) =>
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
      name: 'sharedBundle',
      label: 'Use Shared Bundle base directory?',
      type: 'checkbox',
      transient: true,
      initialValue: (get(space, 'sharedBundleBase') || '') !== '',
      onChange: ({ values }, { setValue }) => {
        if (values.get('sharedBundleBase') !== '') {
          setValue('sharedBundleBase', '');
        }
        if (values.get('bundlePath') !== '') {
          setValue('bundlePath', '');
        }
      },
    },
    {
      name: 'sharedBundleBase',
      label: 'Shared Bundle Base Directory',
      type: 'text',
      initialValue: get(space, 'sharedBundleBase') || '',
      helpText: 'Directory used as path prefix for bundles.',
      visible: ({ values }) => values.get('sharedBundle'),
      required: ({ values }) => values.get('sharedBundle'),
    },
    {
      name: 'bundlePath',
      label: 'Bundle Path',
      type: 'text',
      initialValue: get(space, 'bundlePath') || '',
      visible: ({ values }) => get(values, 'sharedBundle'),
      required: ({ values }) => get(values, 'sharedBundle'),
    },
  ];

export const SystemSpaceForm = generateForm({
  formOptions: ['slug'],
  dataSources,
  fields,
  handleSubmit,
});

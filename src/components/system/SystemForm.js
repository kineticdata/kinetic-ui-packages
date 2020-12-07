import { get } from 'immutable';
import { generateForm } from '../form/Form';
import { fetchSystem, updateSystem } from '../../apis/system';
import { handleFormErrors } from '../form/Form.helpers';

const DISPLAY_TYPES = ['Display Page', 'Redirect', 'Default'];

const handleSubmit = () => values =>
  updateSystem({ system: values.toJS() }).then(handleFormErrors());

const dataSources = () => ({
  system: {
    fn: fetchSystem,
    params: [],
    transform: result => result.system,
  },
});

const fields = () => ({ system }) =>
  system && [
    {
      name: 'system-display-type',
      label: 'Application Home Page Display Type',
      type: 'select',
      options: DISPLAY_TYPES.map(displayType => ({
        value: displayType,
        label: displayType,
      })),
      required: true,
      initialValue: get(system, 'system-display-type') || 'Display Page',
      helpText:
        'Determines how the application works. For kinops, Single Page App is used.',
    },
    {
      name: 'system-display-value',
      label: 'Application Home Page Display Value',
      type: 'text',
      initialValue: get(system, 'system-display-value') || '',
      visible: ({ values }) => get(values, 'system-display-type') !== 'Default',
      required: ({ values }) =>
        get(values, 'system-display-type') !== 'Default',
    },
  ];

export const SystemForm = generateForm({
  formOptions: [],
  dataSources,
  fields,
  handleSubmit,
});

SystemForm.displayName = 'SystemForm';

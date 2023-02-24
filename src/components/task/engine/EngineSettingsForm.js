import { fetchEngineSettings, updateEngineSettings } from '../../../apis';
import { generateForm } from '../../form/Form';

const dataSources = ({ spaceSlug }) => {
  return {
    settings: {
      fn: fetchEngineSettings,
      params: [{ spaceSlug }],
      transform: result => result.settings,
    },
  };
};

const handleSubmit = ({ spaceSlug }) => values =>
  new Promise((resolve, reject) => {
    const settings = values.toJS();
    updateEngineSettings({ spaceSlug, settings }).then(({ message, error }) => {
      if (message) {
        resolve(message);
      } else {
        reject(error.message || 'There was an error saving the workflow');
      }
    });
  });

const fields = () => ({ settings }) =>
  settings && [
    {
      name: 'Sleep Delay',
      label: 'Sleep Delay',
      type: 'text',
      required: true,
      initialValue: settings.get('Sleep Delay'),
    },
    {
      name: 'Max Threads',
      label: 'Max Threads',
      type: 'text',
      required: false,
      initialValue: settings.get('Max Threads'),
    },
    {
      name: 'Trigger Query',
      label: 'Trigger Query',
      type: 'text',
      required: false,
      initialValue: settings.get('Trigger Query'),
    },
  ];

export const EngineSettingsForm = generateForm({
  formOptions: ['spaceSlug'],
  dataSources,
  fields,
  handleSubmit,
});

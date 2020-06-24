import { generateForm } from '../../form/Form';
import { createContext, updateContext } from '../../../apis';

const dataSources = () => ({});

const handleSubmit = ({ contextName }) => values =>
  new Promise((resolve, reject) => {
    const context = values.toJS();
    (contextName
      ? updateContext({ contextName, context })
      : createContext({ context })
    ).then(({ context, error }) => {
      if (context) {
        resolve(context);
      } else {
        reject(error.message || 'There was an error saving the context');
      }
    });
  });

const fields = ({ contextName }) => ({ values }) => {
  return [
    {
      name: 'name',
      label: 'Name',
      type: 'text',
      required: true,
      initialValue: contextName && contextName.slice(7),
      serialize: ({ values }) => values && 'custom.' + values.get('name'),
    },
  ];
};

export const ContextForm = generateForm({
  formOptions: ['contextName'],
  dataSources,
  fields,
  handleSubmit,
});

ContextForm.displayName = 'ContextForm';

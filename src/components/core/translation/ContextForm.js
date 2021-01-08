import { generateForm } from '../../form/Form';
import { createContext, updateContext } from '../../../apis';
import { handleFormErrors } from '../../form/Form.helpers';

const dataSources = () => ({});

const handleSubmit = ({ contextName }) => values => {
  const context = values.toJS();
  return (contextName
    ? updateContext({ contextName, context })
    : createContext({ context })
  ).then(handleFormErrors('context', 'There was an error saving the Context.'));
};

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

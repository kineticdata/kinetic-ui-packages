import { get } from 'immutable';
import { generateForm } from '../../form/Form';
import {
  fetchAgentComponent,
  updateAgentComponent,
  createAgentComponent,
} from '../../../apis';

const dataSources = ({ slug }) => ({
  agent: {
    fn: fetchAgentComponent,
    params: slug && [{ slug }],
    transform: result => result.agent,
  },
});

const handleSubmit = ({ slug }) => values =>
  (slug ? updateAgentComponent : createAgentComponent)({
    slug,
    agent: values.toJS(),
  }).then(({ agent, error }) => {
    if (error) {
      throw (error.statusCode === 400 && error.message) ||
        'There was an error saving the Agent';
    }
    return agent;
  });

const fields = ({ slug }) => ({ agent }) =>
  (!slug || agent) && [
    {
      name: 'slug',
      label: 'Agent Slug',
      type: 'text',
      required: true,
      initialValue: get(agent, 'slug') || '',
    },
    {
      name: 'secret',
      label: 'Agent Secret',
      type: 'password',
      visible: ({ values }) => values.get('changeSecret'),
      required: ({ values }) => values.get('changeSecret'),
      transient: ({ values }) => !values.get('changeSecret'),
    },
    {
      name: 'changeSecret',
      label: 'Change Agent Secret',
      type: 'checkbox',
      transient: true,
      // in "new" mode we do not show this toggle field and default it to true
      visible: !!slug,
      initialValue: !slug,
      onChange: ({ values }, { setValue }) => {
        if (values.get('secret') !== '') {
          setValue('secret', '');
        }
      },
    },
    {
      name: 'url',
      label: 'Agent Url',
      type: 'text',
      required: true,
      initialValue: get(agent, 'url') || '',
      helpText: 'URL to the Agent',
    },
  ];

export const AgentComponentForm = generateForm({
  formOptions: ['slug'],
  dataSources,
  fields,
  handleSubmit,
});

AgentComponentForm.displayName = 'AgentComponentForm';

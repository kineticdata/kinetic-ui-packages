import { get, getIn, List, Map } from 'immutable';
import { generateForm } from '../../form/Form';
import {
  fetchAgentHandler,
  createAgentHandler,
  updateAgentHandler,
  fetchAdapters,
} from '../../../apis';

const dataSources = ({ handlerSlug, agentSlug }) => ({
  handler: {
    fn: fetchAgentHandler,
    params: handlerSlug && [{ agentSlug, handlerSlug, include: 'details' }],
    transform: result => result.handler,
  },
  adapters: {
    fn: fetchAdapters,
    params: [{ include: 'details', type: 'handler', agentSlug }],
    transform: result => result.adapters,
  },
});

const handleSubmit = ({ handlerSlug, agentSlug }) => values =>
  (handlerSlug ? updateAgentHandler : createAgentHandler)({
    agentSlug,
    handlerSlug,
    handler: values.toJS(),
  }).then(({ handler, error }) => {
    if (error) {
      throw (error.statusCode === 400 && error.message) ||
        'There was an error saving the handler';
    }
    return handler;
  });

const HANDLER_FIELDS = ['slug', 'definitionId', 'properties'];

const fields = ({ handlerSlug, definitionId }) => ({ handler, adapters }) => {
  let properties = [];
  const initialDefinitionId = get(handler, 'definitionId', definitionId);

  if (adapters) {
    const adapter = adapters.find(
      a => a.get('definitionId') === initialDefinitionId,
    );

    const adapterProperties = adapter
      ? List(adapter.get('properties'))
      : List();

    properties = !adapterProperties.isEmpty()
      ? adapterProperties
          .map(property => ({
            name: property.get('name'),
            label: property.get('name'),
            type: property.get('sensitive') ? 'password' : 'text',
            required: property.get('required'),
            transient: true,
            initialValue: getIn(
              handler,
              ['properties', property.get('name')],
              '',
            ),
          }))
          .toArray()
      : [];
  }

  if (adapters && (!handlerSlug || (handlerSlug && handler))) {
    const fields =
      adapters &&
      (!handlerSlug || (handlerSlug && handler)) &&
      [
        {
          name: 'slug',
          label: 'Agent Handler Slug',
          type: 'text',
          required: true,
          initialValue: get(handler, 'slug', ''),
          helpText: 'Unique name for the instance of this handler.',
        },
        {
          name: 'definitionId',
          label: 'Handler Adapter',
          type: 'text',
          enabled: false,
          required: false,
          initialValue: initialDefinitionId,
          options: adapters.map(adapter =>
            Map({
              value: adapter.get('definitionId'),
              label: adapter.get('name'),
            }),
          ),
        },
        {
          name: 'properties',
          visible: false,
          initialValue: get(handler, 'properties', {}),
          serialize: ({ values }) =>
            values.filter((v, k) => !HANDLER_FIELDS.includes(k)).toJS(),
        },
      ].concat(properties);
    return fields;
  } else {
    return false;
  }
};

export const AgentHandlerForm = generateForm({
  formOptions: ['agentSlug', 'handlerSlug', 'definitionId'],
  dataSources,
  fields,
  handleSubmit,
});

AgentHandlerForm.displayName = 'AgentHandlerForm';

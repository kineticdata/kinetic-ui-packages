import { generateForm } from '../../form/Form';
import { List, Map } from 'immutable';

import {
  fetchBridgeModel,
  createBridgeModel,
  createBridgeModelMapping,
  updateBridgeModel,
  updateBridgeModelMapping,
  fetchBridges,
  fetchAgentComponents,
} from '../../../apis';

const getMapping = model =>
  (model &&
    model.get('mappings') &&
    model
      .get('mappings')
      .find(
        mapping => mapping.get('name') === model.get('activeMappingName'),
      )) ||
  {};

const dataSources = ({ modelName }) => ({
  model: {
    fn: fetchBridgeModel,
    params: modelName && [{ modelName, include: 'details' }],
    transform: result => result.bridgeModel,
  },
  modelMapping: {
    fn: getMapping,
    params: ({ model }) => modelName && model && [model],
  },
  agents: {
    fn: fetchAgentComponents,
    params: [],
    transform: result => result.agents,
  },
  bridges: {
    fn: fetchBridges,
    params: ({ values }) =>
      values && [{ agentSlug: values.get('agentSlug', 'system') }],
    transform: result => result.bridges,
  },
});

const handleSubmit = ({ modelName }) => async (values, { modelMapping }) => {
  // destructure the values of the fields because they will be used in different
  // payloads below
  const { name, status, bridgeSlug, agentSlug, structure } = values.toJS();

  // determine if we are creating / updating a model
  const modelMethod = modelName ? updateBridgeModel : createBridgeModel;

  // determine if we are creating / updating a model mapping, due to invalid
  // states its possible that we can be updating a model but creating a mapping
  const mappingName = modelMapping && modelMapping.get('name');
  const mappingMethod = mappingName
    ? updateBridgeModelMapping
    : createBridgeModelMapping;

  const { bridgeModel, error: modelError } = await modelMethod({
    modelName,
    bridgeModel: { name, status, activeMappingName: name },
  });

  if (modelError) {
    throw (modelError.statusCode === 400 && modelError.message) ||
      'There was an error saving the model';
  }

  const { error: mappingError } = await mappingMethod({
    modelName: name,
    mappingName,
    bridgeModelMapping: { name, bridgeSlug, agentSlug, structure },
  });

  if (mappingError) {
    throw (mappingError.statusCode === 400 && mappingError.message) ||
      'There was an error saving the model mapping';
  }

  return bridgeModel;
};

const fields = ({ modelName }) => ({ model, modelMapping, agents }) =>
  (!modelName || (model && modelMapping && agents)) && [
    {
      name: 'name',
      label: 'Name',
      type: 'text',
      required: true,
      initialValue: model ? model.get('name') : '',
      helpText: 'User friendly name for the bridge model.',
    },
    {
      name: 'status',
      label: 'Status',
      type: 'radio',
      initialValue: model ? model.get('status') : 'Active',
      options: [
        { label: 'Active', value: 'Active' },
        { label: 'Inactive', value: 'Inactive' },
      ],
    },
    {
      name: 'bridgeSlug',
      label: 'Bridge Slug',
      type: 'select',
      required: true,
      initialValue: modelMapping ? modelMapping.get('bridgeSlug') : '',
      helpText:
        'Unique name of the bridge to connect with this model. Bridges are configured under Plugins',
      options: ({ bridges }) =>
        bridges
          ? bridges.map(bridge =>
              Map({
                value: bridge.get('slug'),
                label: bridge.get('slug'),
              }),
            )
          : List(),
    },
    {
      name: 'agentSlug',
      label: 'Agent Slug',
      type: 'select',
      required: true,
      // We want to show the agents field if agents are defined within the space OR if
      // the agentSlug that a modelMapping is defined with no longer exists
      visible: ({ agents }) =>
        agents &&
        (agents.size > 0 ||
          (modelMapping &&
            modelMapping.get('agentSlug') !== 'system' &&
            agents.filter(a => a.get('slug') === modelMapping.get('agentSlug'))
              .size === 0)),
      initialValue: modelMapping
        ? modelMapping.get('agentSlug', 'system')
        : 'system',
      helpText:
        'Unique name of the agent this bridge model is connected to. Bridges are configured under Plugins',
      options: ({ agents }) =>
        agents
          ? agents
              .map(agent =>
                Map({
                  value: agent.get('slug'),
                  label: agent.get('slug'),
                }),
              )
              .unshift(
                Map({
                  value: 'system',
                  label: 'system',
                }),
              )
          : List(),
    },
    {
      name: 'structure',
      label: 'Structure',
      type: 'text',
      required: true,
      initialValue: modelMapping ? modelMapping.get('structure') : '',
      helpText: `Structures vary depending on the system. They can be table names, forms, domains or other elements.`,
    },
  ];

export const BridgeModelForm = generateForm({
  formOptions: ['modelName'],
  dataSources,
  fields,
  handleSubmit,
});

BridgeModelForm.displayName = 'BridgeModelForm';

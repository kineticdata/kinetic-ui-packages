import { generateForm } from '../../form/Form';
import {
  createIntegration,
  updateIntegration,
  fetchIntegration,
  fetchConnections,
  fetchOperations,
  inspectOperation,
  fetchSecurityPolicyDefinitions,
} from '../../../apis';
import { List, Map } from 'immutable';
import integrationTypes from '../../integrator/integrationTypes';

const dataSources = ({ kappSlug, name }) => ({
  integration: {
    fn: fetchIntegration,
    params: name && [{ kappSlug, name, include: 'securityPolicies' }],
    transform: result => result.integration,
    errorTransform: result => result.error,
  },
  connections: {
    fn: fetchConnections,
    params: [],
    transform: result => result.connections,
  },
  operations: {
    fn: fetchOperations,
    params: ({ values, integration }) => {
      const connectionId =
        values?.get('connectionId') || integration?.get('connectionId');
      return connectionId && [{ connectionId }];
    },
    transform: result => result.operations,
  },
  parameters: {
    fn: options =>
      !!options.operation ? inspectOperation(options) : Promise.resolve({}),
    params: ({ values }) => [{ operation: values?.get('operationId') }],
  },
  securityPolicyDefinitions: {
    fn: fetchSecurityPolicyDefinitions,
    params: kappSlug && [{ kappSlug }],
    transform: result => result.securityPolicyDefinitions,
  },
});

const handleSubmit = ({ kappSlug, name }) => values =>
  (name ? updateIntegration : createIntegration)({
    integration: values.toJS(),
    kappSlug,
    name,
  }).then(({ integration, error }) => {
    if (error) {
      throw (error.statusCode === 400 && error.message) ||
        'There was an error saving the integration';
    }
    return integration;
  });

const securityEndpoints = {
  execution: {
    endpoint: 'Execution',
    label: 'Execution Security Policy',
    types: ['Kapp'],
  },
};

const fields = ({ name }) => ({ integration, connections, operations }) =>
  (!name || integration) &&
  connections &&
  (!integration?.get('connectionId') || operations) && [
    {
      name: 'name',
      label: 'Name',
      type: 'text',
      pattern: /^[a-z\d-]+[a-z\d\s-]*$/i,
      patternMessage:
        'Name can only contain alpha-numeric characters, spaces, and hyphens, and cannot start with spaces.',
      required: true,
      initialValue: integration ? integration.get('name') : '',
    },
    {
      name: 'connectionId',
      label: 'Connection',
      type: 'select',
      required: true,
      initialValue: integration ? integration.get('connectionId') : '',
      options: ({ connections }) =>
        connections.map(conn =>
          Map({
            value: conn.get('id'),
            label: conn.get('name'),
            type: integrationTypes.getLabel(conn.get('type')),
            detail: conn.getIn(['config', 'baseUrl']),
          }),
        ),
      onChange: (bindings, { setValue }) => {
        setValue('operationId', '');
        setValue('inputMappings', {});
      },
    },
    {
      name: 'operationId',
      label: 'Operation',
      type: 'select',
      required: true,
      initialValue: integration ? integration.get('operationId') : '',
      options: ({ operations, values }) =>
        (operations || List())
          // Make sure we only show correct operations while waiting on data to
          // be fetched
          .filter(op => op.get('connectionId') === values.get('connectionId'))
          .map(op =>
            Map({
              value: op.get('id'),
              label: op.get('name'),
              detail: op.getIn(['config', 'method']),
            }),
          ),
      enabled: ({ values }) => !!values.get('connectionId'),
      placeholder: ({ values }) =>
        !values.get('connectionId') ? 'Select a connection' : undefined,
    },
    {
      name: 'inputMappings',
      label: 'Parameter Mappings',
      type: 'map',
      initialValue: integration ? integration.get('inputMappings') : {},
      enabled: ({ values }) => !!values.get('operationId'),
    },
    ...Object.entries(securityEndpoints).map(
      ([endpointFieldName, endpoint]) => ({
        name: endpointFieldName,
        label: endpoint.label,
        type: 'select',
        options: ({ securityPolicyDefinitions }) =>
          securityPolicyDefinitions
            ? securityPolicyDefinitions
                .filter(definition =>
                  endpoint.types.includes(definition.get('type')),
                )
                .map(definition =>
                  Map({
                    value: definition.get('name'),
                    label: definition.get('name'),
                    type: definition.get('type'),
                  }),
                )
            : [],
        initialValue: integration
          ? integration
              .get('securityPolicies')
              .find(
                pol => pol.get('endpoint') === endpoint.endpoint,
                null,
                Map({}),
              )
              .get('name', '')
          : '',
        transient: true,
      }),
    ),
    {
      name: 'securityPolicies',
      label: 'Security Policies',
      type: null,
      visible: false,
      serialize: ({ values }) =>
        Object.entries(securityEndpoints)
          .map(([endpointFieldName, policy]) => ({
            endpoint: policy.endpoint,
            name: values.get(endpointFieldName),
          }))
          .filter(endpoint => endpoint.name !== ''),
      initialValue: integration ? integration.get('securityPolicies') : [],
    },
  ];

export const IntegrationForm = generateForm({
  formOptions: ['kappSlug', 'name'],
  dataSources,
  fields,
  handleSubmit,
});

IntegrationForm.displayName = 'IntegrationForm';

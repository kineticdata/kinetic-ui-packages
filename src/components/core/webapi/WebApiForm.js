import { generateForm } from '../../form/Form';
import { get, Map } from 'immutable';
import { fetchSecurityPolicyDefinitions } from '../../../apis';

export const WEB_API_METHODS = ['GET', 'POST', 'PUT', 'DELETE'];

const securityEndpoints = {
  webApiExecution: {
    endpoint: 'Execution',
    label: 'WebAPI Execution',
    types: ['Space', 'Kapp'],
  },
};

const dataSources = ({ webApi }) => ({
  securityPolicyDefinitions: {
    fn: fetchSecurityPolicyDefinitions,
    params: webApi.get('kappSlug')
      ? [{ kappSlug: webApi.get('kappSlug') }]
      : [],
    transform: result => result.securityPolicyDefinitions,
  },
});

const handleSubmit = () => values => values.toObject();

const fields = ({ webApi }) => ({ securityPolicyDefinitions }) =>
  webApi &&
  securityPolicyDefinitions && [
    {
      name: 'slug',
      label: 'Slug',
      type: 'text',
      required: true,
      initialValue: get(webApi, 'slug') || '',
    },
    {
      name: 'method',
      label: 'Method',
      type: 'select',
      required: true,
      options: WEB_API_METHODS.map(el => ({
        value: el,
        label: el,
      })),
      initialValue: get(webApi, 'method') || '',
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
                  }),
                )
            : [],
        initialValue: webApi
          ? webApi
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
        Map(securityEndpoints)
          .map((policy, endpointFieldName) =>
            Map({
              endpoint: policy.endpoint,
              name: values.get(endpointFieldName),
            }),
          )
          .valueSeq()
          .filter(policy => policy.get('name') !== '')
          .toList(),
      initialValue: get(webApi, 'securityPolicies'),
    },
  ];

export const WebApiForm = generateForm({
  formOptions: ['webApi'],
  dataSources,
  fields,
  handleSubmit,
});

WebApiForm.displayName = 'WebApiForm';

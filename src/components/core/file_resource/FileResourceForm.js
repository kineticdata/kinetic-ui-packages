import { get, Map } from 'immutable';
import {
  createFileResource,
  fetchAgentComponents,
  fetchFileResource,
  fetchFilestores,
  fetchSecurityPolicyDefinitions,
  updateFileResource,
} from '../../../apis';
import { generateForm } from '../../form/Form';
import { handleFormErrors } from '../../form/Form.helpers';

const dataSources = ({ fileResourceSlug }) => ({
  fileResource: {
    fn: fetchFileResource,
    params: fileResourceSlug && [
      { fileResourceSlug, include: 'details,securityPolicies' },
    ],
    transform: result => result.fileResource,
  },
  agents: {
    fn: fetchAgentComponents,
    params: [],
    transform: result => [
      { label: 'System', value: 'system' },
      ...get(result, 'agents', []).map(agent => ({
        label: agent.name,
        value: agent.slug,
      })),
    ],
  },
  filestores: {
    fn: fetchFilestores,
    params: ({ values }) => [{ agentSlug: get(values, 'agentSlug', 'system') }],
    transform: result =>
      get(result, 'filestores', []).map(agent => ({
        label: agent.name,
        value: agent.slug,
      })),
  },
  securityPolicyDefinitions: {
    fn: fetchSecurityPolicyDefinitions,
    params: [],
    transform: result => result.securityPolicyDefinitions,
  },
});

const handleSubmit = ({ fileResourceSlug }) => values =>
  (fileResourceSlug ? updateFileResource : createFileResource)({
    fileResourceSlug,
    fileResource: values.toJS(),
  }).then(
    handleFormErrors(
      'fileResource',
      'There was a problem saving the File Resource.',
    ),
  );

const securityEndpoints = {
  fileAccess: {
    endpoint: 'File Access',
    label: 'File Access',
    types: ['Space', 'File Resource'],
  },
  fileModification: {
    endpoint: 'File Modification',
    label: 'File Modification',
    types: ['Space', 'File Resource'],
  },
};

const fields = ({ fileResourceSlug }) => ({
  fileResource,
  agents,
  securityPolicyDefinitions,
}) =>
  (!fileResourceSlug || fileResource) &&
  securityPolicyDefinitions &&
  agents && [
    {
      name: 'slug',
      label: 'Slug',
      type: 'text',
      required: true,
      initialValue: get(fileResource, 'slug', ''),
    },
    {
      name: 'agentSlug',
      label: 'Agent Slug',
      type: 'select',
      required: true,
      initialValue: get(fileResource, 'agentSlug', 'system'),
      options: ({ agents }) => agents,
      onChange: (_, { setValue }) => setValue('filestoreSlug', ''),
    },
    {
      name: 'filestoreSlug',
      label: 'Filestore Slug',
      type: 'select',
      required: true,
      initialValue: get(fileResource, 'filestoreSlug', ''),
      options: ({ filestores }) => filestores,
    },
    ...(fileResourceSlug
      ? Object.entries(securityEndpoints).map(
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
            initialValue: fileResource
              ? fileResource
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
        )
      : []),
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
      initialValue: get(fileResource, 'securityPolicies'),
    },
  ];

export const FileResourceForm = generateForm({
  formOptions: ['fileResourceSlug'],
  dataSources,
  fields,
  handleSubmit,
});

FileResourceForm.displayName = 'FileResourceForm';

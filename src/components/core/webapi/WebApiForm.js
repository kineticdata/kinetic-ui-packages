import { generateForm } from '../../form/Form';
import { get, Map } from 'immutable';
import {
  createWebApi,
  updateWebApi,
  fetchSecurityPolicyDefinitions,
  createTree,
  updateTree,
  fetchSpace,
} from '../../../apis';

export const WEB_API_METHODS = ['GET', 'POST', 'PUT', 'DELETE'];

const securityEndpoints = {
  webApiExecution: {
    endpoint: 'Execution',
    label: 'WebAPI Execution',
    types: ['Space', 'Kapp'],
  },
};

const dataSources = ({ kappSlug, webApi }) => ({
  securityPolicyDefinitions: {
    fn: fetchSecurityPolicyDefinitions,
    params:
      kappSlug || (webApi && webApi.get('kappSlug'))
        ? [{ kappSlug: kappSlug || (webApi && webApi.get('kappSlug')) }]
        : [],
    transform: result => result.securityPolicyDefinitions,
  },
});

const handleSubmit = ({ slug, kappSlug, webApi }) => async values => {
  if (!webApi) {
    const { space } = await fetchSpace({ include: 'platformComponents' });
    const sourceName = space.platformComponents.task.config.platformSourceName;
    const sourceGroup = kappSlug ? `WebApis > ${kappSlug}` : 'WebApis';

    const { webApi, error: error1 } = slug
      ? await updateWebApi({
          kappSlug,
          slug,
          webApi: values.toJS(),
          include: 'securityPolicies',
        })
      : await createWebApi({
          kappSlug,
          webApi: values.toJS(),
          include: 'securityPolicies',
        });
    if (error1) {
      throw (error1.statusCode === 400 && error1.message) ||
        'There was an error saving the WebAPI';
    }

    const { tree, error: error2 } = slug
      ? await updateTree({
          sourceName,
          sourceGroup,
          name: slug,
          tree: { sourceName, sourceGroup, name: values.get('slug') },
        })
      : await createTree({
          tree: { sourceGroup, sourceName, name: values.get('slug') },
        });
    if (error2) {
      throw (error2.statusCode === 400 && error2.message) ||
        'There was an error saving the WebAPI tree';
    }

    return { tree, webApi };
  } else {
    return values.toObject();
  }
};

const fields = ({ webApi }) => ({ securityPolicyDefinitions }) =>
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
  formOptions: ['kappSlug', 'slug', 'webApi'],
  dataSources,
  fields,
  handleSubmit,
});

WebApiForm.displayName = 'WebApiForm';

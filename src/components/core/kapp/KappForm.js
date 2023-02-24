import { get, Map } from 'immutable';
import { generateForm } from '../../form/Form';
import {
  fetchKapp,
  fetchSpace,
  fetchAttributeDefinitions,
  fetchSecurityPolicyDefinitions,
  createKapp,
  updateKapp,
} from '../../../apis';

import { buildBindings, slugify } from '../../../helpers';

const DISPLAY_TYPES = ['Display Page', 'Redirect'];

const SPACE_INCLUDES = 'details,spaceAttributeDefinitions';
const KAPP_INCLUDES =
  'attributesMap,securityPolicies,details,fields.details,formAttributeDefinitions';

const dataSources = ({ kappSlug }) => ({
  space: {
    fn: fetchSpace,
    params: [{ include: SPACE_INCLUDES }],
    transform: result => result.space,
  },
  kapp: {
    fn: fetchKapp,
    params: kappSlug && [{ kappSlug, include: KAPP_INCLUDES }],
    transform: result => result.kapp,
  },
  attributeDefinitions: {
    fn: fetchAttributeDefinitions,
    params: kappSlug && [
      { kappSlug, attributeType: 'kappAttributeDefinitions' },
    ],
    transform: result => result.attributeDefinitions,
  },
  securityPolicyDefinitions: {
    fn: fetchSecurityPolicyDefinitions,
    params: kappSlug && [{ kappSlug }],
    transform: result => result.securityPolicyDefinitions,
  },
});

const handleSubmit = ({ kappSlug }) => values =>
  (kappSlug ? updateKapp : createKapp)({ kappSlug, kapp: values.toJS() }).then(
    ({ kapp, error }) => {
      if (error) {
        throw (error.statusCode === 400 && error.message) ||
          'There was an error saving the kapp';
      }
      return kapp;
    },
  );

const securityEndpoints = {
  kappDisplay: {
    endpoint: 'Display',
    label: 'Kapp Display',
    types: ['Kapp'],
  },
  formCreation: {
    endpoint: 'Form Creation',
    label: 'Form Creation',
    types: ['Kapp', 'Form'],
  },
  kappModification: {
    endpoint: 'Modification',
    label: 'Kapp Modification',
    types: ['Kapp'],
  },
  defaultFormDisplay: {
    endpoint: 'Default Form Display',
    label: 'Default Form Display',
    types: ['Kapp', 'Form'],
  },
  defaultFormModification: {
    endpoint: 'Default Form Modification',
    label: 'Default Form Modification',
    types: ['Kapp', 'Form'],
  },
  defaultSubmissionAccess: {
    endpoint: 'Default Submission Access',
    label: 'Default Submission Access',
    types: ['Kapp', 'Form', 'Submission'],
  },
  defaultSubmissionModification: {
    endpoint: 'Default Submission Modification',
    label: 'Default Submission Modification',
    types: ['Kapp', 'Form', 'Submission'],
  },
  submissionSupport: {
    endpoint: 'Submission Support',
    label: 'Submission Support',
    types: ['Kapp', 'Form', 'Submission'],
  },
};

const fields = ({ kappSlug }) => ({ kapp }) =>
  (!kappSlug || kapp) && [
    {
      name: 'afterLogoutPath',
      label: 'After Logout Path',
      type: 'text',
      initialValue: get(kapp, 'afterLogoutPath'),
      visible: ({ space }) => get(space, 'displayType') !== 'Single Page App',
    },
    {
      name: 'bundlePath',
      label: 'Bundle Path',
      type: 'text',
      initialValue: get(kapp, 'bundlePath'),
      visible: ({ space }) => get(space, 'displayType') !== 'Single Page App',
    },
    {
      name: 'defaultFormConfirmationPage',
      label: 'Form Confirmation Page',
      type: 'text',
      initialValue: get(kapp, 'defaultFormConfirmationPage'),
      visible: ({ space }) => get(space, 'displayType') !== 'Single Page App',
    },
    {
      name: 'defaultFormDisplayPage',
      label: 'Form Display Page',
      type: 'text',
      initialValue: get(kapp, 'defaultFormDisplayPage'),
      visible: ({ space }) => get(space, 'displayType') !== 'Single Page App',
    },
    {
      name: 'defaultSubmissionLabelExpression',
      label: 'Submission Label',
      type: 'code',
      language: 'js-template',
      initialValue: get(kapp, 'defaultSubmissionLabelExpression') || '',
      helpText:
        // eslint-disable-next-line no-template-curly-in-string
        "Default label for form submissions. Click the </> button to see available values derived from each submission. Example: ${form('name')}",
      options: ({ space, kapp, attributeDefinitions }) =>
        buildBindings({
          space,
          kapp:
            kapp && kapp.set('kappAttributeDefinitions', attributeDefinitions),
          scope: 'Submission',
        }),
    },
    {
      name: 'displayType',
      label: 'Display Type',
      type: 'select',
      options: DISPLAY_TYPES.map(displayType => ({
        value: displayType,
        label: displayType,
      })),
      enabled: ({ space }) => get(space, 'displayType') !== 'Single Page App',
      initialValue: get(kapp, 'displayType') || 'Display Page',
      helpText: 'Determines how the application works. Set in Space Settings.',
    },
    {
      name: 'displayValue',
      label: ({ values }) =>
        values.get('displayType') === 'Redirect'
          ? 'Redirect URL'
          : 'Kapp Display Page',
      type: 'text',
      initialValue: get(kapp, 'displayValue'),
      required: ({ values }) => values.get('displayType') === 'Redirect',
      requiredMessage:
        "This field is required, when display type is 'Redirect'",
      visible: ({ space }) => get(space, 'displayType') !== 'Single Page App',
    },
    {
      name: 'loginPage',
      label: 'Login Page',
      type: 'text',
      initialValue: get(kapp, 'loginPage'),
      visible: ({ space }) => get(space, 'displayType') !== 'Single Page App',
    },
    {
      name: 'name',
      label: 'Kapp Name',
      type: 'text',
      required: true,
      initialValue: get(kapp, 'name'),
      helpText: 'User friendly name for the Kapp, used throughout the system.',
      onChange: ({ values }, { setValue }) => {
        if (values.get('linked')) {
          setValue('slug', slugify(values.get('name')), false);
        }
      },
    },
    {
      name: 'resetPasswordPage',
      label: 'Reset Password Page',
      type: 'text',
      initialValue: get(kapp, 'resetPasswordPage'),
      visible: ({ space }) => get(space, 'displayType') !== 'Single Page App',
    },
    {
      name: 'slug',
      label: 'Slug',
      type: 'text',
      required: true,
      initialValue: get(kapp, 'slug'),
      helpText: 'Unique name used in the Kapp path.',
      onChange: (_bindings, { setValue }) => {
        setValue('linked', false);
      },
    },
    {
      name: 'linked',
      label: 'Linked',
      type: 'checkbox',
      transient: true,
      initialValue: kapp ? false : true,
      visible: false,
    },
    ...(kappSlug
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
            initialValue: kapp
              ? kapp
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
      initialValue: get(kapp, 'securityPolicies'),
    },
    !!kappSlug && {
      name: 'attributesMap',
      label: 'Attributes',
      type: 'attributes',
      required: false,
      options: ({ attributeDefinitions }) => attributeDefinitions,
      initialValue: get(kapp, 'attributesMap'),
    },
  ];

export const KappForm = generateForm({
  formOptions: ['kappSlug'],
  dataSources,
  fields,
  handleSubmit,
});

KappForm.displayName = 'KappForm';

import { generateForm } from '../../form/Form';
import {
  fetchSecurityPolicyDefinition,
  createSecurityPolicyDefinition,
  updateSecurityPolicyDefinition,
  fetchSpace,
  fetchKapp,
  fetchProfile,
} from '../../../apis';
import { buildCodeEditorBindings } from '../../../helpers';

export const SPACE_SECURITY_DEFINITION_TYPES = [
  'Space',
  'File Resource',
  'Team',
  'User',
];
const SPACE_SECURITY_DEFINITION_TYPES_MAP = {
  Space: ['Space'],
  'File Resource': ['Space', 'File Resource'],
  Team: ['Space', 'Team'],
  User: ['Space', 'User'],
};

export const KAPP_SECURITY_DEFINITION_TYPES = ['Kapp', 'Form', 'Submission'];
const KAPP_SECURITY_DEFINITION_TYPES_MAP = {
  Kapp: ['Kapp'],
  Form: ['Kapp', 'Form'],
  Submission: ['Kapp', 'Form', 'Submission'],
};

const SPACE_INCLUDES =
  'spaceAttributeDefinitions,teamAttributeDefinitions,userAttributeDefinitions,userProfileAttributeDefinitions';
const KAPP_INCLUDES =
  'formAttributeDefinitions,kappAttributeDefinitions,fields.details';
const PROFILE_INCLUDES = 'attributesMap,profileAttributesMap';

const dataSources = ({ securityPolicyName, kappSlug }) => ({
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
  securityPolicy: {
    fn: fetchSecurityPolicyDefinition,
    params: securityPolicyName && [{ securityPolicyName, kappSlug }],
    transform: result => result.securityPolicyDefinition,
    errorTransform: result => result.error,
  },
  profile: {
    fn: fetchProfile,
    params: [{ include: PROFILE_INCLUDES }],
    transform: result => result.profile,
  },
});

const handleSubmit = ({ securityPolicyName, kappSlug }) => values =>
  (securityPolicyName
    ? updateSecurityPolicyDefinition
    : createSecurityPolicyDefinition)({
    securityPolicyName,
    securityPolicyDefinition: values.toJS(),
    kappSlug,
  }).then(({ securityPolicyDefinition, error }) => {
    if (error) {
      throw (error.statusCode === 400 && error.message) ||
        'There was an error saving the security definition';
    }
    return securityPolicyDefinition;
  });

const fields = ({ securityPolicyName, securityPolicyType, kappSlug }) => ({
  securityPolicy,
}) =>
  (!securityPolicyName || securityPolicy) && [
    {
      name: 'name',
      label: 'Name',
      type: 'text',
      required: true,
      initialValue: securityPolicy ? securityPolicy.get('name') : '',
      helpText: 'Will be displayed in security policy dropdowns.',
    },
    {
      name: 'type',
      label: 'Type',
      type: 'select',
      required: true,
      options: (kappSlug
        ? securityPolicyType &&
          KAPP_SECURITY_DEFINITION_TYPES.includes(securityPolicyType)
          ? KAPP_SECURITY_DEFINITION_TYPES_MAP[securityPolicyType]
          : KAPP_SECURITY_DEFINITION_TYPES
        : securityPolicyType &&
          SPACE_SECURITY_DEFINITION_TYPES.includes(securityPolicyType)
          ? SPACE_SECURITY_DEFINITION_TYPES_MAP[securityPolicyType]
          : SPACE_SECURITY_DEFINITION_TYPES
      ).map(ele => ({
        value: ele,
        label: ele,
      })),
      initialValue: securityPolicy
        ? securityPolicy.get('type')
        : kappSlug
          ? 'Kapp'
          : 'Space',
      helpText:
        'Determines what information is available to the definition rule, as well as what security policies the security definition can be applied to.',
    },
    {
      name: 'message',
      label: 'Message',
      type: 'text',
      required: true,
      initialValue: securityPolicy ? securityPolicy.get('message') : '',
      helpText: 'Returned to the user if permission is denied.',
    },
    {
      name: 'rule',
      label: 'Rule',
      type: 'code',
      language: 'js-expression',
      required: true,
      options: ({ space, kapp, values, profile }) =>
        buildCodeEditorBindings({
          identity: profile && {
            attributeDefinitions: space?.get('userAttributeDefinitions'),
            profileAttributeDefinitions: space?.get(
              'userProfileAttributeDefinitions',
            ),
          },
          space: {
            attributeDefinitions: space?.get('spaceAttributeDefinitions'),
          },
          file: values.get('type') === 'File Resource' && {},
          user: values.get('type') === 'User' && {
            attributeDefinitions: space?.get('userAttributeDefinitions'),
            profileAttributeDefinitions: space?.get(
              'userProfileAttributeDefinitions',
            ),
          },
          team: values.get('type') === 'Team' && {
            attributeDefinitions: space?.get('teamAttributeDefinitions'),
          },
          kapp: ['Kapp', 'Form', 'Submission'].includes(values.get('type')) && {
            attributeDefinitions: kapp?.get('kappAttributeDefinitions'),
          },
          form: ['Form', 'Submission'].includes(values.get('type')) && {
            attributeDefinitions: kapp?.get('formAttributeDefinitions'),
          },
          submission: values.get('type') === 'Submission' && { detailed: true },
          values: values.get('type') === 'Submission' &&
            kapp?.get('fields').size > 0 && { data: kapp.get('fields') },
        }),
      initialValue: securityPolicy ? securityPolicy.get('rule') : '',
      helpText: `Expression to evaluate to true or false. Click the </> button to see available values scoped to this Kapp or Space.`,
    },
  ];

export const SecurityDefinitionForm = generateForm({
  formOptions: ['kappSlug', 'securityPolicyName', 'securityPolicyType'],
  dataSources,
  fields,
  handleSubmit,
});

SecurityDefinitionForm.displayName = 'SecurityDefinitionForm';

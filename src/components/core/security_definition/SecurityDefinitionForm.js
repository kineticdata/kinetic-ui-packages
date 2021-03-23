import { generateForm } from '../../form/Form';
import {
  fetchSecurityPolicyDefinition,
  createSecurityPolicyDefinition,
  updateSecurityPolicyDefinition,
  fetchSpace,
  fetchKapp,
  fetchProfile,
} from '../../../apis';
import { buildBindings } from '../../../helpers';

export const SPACE_SECURITY_DEFINITION_TYPES = ['Space', 'Team', 'User'];

export const KAPP_SECURITY_DEFINITION_TYPES = ['Kapp', 'Form', 'Submission'];

const SPACE_INCLUDES =
  'datastoreFormAttributeDefinitions,spaceAttributeDefinitions,teamAttributeDefinitions,userAttributeDefinitions,userProfileAttributeDefinitions';
const KAPP_INCLUDES =
  'formAttributeDefinitions,kappAttributeDefinitions,fields';
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

const fields = ({ securityPolicyName, kappSlug }) => ({ securityPolicy }) =>
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
        ? KAPP_SECURITY_DEFINITION_TYPES
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
      language: 'js',
      required: true,
      options: ({ space, kapp, values, profile }) =>
        buildBindings({ space, kapp, scope: values.get('type'), profile }),
      initialValue: securityPolicy ? securityPolicy.get('rule') : '',
      helpText: `Expression to evaluate to true or false. Click the </> button to see available values scoped to this Kapp or Space.`,
    },
  ];

export const SecurityDefinitionForm = generateForm({
  formOptions: ['kappSlug', 'securityPolicyName'],
  dataSources,
  fields,
  handleSubmit,
});

SecurityDefinitionForm.displayName = 'SecurityDefinitionForm';

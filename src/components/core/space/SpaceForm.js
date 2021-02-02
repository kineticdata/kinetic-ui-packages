import { get, Map } from 'immutable';
import t from 'prop-types';
import { generateForm } from '../../form/Form';
import {
  updateSpace,
  fetchSpace,
  fetchAttributeDefinitions,
  fetchLocales,
  fetchTimezones,
  fetchSecurityPolicyDefinitions,
} from '../../../apis';
import { slugify } from '../../../helpers';

const DISPLAY_TYPES = ['Display Page', 'Redirect', 'Single Page App'];

const dataSources = () => ({
  space: {
    fn: fetchSpace,
    params: [
      {
        include: 'attributesMap,securityPolicies,details',
      },
    ],
    transform: result => result.space,
  },
  locales: {
    fn: fetchLocales,
    params: [],
    transform: result => result.data.locales,
  },
  timezones: {
    fn: fetchTimezones,
    params: [],
    transform: result => result.data.timezones,
  },
  attributeDefinitions: {
    fn: fetchAttributeDefinitions,
    params: [{ attributeType: 'spaceAttributeDefinitions' }],
    transform: result => result.attributeDefinitions,
  },
  securityPolicyDefinitions: {
    fn: fetchSecurityPolicyDefinitions,
    params: [],
    transform: result => result.securityPolicyDefinitions,
  },
});

const handleSubmit = () => values =>
  updateSpace({
    space: values,
  }).then(({ space, error }) => {
    if (error) {
      throw (error.statusCode === 400 && error.message) ||
        'There was an error saving the space';
    }
    return space;
  });

const securityEndpoints = {
  discussionCreation: {
    endpoint: 'Discussion Creation',
    label: 'Discussion Creation',
    types: ['Space'],
  },
  spaceDisplay: {
    endpoint: 'Display',
    label: 'Space Display',
    types: ['Space'],
  },
  teamsAccess: {
    endpoint: 'Teams Access',
    label: 'Teams Access',
    types: ['Space', 'Team'],
  },
  teamsCreation: {
    endpoint: 'Team Creation',
    label: 'Team Creation',
    types: ['Space', 'Team'],
  },
  teamMembershipModification: {
    endpoint: 'Team Membership Modification',
    label: 'Team Membership Modification',
    types: ['Space', 'Team'],
  },
  teamModification: {
    endpoint: 'Team Modification',
    label: 'Team Modification',
    types: ['Space', 'Team'],
  },
  userAccess: {
    endpoint: 'Users Access',
    label: 'User Access',
    types: ['Space', 'User'],
  },
  userCreation: {
    endpoint: 'User Creation',
    label: 'User Creation',
    types: ['Space', 'User'],
  },
  userModification: {
    endpoint: 'User Modification',
    label: 'User Modification',
    types: ['Space', 'User'],
  },
};

const fields = () => ({
  attributeDefinitions,
  locales,
  securityPolicyDefinitions,
  space,
  timezones,
}) =>
  space &&
  locales &&
  timezones &&
  attributeDefinitions &&
  securityPolicyDefinitions && [
    {
      name: 'afterLogoutPath',
      label: 'After Logout Path',
      type: 'text',
      initialValue: get(space, 'afterLogoutPath'),
      placeholder: ({ space }) => `/${get(space, 'slug')}`,
      visible: ({ values }) => get(values, 'displayType') !== 'Single Page App',
    },
    {
      name: 'bundlePath',
      label: 'Bundle Path',
      type: 'text',
      initialValue: get(space, 'bundlePath'),
      required: ({ values }) =>
        get(values, 'sharedBundleBase') !== '' &&
        get(values, 'displayType') === 'Display Page',
    },
    {
      name: 'defaultDatastoreFormConfirmationPage',
      label: 'Default Datastore Form Confirmation Page',
      type: 'text',
      initialValue: get(space, 'defaultDatastoreFormConfirmationPage'),
      placeholder: 'confirmation.jsp',
      visible: ({ values }) => get(values, 'displayType') !== 'Single Page App',
    },
    {
      name: 'defaultDatastoreFormDisplayPage',
      label: 'Default Datastore Form Display Page',
      type: 'text',
      initialValue: get(space, 'defaultDatastoreFormDisplayPage'),
      placeholder: 'form.jsp',
      visible: ({ values }) => get(values, 'displayType') !== 'Single Page App',
    },
    {
      name: 'defaultLocale',
      label: 'Default Locale',
      type: 'text',
      options: ({ locales }) =>
        locales.map(locale =>
          Map({
            value: locale.get('code'),
            label: locale.get('name'),
          }),
        ),
      initialValue: get(space, 'defaultLocale') || '',
    },
    {
      name: 'defaultTimezone',
      label: 'Default Timezone',
      type: 'text',
      options: ({ timezones }) =>
        timezones.map(timezone =>
          Map({
            value: timezone.get('id'),
            label: `${timezone.get('name')} (${timezone.get('id')})`,
          }),
        ),
      initialValue: get(space, 'defaultTimezone') || '',
    },
    {
      name: 'displayType',
      label: 'Display Type',
      type: 'select',
      options: DISPLAY_TYPES.map(displayType => ({
        value: displayType,
        label: displayType,
      })),
      required: true,
      initialValue: get(space, 'displayType') || 'Display Page',
      helpText:
        'Determines how the application works. For kinops, Single Page App is used.',
    },
    {
      name: 'displayValueJSP',
      label: 'Space Display Page',
      type: 'text',
      transient: true,
      placeholder: 'space.jsp',
      visible: ({ values }) => get(values, 'displayType') === 'Display Page',
      required: ({ values }) => get(values, 'displayType') === 'Display Page',
      initialValue:
        get(space, 'displayType') === 'Display Page'
          ? get(space, 'displayValue')
          : '',
    },
    {
      name: 'displayValueRedirect',
      label: 'Redirect URL',
      type: 'text',
      transient: true,
      visible: ({ values }) => get(values, 'displayType') === 'Redirect',
      required: ({ values }) => get(values, 'displayType') === 'Redirect',
      requiredMessage:
        "This field is required, when display type is 'Redirect'",
      initialValue:
        get(space, 'displayType') === 'Redirect'
          ? get(space, 'displayValue')
          : '',
    },
    {
      name: 'displayValueSPA',
      label: 'Location',
      type: 'text',
      transient: true,
      visible: ({ values }) => get(values, 'displayType') === 'Single Page App',
      required: ({ values }) =>
        get(values, 'displayType') === 'Single Page App',
      initialValue:
        get(space, 'displayType') === 'Single Page App'
          ? (get(space, 'displayValue') || '')
              .replace('spa.jsp', '')
              .replace('?location=', '')
          : '',
      helpText: 'See explanation below for external and embedded asset modes.',
    },
    {
      name: 'displayValue',
      label: 'Dispaly Value',
      type: 'text',
      visible: false,
      initialValue: get(space, 'displayValue'),
      serialize: ({ values }) => {
        const displayType = values.get('displayType');
        const displayValueSPA = values.get('displayValueSPA');
        const displayValueJSP = values.get('displayValueJSP');
        const displayValueRedirect = values.get('displayValueRedirect');
        if (displayType === 'Single Page App') {
          return displayValueSPA && displayValueSPA.endsWith('index.html')
            ? displayValueSPA
            : `spa.jsp${displayValueSPA && '?location=' + displayValueSPA}`;
        } else {
          return displayType === 'Redirect'
            ? displayValueRedirect
            : displayValueJSP;
        }
      },
    },
    {
      name: 'loginPage',
      label: 'Login Page',
      type: 'text',
      initialValue: get(space, 'loginPage'),
      placeholder: 'login.jsp',
      visible: ({ values }) => get(values, 'displayType') !== 'Single Page App',
    },
    {
      name: 'name',
      label: 'Space Name',
      type: 'text',
      required: true,
      initialValue: get(space, 'name'),
      onChange: ({ values }, { setValue }) => {
        if (values.get('linked')) {
          setValue('slug', slugify(values.get('name')), false);
        }
      },
      helpText:
        'User friendly name for space, used throughout the application.',
    },
    {
      name: 'resetPasswordPage',
      label: 'Reset Password Page',
      type: 'text',
      initialValue: get(space, 'resetPasswordPage'),
      placeholder: 'resetPassword.jsp',
      visible: ({ values }) => get(values, 'displayType') !== 'Single Page App',
    },
    {
      name: 'oauthSigningKey',
      label: 'OAuth Signing Key',
      type: 'password',
      visible: ({ values }) => values.get('changeOAuthSigningKey'),
      transient: ({ values }) => !values.get('changeOAuthSigningKey'),
    },
    {
      name: 'changeOAuthSigningKey',
      label: 'Change OAuth Signing Key',
      type: 'checkbox',
      transient: true,
      // in "new" mode we do not show this toggle field and default it to true
      visible: ({ space }) => !!space,
      initialValue: !space,
      onChange: ({ values }, { setValue }) => {
        if (values.get('oauthSigningKey') !== '') {
          setValue('oauthSigningKey', '');
        }
      },
    },
    {
      name: 'sessionInactiveLimitInSeconds',
      label: 'Inactive Session Limit (in seconds)',
      type: 'text',
      initialValue: get(space, 'sessionInactiveLimitInSeconds'),
      helpText:
        'Users will be logged out automatically if inactive for this amount of time.',
      serialize: ({ values }) =>
        parseInt(values.get('sessionInactiveLimitInSeconds')),
    },
    {
      name: 'sharedBundleBase',
      label: 'Shared Bundle Base',
      type: 'text',
      initialValue: get(space, 'sharedBundleBase'),
      helpText: 'Directory used as path prefix for bundles.',
    },
    {
      name: 'slug',
      label: 'Slug',
      type: 'text',
      required: true,
      initialValue: get(space, 'slug'),
      onChange: (_bindings, { setValue }) => {
        setValue('linked', false);
      },
      helpText: 'Unique name used in the space path.',
    },
    {
      name: 'linked',
      label: 'Linked',
      type: 'checkbox',
      transient: true,
      initialValue: true,
      visible: false,
    },
    {
      name: 'trustedFrameDomains',
      label: 'Trusted Frame Domains',
      type: 'text-multi',
      initialValue: get(space, 'trustedFrameDomains'),
    },
    {
      name: 'trustedResourceDomains',
      label: 'Trusted Resource Domains',
      type: 'text-multi',
      initialValue: get(space, 'trustedResourceDomains'),
    },
    ...Object.entries(securityEndpoints).map(
      ([endpointFieldName, endpoint]) => ({
        name: endpointFieldName,
        label: endpoint.label,
        type: 'select',
        options: ({ securityPolicyDefinitions }) =>
          securityPolicyDefinitions
            .filter(definition =>
              endpoint.types.includes(definition.get('type')),
            )
            .map(definition =>
              Map({
                value: definition.get('name'),
                label: definition.get('name'),
              }),
            ),
        initialValue: space
          ? space
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
      initialValue: get(space, 'securityPolicies'),
    },
    {
      name: 'attributesMap',
      label: 'Attributes',
      type: 'attributes',
      required: false,
      options: ({ attributeDefinitions }) => attributeDefinitions,
      initialValue: get(space, 'attributesMap'),
    },
  ];

export const SpaceForm = generateForm({
  formOptions: [],
  dataSources,
  fields,
  handleSubmit,
});

SpaceForm.displayName = 'SpaceForm';

SpaceForm.propTypes = {
  /**
   * A unique identifier for this form.
   * If none is provided, one will be automatically generated and
   * the form will be automatically mounted.
   *
   * If a formKey is provided, the form won't render until the
   * `mountForm` action is dispatched.
   */
  formKey: t.string,
  /**
   * A set of fields that should be added to the form
   */
  addFields: t.oneOfType([t.array, t.func]),
  /**
   * The layout of the form.
   * - @param {Node} form The react `Node` of the rendered form
   * - @param {Object} bindings all bindings fetched when the form was loaded
   * - @param {Boolean} initialized If the form has been initialized
   */
  children: t.func,
};

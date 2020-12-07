import { get, List, Map } from 'immutable';
import { generateForm } from '../../form/Form';
import {
  createUser,
  fetchAttributeDefinitions,
  fetchUser,
  updateUser,
  fetchLocales,
  fetchTimezones,
} from '../../../apis';
import { handleFormErrors } from '../../form/Form.helpers';

const USER_INCLUDES =
  'attributesMap,authorization,memberships,profileAttributesMap';
const EMAIL_REGEX = /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/;

const dataSources = ({ username, spaceSlug }) => ({
  locales: {
    fn: fetchLocales,
    params: !spaceSlug && [],
    transform: result => result.data.locales,
  },
  timezones: {
    fn: fetchTimezones,
    params: !spaceSlug && [],
    transform: result => result.data.timezones,
  },
  user: {
    fn: fetchUser,
    params: username && [{ username, include: USER_INCLUDES, spaceSlug }],
    transform: result => result.user,
  },
  attributeDefinitions: {
    fn: fetchAttributeDefinitions,
    params: !spaceSlug && [{ attributeType: 'userAttributeDefinitions' }],
    transform: result => result.attributeDefinitions,
  },
  profileAttributeDefinitions: {
    fn: fetchAttributeDefinitions,
    params: !spaceSlug && [
      { attributeType: 'userProfileAttributeDefinitions' },
    ],
    transform: result => result.attributeDefinitions,
  },
});

const handleSubmit = ({ username, spaceSlug }) => values => {
  const user = values.toJS();
  return (username
    ? updateUser({ spaceSlug, username, user })
    : createUser({ spaceSlug, user })
  ).then(handleFormErrors('user', 'There was an error saving the User.'));
};

const fields = ({ username }) => ({ user }) =>
  (!username || user) && [
    {
      name: 'username',
      label: 'Username',
      type: 'text',
      required: true,
      enabled: !username,
      initialValue: get(user, 'username') || '',
    },
    {
      name: 'email',
      label: 'Email',
      type: 'text',
      initialValue: get(user, 'email') || '',
      pattern: EMAIL_REGEX,
      patternMessage: 'You must specify a valid email address.',
    },
    {
      name: 'displayName',
      label: 'Display Name',
      type: 'text',
      initialValue: get(user, 'displayName') || '',
    },
    {
      name: 'enabled',
      label: 'Enabled?',
      type: 'checkbox',
      initialValue: user ? get(user, 'enabled') : true,
      helpText: 'Enabled users are allowed to login to the system.',
    },
    {
      name: 'spaceAdmin',
      label: 'Space Admin?',
      type: 'checkbox',
      initialValue: user ? get(user, 'spaceAdmin') : false,
      helpText:
        'Space Admins are users with full access within a space. Security Policies are not applied to any users that are Space Admins.',
    },
    {
      name: 'password',
      label: 'Password',
      type: 'password',
      required: ({ values }) => values.get('changePassword'),
      visible: ({ values }) => values.get('changePassword'),
      transient: ({ values }) => !values.get('changePassword'),
    },
    {
      name: 'passwordConfirmation',
      label: 'Password Confirmation',
      type: 'password',
      required: ({ values }) => values.get('changePassword'),
      visible: ({ values }) => values.get('changePassword'),
      transient: ({ values }) => !values.get('changePassword'),
      constraint: ({ values }) =>
        values.get('passwordConfirmation') === values.get('password'),
      constraintMessage: 'Password Confirmation does not match',
    },
    {
      name: 'changePassword',
      label: 'Change Password',
      type: 'checkbox',
      visible: !!username,
      initialValue: !username,
      transient: true,
      onChange: ({ values }, { setValue }) => {
        if (values.get('password') !== '') {
          setValue('password', '');
        }
        if (values.get('passwordConfirmation') !== '') {
          setValue('passwordConfirmation', '');
        }
      },
    },
    {
      name: 'allowedIps',
      label: 'Allowed IP Addresses',
      placeholder: '*',
      type: 'text',
      required: false,
      initialValue: get(user, 'allowedIps') || '',
      helpText:
        'Ability to restrict login by IP address. Use * for unrestricted. Separate by a comma for multiple IP addresses.',
    },
    {
      name: 'preferredLocale',
      label: 'Preferred Locale',
      type: 'text',
      options: ({ locales }) =>
        locales
          ? locales.map(locale =>
              Map({
                value: locale.get('code'),
                label: locale.get('name'),
              }),
            )
          : List(),
      initialValue: get(user, 'preferredLocale') || '',
    },
    {
      name: 'timezone',
      label: 'Timezone',
      type: 'text',
      options: ({ timezones }) =>
        timezones
          ? timezones.map(timezone =>
              Map({
                value: timezone.get('id'),
                label: `${timezone.get('name')} (${timezone.get('id')})`,
              }),
            )
          : List(),
      initialValue: get(user, 'timezone') || '',
    },
    {
      name: 'attributesMap',
      label: 'Attributes',
      type: 'attributes',
      required: false,
      options: ({ attributeDefinitions }) => attributeDefinitions,
      initialValue: get(user, 'attributesMap'),
      placeholder: 'There are no attributes configured',
      helpText:
        'Attributes are only modifiable by space admins and are typically used to store variables that a user can not change (e.g. Manager).',
    },
    {
      name: 'profileAttributesMap',
      label: 'Profile Attributes',
      type: 'attributes',
      required: false,
      options: ({ profileAttributeDefinitions }) => profileAttributeDefinitions,
      initialValue: get(user, 'profileAttributesMap'),
      placeholder: 'There are no profile attributes configured',
      helpText:
        'Profile Attributes are typically used to store variables that the user has access to change (e.g. Phone Number).',
    },
    {
      name: 'memberships',
      label: 'Teams',
      type: 'team-multi',
      required: false,
      placeholder: 'Select a team...',
      options: [],
      initialValue: get(user, 'memberships', List()).map(m => m.get('team')),
      serialize: ({ values }) =>
        values.get('memberships').map(team => Map({ team })),
    },
  ];

export const UserForm = generateForm({
  formOptions: ['username', 'spaceSlug'],
  dataSources,
  fields,
  handleSubmit,
});

UserForm.displayName = 'UserForm';

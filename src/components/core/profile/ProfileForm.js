import { generateForm } from '../../form/Form';
import {
  fetchAttributeDefinitions,
  fetchProfile,
  updateProfile,
  fetchLocales,
  fetchTimezones,
} from '../../../apis';
import { get, List, Map } from 'immutable';
import { handleFormErrors } from '../../form/Form.helpers';

const PROFILE_INCLUDES =
  'details,attributesMap,memberships,profileAttributesMap';

const dataSources = () => ({
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
  profile: {
    fn: fetchProfile,
    params: [{ include: PROFILE_INCLUDES }],
    transform: result => result.profile,
  },
  attributeDefinitions: {
    fn: fetchAttributeDefinitions,
    params: [{ attributeType: 'userAttributeDefinitions' }],
    transform: result => result.attributeDefinitions,
  },
  profileAttributeDefinitions: {
    fn: fetchAttributeDefinitions,
    params: [{ attributeType: 'userProfileAttributeDefinitions' }],
    transform: result => result.attributeDefinitions,
  },
});

const handleSubmit = () => values => {
  const profile = values.toJS();
  return updateProfile({ profile }).then(
    handleFormErrors('user', 'There was an error saving your profile.'),
  );
};

const fields = () => ({ profile }) =>
  profile && [
    {
      name: 'username',
      label: 'Username',
      type: 'text',
      required: true,
      enabled: false,
      initialValue: get(profile, 'username') || '',
    },
    {
      name: 'email',
      label: 'Email',
      type: 'text',
      initialValue: get(profile, 'email') || '',
    },
    {
      name: 'displayName',
      label: 'Display Name',
      type: 'text',
      initialValue: get(profile, 'displayName') || '',
    },
    {
      name: 'enabled',
      label: 'Enabled?',
      type: 'checkbox',
      enabled: ({ profile }) => get(profile, 'spaceAdmin', true),
      initialValue: get(profile, 'enabled', true),
    },
    {
      name: 'spaceAdmin',
      label: 'Space Admin?',
      type: 'checkbox',
      enabled: ({ profile }) => get(profile, 'spaceAdmin', true),
      initialValue: get(profile, 'spaceAdmin', false),
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
      visible: true,
      initialValue: false,
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
      enabled: ({ profile }) => get(profile, 'spaceAdmin', true),
      initialValue: get(profile, 'allowedIps') || '',
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
      initialValue: get(profile, 'preferredLocale') || '',
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
      initialValue: get(profile, 'timezone') || '',
    },
    {
      name: 'attributesMap',
      label: 'Attributes',
      type: 'attributes',
      required: false,
      enabled: ({ profile }) => get(profile, 'spaceAdmin', true),
      options: ({ attributeDefinitions }) => attributeDefinitions,
      initialValue: get(profile, 'attributesMap'),
      placeholder: 'There are no attributes configured',
    },
    {
      name: 'profileAttributesMap',
      label: 'Profile Attributes',
      type: 'attributes',
      required: false,
      options: ({ profileAttributeDefinitions }) => profileAttributeDefinitions,
      initialValue: get(profile, 'profileAttributesMap'),
      placeholder: 'There are no profile attributes configured',
    },
    {
      name: 'memberships',
      label: 'Teams',
      type: 'team-multi',
      required: false,
      placeholder: 'Select a team...',
      options: [],
      enabled: ({ profile }) => get(profile, 'spaceAdmin', true),
      initialValue: get(profile, 'memberships', List()).map(m => m.get('team')),
      serialize: ({ values }) =>
        values.get('memberships').map(team => Map({ team })),
    },
  ];

export const ProfileForm = generateForm({
  formOptions: [],
  dataSources,
  fields,
  handleSubmit,
});

ProfileForm.displayName = 'ProfileForm';

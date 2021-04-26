import { get, getIn } from 'immutable';
import { generateForm } from '../../form/Form';
import {
  createTenant,
  fetchSystemDefaultTaskDbAdapter,
  fetchTenant,
  updateTenant,
} from '../../../apis/system';
import { slugify } from '../../../helpers';
import {
  VALIDATE_DB_ADAPTERS,
  ORACLE_FIELDS,
  MSSQL_FIELDS,
  POSTGRES_FIELDS,
  adapterProperties,
} from '../helpers';
import { handleFormErrors } from '../../form/Form.helpers';

const TENANT_INCLUDES = 'details';

const dataSources = ({ slug }) => ({
  tenant: {
    fn: fetchTenant,
    params: slug && [{ slug, include: TENANT_INCLUDES }],
    transform: result => result.tenant,
  },
  defaultTaskDbAdapter: {
    fn: fetchSystemDefaultTaskDbAdapter,
    params: [],
    transform: result => result.adapter,
  },
});

const handleSubmit = ({ slug }) => values => {
  const tenant = {
    space: {
      slug: values.get('slug'),
      name: values.get('name'),
    },
    task: {
      autoCreateDatabase: values.get('task_autoCreateDatabase')
        ? 'true'
        : 'false',
      ...(slug
        ? {
            deployment: {
              image: values.get('image'),
              replicas: parseInt(values.get('replicas')),
            },
          }
        : {}),
      databaseAdapter: {
        type: values.get('task_databaseAdapter_type'),
        properties: adapterProperties(
          values,
          values.get('task_databaseAdapter_type'),
        ),
      },
    },
    users: values.get('users'),
  };
  return slug
    ? updateTenant({ slug, tenant }).then(
        handleFormErrors('space', 'There was an error saving the Space.'),
      )
    : createTenant({ tenant }).then(
        handleFormErrors(null, 'There was an error saving the Space.'),
      );
};

const getSpaceValue = (tenant, key) =>
  tenant ? getIn(tenant, ['space', key], '') : '';

const fields = ({ slug }) => ({ tenant, defaultTaskDbAdapter }) =>
  (tenant || !slug) &&
  (defaultTaskDbAdapter || defaultTaskDbAdapter === null) && [
    // Top-level fields
    {
      name: 'authenticationSecret',
      label: 'Authentication Secret',
      type: 'password',
      visible: ({ values }) => values.get('changeAuthenticationSecret'),
      transient: ({ values }) => !values.get('changeAuthenticationSecret'),
      required: false,
    },
    {
      name: 'changeAuthenticationSecret',
      label: 'Change Authentication Secret',
      type: 'checkbox',
      transient: true,
      initialValue: false,
      onChange: ({ values }, { setValue }) => {
        if (values.get('authenticationSecret') !== '') {
          setValue('authenticationSecret', '');
        }
      },
    },

    // Start - Space Fields
    {
      name: 'name',
      label: 'Name',
      type: 'text',
      required: true,
      onChange: ({ values }, { setValue }) => {
        if (values.get('linked')) {
          setValue('slug', slugify(values.get('name')), false);
        }
      },
      initialValue: getSpaceValue(tenant, 'name'),
    },
    {
      name: 'slug',
      label: 'Slug',
      type: 'text',
      required: true,
      enabled: !slug,
      onChange: (_bindings, { setValue }) => {
        setValue('linked', false);
      },
      initialValue: getSpaceValue(tenant, 'slug'),
    },
    {
      name: 'linked',
      label: 'Linked',
      type: 'checkbox',
      transient: true,
      initialValue: !tenant,
      visible: false,
    },
    // End - Space Fields

    // Start - Task fields
    {
      name: 'replicas',
      label: 'Task Replica Count',
      type: 'text',
      required: !!slug,
      initialValue: getIn(tenant, ['task', 'deployment', 'replicas'], 1),
      // pattern: /^\d+$/,
      // patternMessage:
      //   'You must provide a number of replicas desired.',
    },
    {
      name: 'image',
      label: 'Task Image',
      type: 'text',
      required: !!slug,
      initialValue: getIn(tenant, ['task', 'deployment', 'image']),
    },
    {
      name: 'task_databaseAdapter_type',
      label: 'Task Adapter',
      required: true,
      type: 'select',
      options: VALIDATE_DB_ADAPTERS,
      initialValue: getIn(
        tenant,
        ['task', 'databaseAdapter', 'type'],
        get(defaultTaskDbAdapter, 'type', ''),
      ),
    },
    {
      name: 'task_autoCreateDatabase',
      label: 'Auto-Create Database',
      type: 'checkbox',
      visible: ({ values }) =>
        values.get('task_databaseAdapter_type') === 'postgres',
      transient: ({ values }) =>
        values.get('task_databaseAdapter_type') !== 'postgres',
      initialValue: slug
        ? get(tenant, ['task', 'autoCreateDatabase'], true)
        : true,
    },
    // End - Task fields

    // Start - Task Adapters
    ...MSSQL_FIELDS(
      'task_databaseAdapter_type',
      tenant,
      ['task', 'databaseAdapter'],
      defaultTaskDbAdapter,
    ),
    ...ORACLE_FIELDS(
      'task_databaseAdapter_type',
      tenant,
      ['task', 'databaseAdapter'],
      defaultTaskDbAdapter,
    ),
    ...POSTGRES_FIELDS(
      'task_databaseAdapter_type',
      tenant,
      ['task', 'databaseAdapter'],
      defaultTaskDbAdapter,
    ),
    // Start - Users fields. Create-only.
    ...(slug
      ? []
      : [
          {
            name: 'username',
            label: 'Username',
            type: 'text',
            transient: true,
            required: true,
            enabled: true,
            visible: true,
            initialValue: '',
          },
          {
            name: 'email',
            label: 'Email',
            type: 'text',
            transient: true,
            required: true,
            enabled: true,
            visible: true,
            initialValue: '',
          },
          {
            name: 'displayName',
            label: 'Display Name',
            type: 'text',
            transient: true,
            required: true,
            enabled: true,
            visible: true,
            initialValue: '',
          },
          {
            name: 'password',
            label: 'Password',
            type: 'password',
            transient: true,
            required: true,
            enabled: true,
            visible: true,
          },
          {
            name: 'passwordConfirmation',
            label: 'Password Confirmation',
            type: 'password',
            transient: true,
            required: true,
            enabled: true,
            visible: true,
            constraint: ({ values }) =>
              values.get('passwordConfirmation') === values.get('password'),
            constraintMessage: 'Password Confirmation does not match',
          },
          {
            name: 'users',
            label: 'Admin User',
            type: null,
            visible: false,
            required: false,
            serialize: ({ values }) => {
              return [
                {
                  username: values.get('username'),
                  password: values.get('password'),
                  email: values.get('email'),
                  displayName: values.get('displayName'),
                },
              ];
            },
          },
        ]),
    // End - Users fields. Create-only.
  ];

export const SystemTenantForm = generateForm({
  formOptions: ['slug'],
  dataSources,
  fields,
  handleSubmit,
});

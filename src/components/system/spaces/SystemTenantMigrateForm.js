import { get, getIn } from 'immutable';
import { generateForm } from '../../form/Form';
import {
  fetchSpace,
  fetchSystemDefaultSQLDbAdapter,
  fetchTenant,
  migrateTenant,
} from '../../../apis';
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
  space: {
    fn: fetchSpace,
    params: slug && [{ slug, include: 'details,allowedIps' }],
    transform: result => result.space,
  },
  tenant: {
    fn: fetchTenant,
    params: slug && [{ slug, include: TENANT_INCLUDES }],
    transform: result => result.tenant,
  },
  defaultSQLDatabaseAdapter: {
    fn: fetchSystemDefaultSQLDbAdapter,
    params: [],
    transform: result => result.adapter,
  },
  fileFields: {
    fn: () => ({
      mssql: ['sslrootcert', 'sslcert'],
      oracle: ['serverCert', 'clientCert'],
      postgres: ['sslrootcert', 'sslcert', 'sslkey'],
    }),
    params: [],
  },
});

const handleSubmit = ({ slug, component }) => (
  values,
  { fileFields, values: rawValues, tenant: originalTenant },
) => {
  const taskEnabled = !!values.get('task_feature');
  const integratorEnabled = !!values.get('integrator_feature');
  let task = {},
    integrator = {};

  if (taskEnabled && (!component || component === 'task')) {
    const type = values.get('task_databaseAdapter_type');
    const fileFieldsForType = fileFields.get(type);
    // Only include values for file fields if the toggle field is true
    const filterFn = (value, key) =>
      !fileFieldsForType.includes(key) ||
      !!rawValues.get(`task_${type}_change_${key}`);
    // Get adapter properties to save
    let properties = adapterProperties(values, 'task', type, filterFn);
    // If creating new, pass in file values from default adapter if not uploaded
    if (!slug || originalTenant.getIn(['features', 'task']) === 'false') {
      properties = fileFieldsForType.reduce((props, field) => {
        if (
          typeof props[field] === 'undefined' &&
          !!rawValues.getIn([`task_${type}_current_${field}`, 'pem'])
        ) {
          return {
            ...props,
            // Set existing value as a File in case one of the other file fields
            // had a file uploaded so that all the file fields have the same type
            // of data
            [field]: new File(
              [rawValues.getIn([`task_${type}_current_${field}`, 'pem'])],
              `${field}.crt`,
              {
                type: 'text/plain',
              },
            ),
          };
        }
        return props;
      }, properties);
    }

    const authenticationSecret = values.get('task_authenticationSecret')
      ? { authenticationSecret: values.get('task_authenticationSecret') }
      : {};

    task = {
      task: {
        ...authenticationSecret,
        deployment: {
          image: values.get('task_image'),
          replicas: parseInt(values.get('task_replicas')),
        },
        configuratorUser: {
          username: values.get('configuratorUsername'),
          password: values.get('configuratorPassword'),
        },
        databaseAdapter: { type, properties },
        autoCreateDatabase: (!!values.get(
          'task_autoCreateDatabase',
        )).toString(),
      },
    };
  }

  if (integratorEnabled && (!component || component === 'integrator')) {
    const type = values.get('integrator_databaseAdapter_type');
    const fileFieldsForType = fileFields.get(type);
    // Only include values for file fields if the toggle field is true
    const filterFn = (value, key) =>
      !fileFieldsForType.includes(key) ||
      !!rawValues.get(`integrator_${type}_change_${key}`);
    // Get adapter properties to save
    let properties = adapterProperties(values, 'integrator', type, filterFn);
    // If creating new, pass in file values from default adapter if not uploaded
    if (!slug || originalTenant.getIn(['features', 'integrator']) === 'false') {
      properties = fileFieldsForType.reduce((props, field) => {
        if (
          typeof props[field] === 'undefined' &&
          !!rawValues.getIn([`integrator_${type}_current_${field}`, 'pem'])
        ) {
          return {
            ...props,
            // Set existing value as a File in case one of the other file fields
            // had a file uploaded so that all the file fields have the same type
            // of data
            [field]: new File(
              [rawValues.getIn([`integrator_${type}_current_${field}`, 'pem'])],
              `${field}.crt`,
              {
                type: 'text/plain',
              },
            ),
          };
        }
        return props;
      }, properties);
    }

    integrator = {
      integrator: {
        deployment: {
          image: values.get('integrator_image'),
          replicas: parseInt(values.get('integrator_replicas')),
        },
        secretKeyBase: values.get('secretKeyBase'),
        vaultKey: values.get('vaultKey'),
        databaseAdapter: { type, properties },
        autoCreateDatabase: (!!values.get(
          'integrator_autoCreateDatabase',
        )).toString(),
      },
    };
  }

  const tenant = {
    space: {
      slug: values.get('slug'),
      name: values.get('name'),
    },
    features: {
      task: taskEnabled.toString(),
      integrator: integratorEnabled.toString(),
    },
    integrationUser: {
      username: values.get('integrationUsername'),
      password: values.get('integrationPassword'),
    },
    encryptionKey: values.get('encryptionKey'),
    coreServiceName: values.get('coreServiceName'),
    oasConsoleServiceName: 'oas-console',
    spaceConsoleServiceName: 'space-console',
    loghubServiceName: 'loghub',
    ...task,
    ...integrator,
    users: values.get('users'),
  };

  const multipart =
    (taskEnabled &&
      (!component || component === 'task') &&
      Object.entries(tenant.task.databaseAdapter.properties).some(
        ([name, value]) => value instanceof File,
      )) ||
    (integratorEnabled &&
      (!component || component === 'integrator') &&
      Object.entries(tenant.integrator.databaseAdapter.properties).some(
        ([name, value]) => value instanceof File,
      ));

  return migrateTenant({ slug, tenant, multipart }).then(
    handleFormErrors('space', 'There was an error migrating the Space.'),
  );
};

const getSpaceValue = (tenant, key) =>
  tenant ? getIn(tenant, ['space', key], '') : '';

const fields = ({ slug, component }) => ({
  tenant,
  defaultSQLDatabaseAdapter,
}) =>
  (tenant || !slug) &&
  (defaultSQLDatabaseAdapter || defaultSQLDatabaseAdapter === null) && [
    // Start - Migrate Space Fields
    {
      name: 'name',
      label: 'Name',
      type: 'text',
      required: true,
      enabled: false,
      initialValue: getSpaceValue(tenant, 'name'),
    },
    {
      name: 'slug',
      label: 'Slug',
      type: 'text',
      required: true,
      enabled: false,
      initialValue: getSpaceValue(tenant, 'slug'),
    },
    {
      name: 'integrationUsername',
      label: 'Integration Username',
      type: 'text',
      required: true,
      enabled: true,
    },
    {
      name: 'integrationPassword',
      label: 'Integration Password',
      type: 'password',
      required: true,
    },
    {
      name: 'configuratorUsername',
      label: 'Configurator Username',
      type: 'text',
      required: true,
      enabled: true,
    },
    {
      name: 'configuratorPassword',
      label: 'Configurator Password',
      type: 'password',
      required: true,
    },
    {
      name: 'encryptionKey',
      label: 'Encryption Key',
      type: 'password',
      required: true,
    },
    {
      name: 'vaultKey',
      label: 'Vault Key',
      type: 'password',
      required: true,
    },
    {
      name: 'coreServiceName',
      label: 'Core Version',
      type: 'text',
      required: true,
    },
    {
      name: 'secretKeyBase',
      label: 'Secret Key',
      type: 'password',
      required: true,
    },
    // End - Migrate Space Fields

    // Start - Feature Flags
    {
      name: 'task_feature',
      label: 'Task Component',
      type: 'checkbox',
      initialValue: getIn(tenant, ['features', 'task']) === 'true' || !slug,
      onChange: ({ values }, { setValue }) => {
        // When you toggle the feature, set or clear the adapter type value so
        // that the downstream adapter fields can be automatically hidden
        if (!!values.get('task_feature')) {
          setValue(
            'task_databaseAdapter_type',
            getIn(
              tenant,
              ['task', 'databaseAdapter', 'type'],
              get(defaultSQLDatabaseAdapter, 'type', ''),
            ),
          );
        } else {
          setValue('task_databaseAdapter_type', '');
        }
      },
    },
    {
      name: 'integrator_feature',
      label: 'Integrator Component',
      type: 'checkbox',
      initialValue:
        getIn(tenant, ['features', 'integrator']) === 'true' || !slug,
      onChange: ({ values }, { setValue }) => {
        // When you toggle the feature, set or clear the adapter type value so
        // that the downstream adapter fields can be automatically hidden
        if (!!values.get('task_feature')) {
          setValue(
            'integrator_databaseAdapter_type',
            getIn(
              tenant,
              ['integrator', 'databaseAdapter', 'type'],
              get(defaultSQLDatabaseAdapter, 'type', ''),
            ),
          );
        } else {
          setValue('task_databaseAdapter_type', '');
        }
      },
    },
    // End - Feature Flags

    // Add Task fields when component form prop isn't specified or is task
    ...(!component || component === 'task'
      ? [
          // Start - Task fields
          {
            name: 'task_replicas',
            label: 'Replica Count',
            type: 'number',
            initialValue: getIn(
              tenant,
              ['task', 'deployment', 'specReplicas'],
              1,
            ),
            constraint: ({ values }) =>
              !values.get('task_feature') ||
              (typeof values.get('task_replicas') === 'number' &&
                values.get('task_replicas') >= 0),
            constraintMessage:
              'Replica count must be a positive integer or zero.',
          },
          {
            name: 'task_image',
            label: 'Task Image',
            type: 'text',
            initialValue: getIn(tenant, ['task', 'deployment', 'image']),
          },

          {
            name: 'task_image',
            label: 'Task Image',
            type: 'text',
            visible: ({ values }) => !values.get('task_imageToggle'),
            initialValue: getIn(tenant, ['task', 'deployment', 'image']),
            helpText:
              'Optionally set the version of Kinetic Task to use for this space. Leave blank to use the default version.',
          },
          {
            name: 'task_imageToggle',
            label: 'Use Default Task Image',
            type: 'checkbox',
            transient: true,
            visible: !slug || getIn(tenant, ['features', 'task']) === 'false',
            initialValue: !getIn(tenant, ['task', 'deployment', 'image']),
            onChange: ({ values }, { setValue }) => {
              if (!!values.get('task_imageToggle')) {
                setValue('task_image', '');
              }
            },
          },
          {
            name: 'task_databaseAdapter_type',
            label: 'Database Adapter',
            required: ({ values }) => values.get('task_feature'),
            type: 'select',
            options: VALIDATE_DB_ADAPTERS,
            initialValue: getIn(
              tenant,
              ['task', 'databaseAdapter', 'type'],
              get(defaultSQLDatabaseAdapter, 'type', ''),
            ),
          },
          {
            name: 'task_autoCreateDatabase',
            label: 'Auto-Create Database',
            type: 'checkbox',
            visible: ({ values }) =>
              getIn(tenant, ['task', 'databaseAdapter', 'type']) !==
                'postgres' &&
              values.get('task_databaseAdapter_type') === 'postgres',
            transient: ({ values }) =>
              values.get('task_databaseAdapter_type') !== 'postgres',
            initialValue:
              !slug || getIn(tenant, ['features', 'task']) === 'false',
          },
          {
            name: 'task_authenticationSecret',
            label: 'Authentication Secret',
            type: 'password',
            visible: ({ values }) =>
              values.get('task_changeAuthenticationSecret'),
            transient: ({ values }) =>
              !values.get('task_changeAuthenticationSecret'),
            required: false,
          },
          {
            name: 'task_changeAuthenticationSecret',
            label: 'Change Authentication Secret',
            type: 'checkbox',
            transient: true,
            initialValue: false,
            onChange: ({ values }, { setValue }) => {
              if (values.get('task_authenticationSecret') !== '') {
                setValue('task_authenticationSecret', '');
              }
            },
          },
          // End - Task fields

          // Start - Task Adapters
          ...MSSQL_FIELDS(
            'task_databaseAdapter_type',
            tenant,
            ['task', 'databaseAdapter'],
            defaultSQLDatabaseAdapter,
          ),
          ...ORACLE_FIELDS(
            'task_databaseAdapter_type',
            tenant,
            ['task', 'databaseAdapter'],
            defaultSQLDatabaseAdapter,
          ),
          ...POSTGRES_FIELDS(
            'task_databaseAdapter_type',
            tenant,
            ['task', 'databaseAdapter'],
            defaultSQLDatabaseAdapter,
          ),
          // End - Task Adapters
        ]
      : []),

    // Add Task fields when component form prop isn't specified or is integrator
    ...(!component || component === 'integrator'
      ? [
          // Start - Integrator fields
          {
            name: 'integrator_replicas',
            label: 'Replica Count',
            type: 'number',
            initialValue: getIn(
              tenant,
              ['integrator', 'deployment', 'specReplicas'],
              1,
            ),
            constraint: ({ values }) =>
              !values.get('integrator_feature') ||
              (typeof values.get('integrator_replicas') === 'number' &&
                values.get('integrator_replicas') >= 0),
            constraintMessage:
              'Replica count must be a positive integer or zero.',
          },
          {
            name: 'integrator_image',
            label: 'Integrator Image',
            type: 'text',
            visible: ({ values }) => !values.get('integrator_imageToggle'),
            initialValue: getIn(tenant, ['integrator', 'deployment', 'image']),
            helpText:
              'Optionally set the version of Kinetic Integrator to use for this space. Leave blank to use the default version.',
          },
          {
            name: 'integrator_imageToggle',
            label: 'Use Default Integrator Image',
            type: 'checkbox',
            transient: true,
            visible:
              !slug || getIn(tenant, ['features', 'integrator']) === 'false',
            initialValue: !getIn(tenant, ['integrator', 'deployment', 'image']),
            onChange: ({ values }, { setValue }) => {
              if (!!values.get('integrator_imageToggle')) {
                setValue('integrator_image', '');
              }
            },
          },
          {
            name: 'integrator_databaseAdapter_type',
            label: 'Database Adapter',
            required: ({ values }) => values.get('integrator_feature'),
            type: 'select',
            options: VALIDATE_DB_ADAPTERS.filter(
              adapter => adapter.value === 'postgres',
            ),
            initialValue: getIn(
              tenant,
              ['integrator', 'databaseAdapter', 'type'],
              get(defaultSQLDatabaseAdapter, 'type', ''),
            ),
          },
          {
            name: 'integrator_autoCreateDatabase',
            label: 'Auto-Create Database',
            type: 'checkbox',
            visible: ({ values }) =>
              getIn(tenant, ['integrator', 'databaseAdapter', 'type']) !==
                'postgres' &&
              values.get('integrator_databaseAdapter_type') === 'postgres',
            transient: ({ values }) =>
              values.get('integrator_databaseAdapter_type') !== 'postgres',
            initialValue:
              !slug || getIn(tenant, ['features', 'integrator']) === 'false',
          },
          // End - Integrator fields

          // Start - Integrator Adapters
          ...POSTGRES_FIELDS(
            'integrator_databaseAdapter_type',
            tenant,
            ['integrator', 'databaseAdapter'],
            defaultSQLDatabaseAdapter,
          ),
          // End - Integrator Adapters
        ]
      : []),
  ];

export const SystemTenantMigrateForm = generateForm({
  formOptions: ['slug', 'component'],
  dataSources,
  fields,
  handleSubmit,
});

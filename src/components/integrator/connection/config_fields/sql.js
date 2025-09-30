import { get, Map } from 'immutable';
import integrationTypes from '../../integrationTypes';

export const serializeSQLConnectionConfigFields =
  configFields =>
  ({ values }) => {
    return configFields.reduce(
      (serialization, { name, type, visible, transient }) => {
        if (
          // Field must not be transient
          !transient &&
          // Field must be visible
          (typeof visible === 'function'
            ? visible({ values })
            : typeof visible === 'undefined' || !!visible)
        ) {
          // Set password fields to null if their toggle field is
          // false, which means the password wasn't changed
          if (type === 'password' && !values.get(`${name}.toggle`)) {
            return serialization.setIn(name.split('.'), null);
          }

          // Set the following fields to null if they don't have a value
          if (['caCert'].includes(name) && !values.get(name)) {
            return serialization.setIn(name.split('.'), null);
          }

          // Set the value into the correct structure
          return serialization.setIn(name.split('.'), values.get(name));
        }
        return serialization;
      },
      Map(),
    );
  };

export const generateSQLConnectionConfigFields = (config, type, options) => [
  {
    name: 'configType',
    label: 'Type',
    type: 'select',
    options: integrationTypes,
    initialValue: type,
    required: true,
    enabled: false,
  },
  {
    name: 'host',
    label: 'Host',
    type: 'text',
    initialValue: get(config, 'host'),
    required: true,
  },
  {
    name: 'port',
    label: 'Port',
    type: 'text',
    initialValue: String(get(config, 'port') || ''),
    required: true,
    pattern: /^\d*$/,
    patternMessage: 'Port must be numeric',
  },
  {
    name: 'database',
    label: 'Database',
    type: 'text',
    initialValue: get(config, 'database'),
    required: true,
  },
  {
    name: 'poolSize',
    label: 'Connection Pool',
    type: 'number',
    initialValue: get(config, 'poolSize') || 5,
    required: true,
    constraint: ({ values }) =>
      typeof values.get('poolSize') === 'number' && values.get('poolSize') > 0,
    constraintMessage:
      'Connection Pool must be numeric and must be greater than 0',
  },
  {
    name: 'username',
    label: 'Username',
    type: 'text',
    initialValue: get(config, 'username'),
    required: true,
  },
  {
    name: 'password.toggle',
    transient: true,
    label: 'Modify Password',
    type: 'toggle',
    initialValue: !config || !!options.isClone || !!options.isNewImport,
    // Show if we're editing a connection
    visible: ({ connection }) => !!connection && !options.isClone,
  },
  {
    name: 'password',
    label: 'Password',
    type: 'password',
    initialValue: '',
    // Enable if we're creating a new connection or the change toggle is true
    enabled: ({ values, connection }) =>
      !connection || options.isClone || !!values.get('password.toggle'),
    // Show the placeholder if there is a connection
    placeholder: ({ values, connection }) =>
      !!connection && !options.isClone && !values.get('password.toggle')
        ? '\u2022\u2022\u2022\u2022\u2022\u2022\u2022'
        : undefined,
  },
  {
    name: 'caCert',
    label: 'Trusted CA Certificate',
    type: 'text',
    initialValue: get(config, 'caCert') || '',
  },
];

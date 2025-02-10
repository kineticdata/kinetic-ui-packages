import { get, Map } from 'immutable';
import integrationTypes from '../../integrationTypes';

export const serializePostgresConnectionConfigFields = configFields => ({
  values,
}) => {
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

export const generatePostgresConnectionConfigFields = config => [
  {
    name: 'configType',
    label: 'Type',
    type: 'select',
    options: integrationTypes,
    initialValue: 'postgres',
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
    initialValue: !config,
    // Show if we're editing a connection
    visible: ({ connection }) => !!connection,
  },
  {
    name: 'password',
    label: 'Password',
    type: 'password',
    initialValue: '',
    // Enable if we're creating a new connection or the change toggle is true
    enabled: ({ values, connection }) =>
      !connection || !!values.get('password.toggle'),
    // Show the placeholder if there is a connection
    placeholder: ({ values, connection }) =>
      !!connection && !values.get('password.toggle')
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

import { get, getIn, hasIn, List, Map } from 'immutable';

export const serializeHttpConnectionConfigFields = configFields => ({
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

        // If auth type is not selected, set the auth property to null
        if (name === 'auth.type' && !values.get(name)) {
          return serialization.setIn(['auth'], null);
        }

        // Set the following fields to null if they don't have a value
        if (
          [
            'caCert',
            'auth.caCert',
            'auth.scope',
            'auth.token.connection.caCert',
            'auth.transform',
          ].includes(name) &&
          !values.get(name)
        ) {
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

export const generateHttpConnectionConfigFields = config => [
  {
    name: 'baseUrl',
    label: 'Base URL',
    type: 'text',
    initialValue: get(config, 'baseUrl'),
    required: true,
    placeholder: 'https://www.kineticdata.com',
  },
  {
    name: 'caCert',
    label: 'Trusted CA Certificate',
    type: 'text',
    initialValue: get(config, 'caCert') || '',
  },
  ...generateHttpConnectionConfigAuthFields(get(config, 'auth'), !config),
];

const generateHttpConnectionConfigAuthFields = auth => [
  {
    name: 'auth.type',
    label: 'Authentication',
    type: 'select',
    options: [
      { value: 'basic', label: 'Basic Auth' },
      { value: 'bearer_token', label: 'Bearer Token' },
      { value: 'client_credentials', label: 'OAuth 2.0' },
    ],
    initialValue: get(auth, 'type'),
    placeholder: 'None',
  },

  // basic
  {
    name: 'auth.username',
    label: 'Username',
    type: 'text',
    initialValue: get(auth, 'username'),
    required: ({ values }) => values.get('auth.type') === 'basic',
    visible: ({ values }) => values.get('auth.type') === 'basic',
  },
  {
    name: 'auth.password.toggle',
    transient: true,
    label: 'Modify Password',
    type: 'toggle',
    // Set to true if there is no auth config or if the current auth config is
    // set to a different type
    initialValue: !auth || get(auth, 'type') !== 'basic',
    // Show if we're editing a connection and the selected auth type matches
    // the currently saved auth type
    visible: ({ values, connection }) =>
      !!connection &&
      values.get('auth.type') === 'basic' &&
      connection.getIn(['config', 'auth', 'type']) === 'basic',
    onChange: (...args) => {
      console.log('toggle', args);
    },
  },
  {
    name: 'auth.password',
    label: 'Password',
    type: 'password',
    initialValue: '',
    visible: ({ values }) => values.get('auth.type') === 'basic',
    // Enable if we're creating a new connection or the change toggle is true
    enabled: ({ values, connection }) =>
      !connection || !!values.get('auth.password.toggle'),
    // Show the placeholder if there is a connection and it matches the saved type
    placeholder: ({ values, connection }) =>
      !!connection &&
      connection.getIn(['config', 'auth', 'type']) === 'basic' &&
      !values.get('auth.password.toggle')
        ? '\u2022\u2022\u2022\u2022\u2022\u2022\u2022'
        : undefined,
  },

  // client_credentials
  {
    name: 'auth.tokenUrl',
    label: 'Access Token URL',
    type: 'text',
    initialValue: get(auth, 'tokenUrl'),
    required: ({ values }) => values.get('auth.type') === 'client_credentials',
    visible: ({ values }) => values.get('auth.type') === 'client_credentials',
  },
  {
    name: 'auth.clientId',
    label: 'Client ID',
    type: 'text',
    initialValue: get(auth, 'clientId'),
    required: ({ values }) => values.get('auth.type') === 'client_credentials',
    visible: ({ values }) => values.get('auth.type') === 'client_credentials',
  },
  {
    name: 'auth.clientSecret.toggle',
    transient: true,
    label: 'Modify Client Secret',
    type: 'toggle',
    // Set to true if there is no auth config or if the current auth config is
    // set to a different type
    initialValue: !auth || get(auth, 'type') !== 'client_credentials',
    // Show if we're editing a connection and the selected auth type matches
    // the currently saved auth type
    visible: ({ values, connection }) =>
      !!connection &&
      values.get('auth.type') === 'client_credentials' &&
      connection.getIn(['config', 'auth', 'type']) === 'client_credentials',
  },
  {
    name: 'auth.clientSecret',
    label: 'Client Secret',
    type: 'password',
    visible: ({ values }) => values.get('auth.type') === 'client_credentials',
    // Enable if we're creating a new connection or the change toggle is true
    enabled: ({ values, connection }) =>
      !connection || !!values.get('auth.clientSecret.toggle'),
    // Show the placeholder if there is a connection and it matches the saved type
    placeholder: ({ values, connection }) =>
      !!connection &&
      connection.getIn(['config', 'auth', 'type']) === 'client_credentials' &&
      !values.get('auth.clientSecret.toggle')
        ? '\u2022\u2022\u2022\u2022\u2022\u2022\u2022'
        : undefined,
  },
  {
    name: 'auth.scope',
    label: 'Scope',
    type: 'text',
    initialValue: get(auth, 'scope'),
    visible: ({ values }) => values.get('auth.type') === 'client_credentials',
  },
  {
    name: 'auth.clientAuth',
    label: 'Client Auth',
    type: 'select',
    options: [
      { label: 'Basic Auth', value: 'basic_auth' },
      { label: 'Form URL Encoded', value: 'www_form_urlencoded' },
    ],
    initialValue: get(auth, 'clientAuth', 'www_form_urlencoded'),
    required: ({ values }) => values.get('auth.type') === 'client_credentials',
    visible: ({ values }) => values.get('auth.type') === 'client_credentials',
  },
  {
    name: 'auth.caCert',
    label: 'Trusted CA Certificate',
    type: 'text',
    initialValue: get(auth, 'caCert') || '',
    visible: ({ values }) => values.get('auth.type') === 'client_credentials',
  },

  // bearer_token
  {
    name: 'auth.header',
    label: 'Token Header',
    type: 'text',
    initialValue: get(auth, 'header', 'Authorization'),
    visible: ({ values }) => values.get('auth.type') === 'bearer_token',
    required: ({ values }) => values.get('auth.type') === 'bearer_token',
  },
  {
    name: 'auth.prefix',
    label: 'Token Prefix',
    type: 'text',
    initialValue: get(auth, 'prefix', 'Bearer'),
    visible: ({ values }) => values.get('auth.type') === 'bearer_token',
    required: ({ values }) => values.get('auth.type') === 'bearer_token',
  },
  {
    name: 'auth.tokenType',
    transient: true,
    label: 'Token Type',
    type: 'select',
    options: [{ value: 'raw', label: 'Raw' }, { value: 'http', label: 'HTTP' }],
    initialValue:
      !get(auth, 'token') || typeof get(auth, 'token') === 'string'
        ? 'raw'
        : typeof getIn(auth, ['token', 'op']) === 'object'
          ? 'http'
          : '',
    visible: ({ values }) => values.get('auth.type') === 'bearer_token',
    required: ({ values }) => values.get('auth.type') === 'bearer_token',
  },
  {
    name: 'auth.token',
    label: 'Token',
    type: 'text',
    initialValue:
      typeof get(auth, 'token') === 'string' ? get(auth, 'token') : '',
    visible: ({ values }) =>
      values.get('auth.type') === 'bearer_token' &&
      values.get('auth.tokenType') === 'raw',
    required: ({ values }) =>
      values.get('auth.type') === 'bearer_token' &&
      values.get('auth.tokenType') === 'raw',
  },
  ...generateHttpConnectionConfigAuthTokenOperationFields(
    getIn(auth, ['token', 'op']),
  ),
  {
    name: 'auth.tokenHttpConn',
    transient: true,
    label: 'Use different connection for auth',
    type: 'checkbox',
    initialValue: getIn(auth, ['token', 'conn']) === 'object',
    visible: ({ values }) =>
      values.get('auth.type') === 'bearer_token' &&
      values.get('auth.tokenType') === 'http',
  },
  ...generateHttpConnectionConfigAuthTokenConnectionFields(
    getIn(auth, ['token', 'conn']),
  ),
  {
    name: 'auth.transform',
    label: 'Transform',
    type: 'code',
    initialValue: get(auth, 'transform') || '',
    visible: ({ values }) => values.get('auth.type') === 'bearer_token',
  },
];

const generateHttpConnectionConfigAuthTokenOperationFields = operation => [
  {
    name: 'auth.token.operation.method',
    label: 'Method',
    type: 'select',
    options: [
      { label: 'GET', value: 'GET' },
      { label: 'POST', value: 'POST' },
      { label: 'PUT', value: 'PUT' },
      { label: 'DELETE', value: 'DELETE' },
    ],
    initialValue: get(operation, 'method'),
    visible: ({ values }) =>
      values.get('auth.type') === 'bearer_token' &&
      values.get('auth.tokenType') === 'http',
    required: ({ values }) =>
      values.get('auth.type') === 'bearer_token' &&
      values.get('auth.tokenType') === 'http',
  },
  {
    name: 'auth.token.operation.path',
    label: 'Request Path',
    type: 'text',
    initialValue: get(operation, 'path'),
    visible: ({ values }) =>
      values.get('auth.type') === 'bearer_token' &&
      values.get('auth.tokenType') === 'http',
    required: ({ values }) =>
      values.get('auth.type') === 'bearer_token' &&
      values.get('auth.tokenType') === 'http',
  },
  {
    name: 'auth.token.operation.params',
    label: 'URL Parameters',
    type: 'map',
    initialValue: get(operation, 'params'),
    visible: ({ values }) =>
      values.get('auth.type') === 'bearer_token' &&
      values.get('auth.tokenType') === 'http',
    placeholder: 'Add Parameter',
  },
  {
    name: 'auth.token.operation.headers',
    label: 'Headers',
    type: 'map',
    initialValue: get(operation, 'headers'),
    visible: ({ values }) =>
      values.get('auth.type') === 'bearer_token' &&
      values.get('auth.tokenType') === 'http',
    placeholder: 'Add Header',
  },
  {
    name: 'auth.token.operation.followRedirect',
    label: 'Follow Redirect',
    type: 'checkbox',
    initialValue: get(operation, 'followRedirect'),
    visible: ({ values }) =>
      values.get('auth.type') === 'bearer_token' &&
      values.get('auth.tokenType') === 'http',
  },
  {
    name: 'auth.token.operation.streamResponse',
    label: 'Stream Response',
    type: 'checkbox',
    initialValue: get(operation, 'streamResponse'),
    visible: ({ values }) =>
      values.get('auth.type') === 'bearer_token' &&
      values.get('auth.tokenType') === 'http',
  },
  {
    name: 'auth.token.operation.bodyType',
    transient: true,
    label: 'Body Type',
    type: 'radio',
    options: [
      { label: 'Form URL Encoded', value: 'form' },
      { label: 'Raw', value: 'raw' },
      { label: 'Multipart', value: 'multipart' },
    ],
    initialValue: hasIn(operation, ['body', 'raw'])
      ? 'raw'
      : hasIn(operation, ['body', 'parts'])
        ? 'multipart'
        : 'form',
    visible: ({ values }) =>
      values.get('auth.type') === 'bearer_token' &&
      values.get('auth.tokenType') === 'http',
  },
  {
    name: 'auth.token.operation.body.form',
    label: 'Form Body',
    type: 'map',
    initialValue: getIn(operation, ['body', 'form']),
    visible: ({ values }) =>
      values.get('auth.type') === 'bearer_token' &&
      values.get('auth.tokenType') === 'http' &&
      values.get('auth.token.operation.bodyType') === 'form',
  },
  {
    name: 'auth.token.operation.body.raw',
    label: 'Raw Body',
    type: 'text',
    initialValue: getIn(operation, ['body', 'raw']),
    visible: ({ values }) =>
      values.get('auth.type') === 'bearer_token' &&
      values.get('auth.tokenType') === 'http' &&
      values.get('auth.token.operation.bodyType') === 'raw',
  },
  {
    name: 'auth.token.operation.body.parts',
    label: 'Multipart Body',
    type: 'table',
    options: [
      { name: 'name', label: 'Name', type: 'text' },
      { name: 'contentType', label: 'Content Type', type: 'text' },
      { name: 'content', label: 'Content', type: 'text' },
      { name: 'fileName', label: 'File Name', type: 'text' },
    ],
    initialValue: getIn(operation, ['body', 'parts'], List()),
    visible: ({ values }) =>
      values.get('auth.type') === 'bearer_token' &&
      values.get('auth.tokenType') === 'http' &&
      values.get('auth.token.operation.bodyType') === 'multipart',
  },
];

const generateHttpConnectionConfigAuthTokenConnectionFields = connection => [
  {
    name: 'auth.token.connection.baseUrl',
    label: 'Token Base URL',
    type: 'text',
    initialValue: get(connection, 'baseUrl'),
    visible: ({ values }) =>
      values.get('auth.type') === 'bearer_token' &&
      values.get('auth.tokenType') === 'http' &&
      !!values.get('auth.tokenHttpConn'),
    required: ({ values }) =>
      values.get('auth.type') === 'bearer_token' &&
      values.get('auth.tokenType') === 'http' &&
      !!values.get('auth.tokenHttpConn'),
  },
  {
    name: 'auth.token.connection.caCert',
    label: 'Token Trusted CA Certificate',
    type: 'text',
    initialValue: get(connection, 'caCert') || '',
    visible: ({ values }) =>
      values.get('auth.type') === 'bearer_token' &&
      values.get('auth.tokenType') === 'http' &&
      !!values.get('auth.tokenHttpConn'),
  },
];

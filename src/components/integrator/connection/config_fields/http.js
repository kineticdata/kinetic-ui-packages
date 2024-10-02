import { get, getIn, List, Map } from 'immutable';
import integrationTypes from '../../integrationTypes';

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
        if (name === 'auth.authType' && !values.get(name)) {
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
    name: 'configType',
    label: 'Type',
    type: 'select',
    options: integrationTypes,
    initialValue: 'http',
    required: true,
    enabled: false,
  },
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
    name: 'auth.authType',
    label: 'Authentication',
    type: 'select',
    options: [
      { value: 'basic', label: 'Basic Auth' },
      { value: 'http_bearer_token', label: 'HTTP Bearer Token' },
      { value: 'raw_bearer_token', label: 'Raw Bearer Token' },
      { value: 'client_credentials', label: 'OAuth 2.0' },
    ],
    initialValue: get(auth, 'authType'),
    placeholder: 'None',
  },

  // basic
  {
    name: 'auth.username',
    label: 'Username',
    type: 'text',
    initialValue: get(auth, 'username'),
    required: ({ values }) => values.get('auth.authType') === 'basic',
    visible: ({ values }) => values.get('auth.authType') === 'basic',
  },
  {
    name: 'auth.password.toggle',
    transient: true,
    label: 'Modify Password',
    type: 'toggle',
    // Set to true if there is no auth config or if the current auth config is
    // set to a different type
    initialValue: !auth || get(auth, 'authType') !== 'basic',
    // Show if we're editing a connection and the selected auth type matches
    // the currently saved auth type
    visible: ({ values, connection }) =>
      !!connection &&
      values.get('auth.authType') === 'basic' &&
      connection.getIn(['config', 'auth', 'authType']) === 'basic',
  },
  {
    name: 'auth.password',
    label: 'Password',
    type: 'password',
    initialValue: '',
    visible: ({ values }) => values.get('auth.authType') === 'basic',
    // Enable if we're creating a new connection or the change toggle is true
    enabled: ({ values, connection }) =>
      !connection || !!values.get('auth.password.toggle'),
    // Show the placeholder if there is a connection and it matches the saved type
    placeholder: ({ values, connection }) =>
      !!connection &&
      connection.getIn(['config', 'auth', 'authType']) === 'basic' &&
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
    required: ({ values }) =>
      values.get('auth.authType') === 'client_credentials',
    visible: ({ values }) =>
      values.get('auth.authType') === 'client_credentials',
  },
  {
    name: 'auth.clientId',
    label: 'Client ID',
    type: 'text',
    initialValue: get(auth, 'clientId'),
    required: ({ values }) =>
      values.get('auth.authType') === 'client_credentials',
    visible: ({ values }) =>
      values.get('auth.authType') === 'client_credentials',
  },
  {
    name: 'auth.clientSecret.toggle',
    transient: true,
    label: 'Modify Client Secret',
    type: 'toggle',
    // Set to true if there is no auth config or if the current auth config is
    // set to a different type
    initialValue: !auth || get(auth, 'authType') !== 'client_credentials',
    // Show if we're editing a connection and the selected auth type matches
    // the currently saved auth type
    visible: ({ values, connection }) =>
      !!connection &&
      values.get('auth.authType') === 'client_credentials' &&
      connection.getIn(['config', 'auth', 'authType']) === 'client_credentials',
  },
  {
    name: 'auth.clientSecret',
    label: 'Client Secret',
    type: 'password',
    visible: ({ values }) =>
      values.get('auth.authType') === 'client_credentials',
    // Enable if we're creating a new connection or the change toggle is true
    enabled: ({ values, connection }) =>
      !connection || !!values.get('auth.clientSecret.toggle'),
    // Show the placeholder if there is a connection and it matches the saved type
    placeholder: ({ values, connection }) =>
      !!connection &&
      connection.getIn(['config', 'auth', 'authType']) ===
        'client_credentials' &&
      !values.get('auth.clientSecret.toggle')
        ? '\u2022\u2022\u2022\u2022\u2022\u2022\u2022'
        : undefined,
  },
  {
    name: 'auth.scope',
    label: 'Scope',
    type: 'text',
    initialValue: get(auth, 'scope'),
    visible: ({ values }) =>
      values.get('auth.authType') === 'client_credentials',
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
    required: ({ values }) =>
      values.get('auth.authType') === 'client_credentials',
    visible: ({ values }) =>
      values.get('auth.authType') === 'client_credentials',
  },
  {
    name: 'auth.caCert',
    label: 'Trusted CA Certificate',
    type: 'text',
    initialValue: get(auth, 'caCert') || '',
    visible: ({ values }) =>
      values.get('auth.authType') === 'client_credentials',
  },

  // bearer_token
  {
    name: 'auth.header',
    label: 'Token Header',
    type: 'text',
    initialValue: get(auth, 'header', 'Authorization'),
    visible: ({ values }) =>
      ['raw_bearer_token', 'http_bearer_token'].includes(
        values.get('auth.authType'),
      ),
    required: ({ values }) =>
      ['raw_bearer_token', 'http_bearer_token'].includes(
        values.get('auth.authType'),
      ),
  },
  {
    name: 'auth.prefix',
    label: 'Token Prefix',
    type: 'text',
    initialValue: get(auth, 'prefix', 'Bearer'),
    visible: ({ values }) =>
      ['raw_bearer_token', 'http_bearer_token'].includes(
        values.get('auth.authType'),
      ),
    required: ({ values }) =>
      ['raw_bearer_token', 'http_bearer_token'].includes(
        values.get('auth.authType'),
      ),
  },
  {
    name: 'auth.token.toggle',
    transient: true,
    label: 'Modify Token',
    type: 'toggle',
    // Set to true if there is no auth config or if the current auth config is
    // set to a different type
    initialValue: !auth || get(auth, 'authType') !== 'raw_bearer_token',
    // Show if we're editing a connection and the selected auth type matches
    // the currently saved auth type
    visible: ({ values, connection }) =>
      !!connection &&
      values.get('auth.authType') === 'raw_bearer_token' &&
      connection.getIn(['config', 'auth', 'authType']) === 'raw_bearer_token',
  },
  {
    name: 'auth.token',
    label: 'Token',
    type: 'password',
    initialValue: '',
    visible: ({ values }) => values.get('auth.authType') === 'raw_bearer_token',
    // Enable if we're creating a new connection or the change toggle is true
    enabled: ({ values, connection }) =>
      !connection || !!values.get('auth.token.toggle'),
    // Show the placeholder if there is a connection and it matches the saved type
    placeholder: ({ values, connection }) =>
      !!connection &&
      connection.getIn(['config', 'auth', 'authType']) === 'raw_bearer_token' &&
      !values.get('auth.token.toggle')
        ? '\u2022\u2022\u2022\u2022\u2022\u2022\u2022'
        : undefined,
  },
  ...generateHttpConnectionConfigAuthTokenOperationFields(
    getIn(auth, ['token', 'operation']),
  ),
  {
    name: 'auth.tokenHttpConn',
    transient: true,
    label: 'Use different connection for auth',
    type: 'checkbox',
    initialValue: getIn(auth, ['token', 'connection']) === 'object',
    visible: ({ values }) =>
      values.get('auth.authType') === 'http_bearer_token',
  },
  ...generateHttpConnectionConfigAuthTokenConnectionFields(
    getIn(auth, ['token', 'connection']),
  ),
  {
    name: 'auth.token.tokenOutput',
    label: 'Token',
    type: 'code',
    language: 'js-expression',
    initialValue: getIn(auth, ['token', 'tokenOutput']),
    required: ({ values }) =>
      values.get('auth.authType') === 'http_bearer_token',
    visible: ({ values }) =>
      values.get('auth.authType') === 'http_bearer_token',
    helpText: (
      <>
        Define a JavaScript expression that maps the response to the token
        value. Press <code>Ctrl + Space</code> to see the available properties
        in the field.
      </>
    ),
  },
  {
    name: 'auth.token.expirationOutput',
    label: 'Expiration',
    type: 'code',
    language: 'js-expression',
    initialValue: getIn(auth, ['token', 'expirationOutput']),
    required: ({ values }) =>
      values.get('auth.authType') === 'http_bearer_token',
    visible: ({ values }) =>
      values.get('auth.authType') === 'http_bearer_token',
    helpText: (
      <>
        Define a JavaScript expression that maps the response to a numeric
        expiration value in seconds. Press <code>Ctrl + Space</code> to see the
        available properties in the field.
      </>
    ),
  },
];

const generateHttpConnectionConfigAuthTokenOperationFields = operation => [
  {
    name: 'auth.token.operation.configType',
    label: 'Type',
    type: 'select',
    options: integrationTypes,
    initialValue: 'http',
    enabled: false,
    visible: ({ values }) =>
      values.get('auth.authType') === 'http_bearer_token',
    required: ({ values }) =>
      values.get('auth.authType') === 'http_bearer_token',
  },
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
      values.get('auth.authType') === 'http_bearer_token',
    required: ({ values }) =>
      values.get('auth.authType') === 'http_bearer_token',
  },
  {
    name: 'auth.token.operation.path',
    label: 'Request Path',
    type: 'text',
    initialValue: get(operation, 'path'),
    visible: ({ values }) =>
      values.get('auth.authType') === 'http_bearer_token',
    required: ({ values }) =>
      values.get('auth.authType') === 'http_bearer_token',
  },
  {
    name: 'auth.token.operation.params',
    label: 'URL Parameters',
    type: 'map',
    initialValue: get(operation, 'params'),
    visible: ({ values }) =>
      values.get('auth.authType') === 'http_bearer_token',
    placeholder: 'Parameter Key',
  },
  {
    name: 'auth.token.operation.headers',
    label: 'Headers',
    type: 'map',
    initialValue: get(operation, 'headers'),
    visible: ({ values }) =>
      values.get('auth.authType') === 'http_bearer_token',
    placeholder: 'Header Key',
  },
  {
    name: 'auth.token.operation.followRedirect',
    label: 'Follow Redirect',
    type: 'checkbox',
    initialValue: get(operation, 'followRedirect'),
    visible: ({ values }) =>
      values.get('auth.authType') === 'http_bearer_token',
  },
  {
    name: 'auth.token.operation.streamResponse',
    label: 'Stream Response',
    type: 'checkbox',
    initialValue: get(operation, 'streamResponse'),
    visible: ({ values }) =>
      values.get('auth.authType') === 'http_bearer_token',
  },
  {
    name: 'auth.token.operation.body.bodyType',
    label: 'Body Type',
    type: 'radio',
    options: [
      { label: 'Form URL Encoded', value: 'www_form_urlencoded' },
      { label: 'Raw', value: 'raw' },
      // { label: 'Multipart', value: 'multipart_form' },
    ],
    initialValue:
      getIn(operation, ['body', 'bodyType']) || 'www_form_urlencoded',
    required: true,
    visible: ({ values }) =>
      values.get('auth.authType') === 'http_bearer_token',
  },
  {
    name: 'auth.token.operation.body.form',
    label: 'Form Body',
    type: 'map',
    initialValue: getIn(operation, ['body', 'form']),
    visible: ({ values }) =>
      values.get('auth.authType') === 'http_bearer_token' &&
      values.get('auth.token.operation.body.bodyType') ===
        'www_form_urlencoded',
    placeholder: 'Body Key',
  },
  {
    name: 'auth.token.operation.body.raw',
    label: 'Raw Body',
    type: 'code',
    language: ({ values }) =>
      getLanguageFromContentType(
        values
          .get('auth.token.operation.headers')
          .find((_, header) => header?.toLowerCase() === 'content-type'),
      ),
    initialValue: getIn(operation, ['body', 'raw']),
    visible: ({ values }) =>
      values.get('auth.authType') === 'http_bearer_token' &&
      values.get('auth.token.operation.body.bodyType') === 'raw',
  },
  {
    name: 'auth.token.operation.body.parts',
    label: 'Multipart Body',
    type: 'table',
    options: [
      { name: 'name', label: 'Name', type: 'text' },
      { name: 'contentType', label: 'Content Type', type: 'text' },
      {
        name: 'content',
        label: 'Content',
        type: 'code',
        renderAttributes: { simple: true, max: 'sm' },
      },
      { name: 'fileName', label: 'File Name', type: 'text' },
    ],
    initialValue: getIn(operation, ['body', 'parts'], List()),
    visible: ({ values }) =>
      values.get('auth.authType') === 'http_bearer_token' &&
      values.get('auth.token.operation.body.bodyType') === 'multipart_form',
  },
];

const generateHttpConnectionConfigAuthTokenConnectionFields = connection => [
  {
    name: 'auth.token.connection.baseUrl',
    label: 'Token Base URL',
    type: 'text',
    initialValue: get(connection, 'baseUrl'),
    visible: ({ values }) =>
      values.get('auth.authType') === 'http_bearer_token' &&
      !!values.get('auth.tokenHttpConn'),
    required: ({ values }) =>
      values.get('auth.authType') === 'http_bearer_token' &&
      !!values.get('auth.tokenHttpConn'),
  },
  {
    name: 'auth.token.connection.caCert',
    label: 'Token Trusted CA Certificate',
    type: 'text',
    initialValue: get(connection, 'caCert') || '',
    visible: ({ values }) =>
      values.get('auth.authType') === 'http_bearer_token' &&
      !!values.get('auth.tokenHttpConn'),
  },
];

function getLanguageFromContentType(contentType) {
  switch (contentType) {
    case 'application/json':
      return 'json';
    case 'application/xml':
    case 'text/xml':
      return 'xml';
    default:
      return 'none';
  }
}

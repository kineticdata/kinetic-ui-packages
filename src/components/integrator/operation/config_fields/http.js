import { get, getIn, hasIn, List, Map } from 'immutable';
import integrationTypes from '../../integrationTypes';

export const serializeHttpOperationConfigFields = configFields => ({
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
        // Set the value into the correct structure
        return serialization.setIn(name.split('.'), values.get(name));
      }
      return serialization;
    },
    Map(),
  );
};

export const generateHttpOperationConfigFields = config => [
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
    name: 'method',
    label: 'Method',
    type: 'select',
    options: [
      { label: 'GET', value: 'GET' },
      { label: 'POST', value: 'POST' },
      { label: 'PUT', value: 'PUT' },
      { label: 'DELETE', value: 'DELETE' },
    ],
    initialValue: get(config, 'method'),
    required: true,
  },
  {
    name: 'path',
    label: 'Request Path',
    type: 'text',
    initialValue: get(config, 'path'),
    required: true,
    helpText: (
      <>
        Use the <code>{'{{parameter}}'}</code> format to create dynamic
        parameters.
      </>
    ),
  },
  {
    name: 'params',
    label: 'URL Parameters',
    type: 'map',
    initialValue: get(config, 'params'),
    placeholder: 'Parameter Key',
    helpText: (
      <>
        Use the <code>{'{{parameter}}'}</code> format to create dynamic
        parameters.
      </>
    ),
  },
  {
    name: 'headers',
    label: 'Headers',
    type: 'map',
    initialValue: get(config, 'headers'),
    placeholder: 'Header Key',
    helpText: (
      <>
        Use the <code>{'{{parameter}}'}</code> format to create dynamic
        parameters.
      </>
    ),
  },
  {
    name: 'followRedirect',
    label: 'Follow Redirect',
    type: 'checkbox',
    initialValue: get(config, 'followRedirect'),
  },
  {
    name: 'streamResponse',
    label: 'Stream Response',
    type: 'checkbox',
    initialValue: get(config, 'streamResponse'),
  },
  {
    name: 'body.bodyType',
    label: 'Body Type',
    type: 'radio',
    options: [
      { label: 'Form URL Encoded', value: 'www_form_urlencoded' },
      { label: 'Raw', value: 'raw' },
      // { label: 'Multipart', value: 'multipart_form' },
    ],
    initialValue: getIn(config, ['body', 'bodyType']) || 'www_form_urlencoded',
  },
  {
    name: 'body.form',
    label: 'Form Body',
    type: 'map',
    initialValue: getIn(config, ['body', 'form']),
    visible: ({ values }) =>
      values.get('body.bodyType') === 'www_form_urlencoded',
    placeholder: 'Body Key',
    helpText: (
      <>
        Use the <code>{'{{parameter}}'}</code> format to create dynamic
        parameters.
      </>
    ),
  },
  {
    name: 'body.raw',
    label: 'Raw Body',
    type: 'code',
    language: ({ values }) =>
      getLanguageFromContentType(
        values
          .get('headers')
          .find((_, header) => header?.toLowerCase() === 'content-type'),
      ),
    initialValue: getIn(config, ['body', 'raw']),
    visible: ({ values }) => values.get('body.bodyType') === 'raw',
    helpText: (
      <>
        Use the <code>{'{{parameter}}'}</code> format to create dynamic
        parameters.
      </>
    ),
  },
  {
    name: 'body.parts',
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
    initialValue: getIn(config, ['body', 'parts'], List()),
    visible: ({ values }) => values.get('body.bodyType') === 'multipart_form',
    helpText: (
      <>
        Use the <code>{'{{parameter}}'}</code> format to create dynamic
        parameters.
      </>
    ),
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

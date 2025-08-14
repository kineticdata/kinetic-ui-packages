import { get, getIn, fromJS } from 'immutable';
import { generateForm } from '../../form/Form';
import {
  fetchConnection,
  createConnection,
  updateConnection,
  importConnection,
} from '../../../apis';
import integrationTypes from '../integrationTypes';
import {
  generateHttpConnectionConfigFields,
  serializeHttpConnectionConfigFields,
} from './config_fields/http';
import {
  generateSQLConnectionConfigFields,
  serializeSQLConnectionConfigFields,
} from './config_fields/sql';

const dataSources = ({ id, clone, importData, importOverwrite }) => ({
  connection:
    // If importing and overwriting an existing connection, set the import data
    // into the bindings. Otherwise, fetch the connection if an id is provided.
    importData && importOverwrite === true
      ? { fn: () => importData, params: [] }
      : {
          fn: fetchConnection,
          params: id && [{ id }],
          transform: result => result.connection,
        },
  isClone: { fn: () => clone, params: [] },
});

const handleSubmit =
  ({ id, clone, importData, importOverwrite }) =>
  values =>
    (importData
      ? importConnection
      : id && !clone
        ? updateConnection
        : createConnection)({
      id: importData ? undefined : id,
      connection:
        importData && importOverwrite !== false
          ? values.set('id', importData.id).toJS()
          : values.toJS(),
      force: importData ? importOverwrite : undefined,
    }).then(({ connection, error }) => {
      if (error) {
        throw (
          (error.statusCode === 400 && error.message) ||
          'There was an error saving the connection'
        );
      }
      return connection;
    });

const getFieldConfigByType = (type, connection, options) => {
  switch (type) {
    case 'http':
      const configFieldsHTTP = generateHttpConnectionConfigFields(
        get(connection, 'config'),
        options,
      );
      return [
        configFieldsHTTP,
        serializeHttpConnectionConfigFields(configFieldsHTTP),
      ];
    case 'postgres':
    case 'mssql':
      const configFieldsSQL = generateSQLConnectionConfigFields(
        get(connection, 'config'),
        type,
        options,
      );
      return [
        configFieldsSQL,
        serializeSQLConnectionConfigFields(configFieldsSQL),
      ];
    default:
      return [[], undefined];
  }
};

const fields =
  ({ id, type, clone, importData, importOverwrite }) =>
  ({ connection }) => {
    // Must provide an id of an existing connection, or a type
    if (importData || (id ? connection : type)) {
      const record = connection || fromJS(importData);
      const typeValue = getIn(record, ['config', 'configType']) || type;
      const [configFields, configSerialize] = getFieldConfigByType(
        typeValue,
        record,
        {
          isClone: clone,
          isNewImport: importData && importOverwrite === false,
        },
      );

      return [
        {
          name: 'name',
          label: 'Connection Name',
          type: 'text',
          initialValue: !clone ? get(record, 'name') : '',
          required: true,
          placeholder: !clone
            ? 'Enter a name to find your connection easily'
            : `Clone of ${get(record, 'name')}`,
        },
        {
          name: 'type',
          label: 'Type',
          type: 'select',
          options: integrationTypes,
          initialValue: typeValue,
          required: true,
          enabled: false,
        },
        {
          name: 'documentationLink',
          label: 'API Documentation Link',
          type: 'text',
          initialValue: get(record, 'documentationLink') || '',
          placeholder: 'Optional (but recommended)',
        },
        {
          name: 'description',
          label: 'Description',
          type: 'text',
          initialValue: get(record, 'description') || '',
          placeholder: 'Enter a short description for the connection',
        },
        {
          name: 'secrets',
          label: 'Secrets',
          type: 'map',
          initialValue: get(record, 'secrets') || {},
          placeholder: 'Secret Key',
          helpText:
            'Secrets are key-value pairs that define sensitive values that will be hidden from view, but can be referenced in other parts of the connection by their keys.',
        },
        {
          name: 'config',
          label: 'Config',
          type: null,
          visible: false,
          initialValue: get(record, 'config'),
          // Serialize the transient config fields into a single config object
          serialize: configSerialize,
        },
        // Spread all config fields and make them transient
        ...configFields.map(field => ({ ...field, transient: true })),
      ];
    }
  };

export const ConnectionForm = generateForm({
  formOptions: ['id', 'type', 'clone', 'importData', 'importOverwrite'],
  dataSources,
  fields,
  handleSubmit,
});

ConnectionForm.displayName = 'ConnectionForm';

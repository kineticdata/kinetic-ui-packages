import { get, getIn } from 'immutable';
import { generateForm } from '../../form/Form';
import {
  fetchConnection,
  createConnection,
  updateConnection,
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

const dataSources = ({ id }) => ({
  connection: {
    fn: fetchConnection,
    params: id && [{ id }],
    transform: result => result.connection,
  },
});

const handleSubmit = ({ id, clone }) => values =>
  (id && !clone ? updateConnection : createConnection)({
    id,
    connection: values.toJS(),
  }).then(({ connection, error }) => {
    if (error) {
      throw (error.statusCode === 400 && error.message) ||
        'There was an error saving the connection';
    }
    return connection;
  });

const getFieldConfigByType = (type, connection) => {
  switch (type) {
    case 'http':
      const configFieldsHTTP = generateHttpConnectionConfigFields(
        get(connection, 'config'),
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
      );
      return [
        configFieldsSQL,
        serializeSQLConnectionConfigFields(configFieldsSQL),
      ];
    default:
      return [[], undefined];
  }
};

const fields = ({ id, type, clone }) => ({ connection }) => {
  // Must provide an id of an existing connection, or a type
  if (id ? connection : type) {
    const typeValue = getIn(connection, ['config', 'configType']) || type;
    const [configFields, configSerialize] = getFieldConfigByType(
      typeValue,
      connection,
    );

    return [
      {
        name: 'name',
        label: 'Connection Name',
        type: 'text',
        initialValue: !clone ? get(connection, 'name') : '',
        required: true,
        placeholder: !clone
          ? 'Enter a name to find your connection easily'
          : `Clone of ${get(connection, 'name')}`,
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
        initialValue: get(connection, 'documentationLink') || '',
        placeholder: 'Optional (but recommended)',
      },
      {
        name: 'description',
        label: 'Description',
        type: 'text',
        initialValue: get(connection, 'description') || '',
        placeholder: 'Enter a short description for the connection',
      },
      {
        name: 'secrets',
        label: 'Secrets',
        type: 'map',
        initialValue: get(connection, 'secrets') || {},
        placeholder: 'Secret Key',
        helpText:
          'Secrets are key-value pairs that define sensitive values that will be hidden from view, but can be referenced in other parts of the connection by their keys.',
      },
      {
        name: 'config',
        label: 'Config',
        type: null,
        visible: false,
        initialValue: get(connection, 'config'),
        // Serialize the transient config fields into a single config object
        serialize: configSerialize,
      },
      // Spread all config fields and make them transient
      ...configFields.map(field => ({ ...field, transient: true })),
    ];
  }
};

export const ConnectionForm = generateForm({
  formOptions: ['id', 'type', 'clone'],
  dataSources,
  fields,
  handleSubmit,
});

ConnectionForm.displayName = 'ConnectionForm';

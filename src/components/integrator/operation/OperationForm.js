import { get, getIn } from 'immutable';
import { generateForm } from '../../form/Form';
import {
  fetchConnection,
  fetchOperation,
  createOperation,
  updateOperation,
} from '../../../apis';
import {
  generateHttpOperationConfigFields,
  serializeHttpOperationConfigFields,
} from './config_fields/http';
import {
  generateMSSQLOperationConfigFields,
  generatePostgresOperationConfigFields,
  serializeSQLOperationConfigFields,
} from './config_fields/sql';

const dataSources = ({ id, connectionId }) => ({
  connection: {
    fn: fetchConnection,
    params: connectionId && [{ id: connectionId }],
    transform: result => result.connection,
  },
  operation: {
    fn: fetchOperation,
    params: id && connectionId && [{ id, connectionId }],
    transform: result => result.operation,
  },
});

const handleSubmit = ({ id, connectionId, clone }) => values =>
  (id && !clone ? updateOperation : createOperation)({
    id,
    connectionId,
    operation: values.toJS(),
  }).then(({ operation, error }) => {
    if (error) {
      throw (error.statusCode === 400 && error.message) ||
        'There was an error saving the operation';
    }
    return operation;
  });

const getFieldConfigByType = (type, operation) => {
  switch (type) {
    case 'http':
      const configFieldsHTTP = generateHttpOperationConfigFields(
        get(operation, 'config'),
      );
      return [
        configFieldsHTTP,
        serializeHttpOperationConfigFields(configFieldsHTTP),
      ];
    case 'postgres':
      const configFieldsPostgres = generatePostgresOperationConfigFields(
        get(operation, 'config'),
      );
      return [
        configFieldsPostgres,
        serializeSQLOperationConfigFields(configFieldsPostgres),
      ];
    case 'mssql':
      const configFieldsMSSQL = generateMSSQLOperationConfigFields(
        get(operation, 'config'),
      );
      return [
        configFieldsMSSQL,
        serializeSQLOperationConfigFields(configFieldsMSSQL),
      ];
    default:
      return [[], undefined];
  }
};

const fields = ({ id, clone }) => ({ operation, connection }) => {
  if (connection && (!id || operation)) {
    // Set type from the operation if it exists, or from the connection
    const typeValue = getIn(connection, ['config', 'configType']);
    const [configFields, configSerialize] = getFieldConfigByType(
      typeValue,
      operation,
    );
    return [
      {
        name: 'name',
        label: 'Operation Name',
        type: 'text',
        initialValue: !clone ? get(operation, 'name') : '',
        required: true,
        placeholder: !clone
          ? 'Enter a name to find your operation easily'
          : `Clone of ${get(operation, 'name')}`,
      },
      {
        name: 'documentationLink',
        label: 'API Documentation Link',
        type: 'text',
        initialValue: get(operation, 'documentationLink') || '',
        placeholder: 'Optional (but recommended)',
      },
      {
        name: 'notes',
        label: 'Description',
        type: 'text',
        initialValue: get(operation, 'notes') || '',
        placeholder: 'Enter a short description for the operation',
      },
      {
        name: 'outputs',
        label: 'Outputs',
        type: 'map',
        initialValue: get(operation, 'outputs') || {},
        placeholder: 'Output Key',
        serialize: ({ values }) => values.get('outputs'),
        constraint: ({ values }) =>
          values
            .get('outputs')
            .every(
              (value, key) =>
                key &&
                key.match(/^[a-z\d_-]+[a-z\d\s_-]*$/i) &&
                (!value.get('children') ||
                  value
                    .get('children')
                    .every(
                      (_, childKey) =>
                        childKey && childKey.match(/^[a-z\d_-]+[a-z\d\s_-]*$/i),
                    )),
            ),
        constraintMessage: '',
      },
      {
        name: 'config',
        label: 'Config',
        type: null,
        visible: false,
        initialValue: get(operation, 'config'),
        // Serialize the transient config fields into a single config object
        serialize: configSerialize,
      },
      // Spread all config fields and make them transient
      ...configFields.map(field => ({ ...field, transient: true })),
    ];
  }
};

export const OperationForm = generateForm({
  formOptions: ['id', 'connectionId', 'clone'],
  dataSources,
  fields,
  handleSubmit,
});

OperationForm.displayName = 'OperationForm';

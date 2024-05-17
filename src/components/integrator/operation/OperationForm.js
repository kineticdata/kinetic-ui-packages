import { get } from 'immutable';
import { generateForm } from '../../form/Form';
import {
  fetchConnection,
  fetchOperation,
  createOperation,
  updateOperation,
} from '../../../apis';
import integrationTypes from '../integrationTypes';
import {
  generateHttpOperationConfigFields,
  serializeHttpOperationConfigFields,
} from './config_fields/http';

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

const handleSubmit = ({ id, connectionId }) => values =>
  (id ? updateOperation : createOperation)({
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

const fields = ({ id }) => ({ operation, connection }) => {
  if (connection && (!id || operation)) {
    // Set type from the operation if it exists, or from the connection
    const typeValue = id ? get(operation, 'type') : get(connection, 'type');
    const configFields =
      typeValue === 'http'
        ? generateHttpOperationConfigFields(get(operation, 'config'))
        : [];
    return [
      {
        name: 'name',
        label: 'Operation Name',
        type: 'text',
        initialValue: get(operation, 'name'),
        required: true,
        placeholder: 'Enter a name to find your operation easily',
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
        name: 'docsLink',
        label: 'Operation Documentation Link',
        type: 'text',
        initialValue: get(operation, 'docsLink'),
        placeholder: 'Optional (but recommended)',
        transient: true, // TODO remove when property exists
      },
      {
        name: 'outputs',
        label: 'Outputs',
        type: 'map',
        initialValue: get(operation, 'outputs') || {},
        placeholder: 'Output Key',
        serialize: ({ values }) => values.get('outputs'),
      },
      {
        name: 'config',
        label: 'Config',
        type: null,
        visible: false,
        initialValue: get(operation, 'config'),
        // Serialize the transient config fields into a single config object
        serialize: serializeHttpOperationConfigFields(configFields),
      },
      // Spread all config fields and make them transient
      ...configFields.map(field => ({ ...field, transient: true })),
    ];
  }
};

export const OperationForm = generateForm({
  formOptions: ['id', 'connectionId'],
  dataSources,
  fields,
  handleSubmit,
});

OperationForm.displayName = 'OperationForm';

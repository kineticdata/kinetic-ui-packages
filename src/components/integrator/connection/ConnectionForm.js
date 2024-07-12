import { get } from 'immutable';
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

const fields = ({ id, type, clone }) => ({ connection }) => {
  // Must provide an id of an existing connection, or a type
  if (id ? connection : type) {
    const typeValue = get(connection, 'type') || type;
    const configFields =
      typeValue === 'http'
        ? generateHttpConnectionConfigFields(get(connection, 'config'))
        : [];
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
        name: 'config',
        label: 'Config',
        type: null,
        visible: false,
        initialValue: get(connection, 'config'),
        // Serialize the transient config fields into a single config object
        serialize: serializeHttpConnectionConfigFields(configFields),
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

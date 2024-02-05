import { get } from 'immutable';
import { generateForm } from '../../form/Form';
import {
  fetchConnection,
  createConnection,
  updateConnection,
} from '../../../apis';

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

const handleSubmit = ({ id }) => values =>
  (id ? updateConnection : createConnection)({
    id,
    connection: values.toJS(),
  }).then(({ connection, error }) => {
    if (error) {
      throw (error.statusCode === 400 && error.message) ||
        'There was an error saving the connection';
    }
    return connection;
  });

const fields = ({ id, type }) => ({ connection }) => {
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
        initialValue: get(connection, 'name'),
        required: true,
        placeholder: 'Enter a name to find your connection easily',
      },
      {
        name: 'type',
        label: 'Type',
        type: 'select',
        options: [
          { value: 'http', label: 'HTTP' },
          { value: 'smtp', label: 'SMTP' },
        ],
        initialValue: typeValue,
        required: true,
        enabled: false,
      },
      {
        name: 'docsLink',
        label: 'API Documentation Link',
        type: 'text',
        initialValue: get(connection, 'docsLink'),
        placeholder: 'Optional (but recommended)',
        transient: true, // TODO remove when property exists
      },
      {
        name: 'description',
        label: 'Description',
        type: 'text',
        initialValue: get(connection, 'description'),
        placeholder: 'Enter a short description for the connection',
        transient: true, // TODO remove when property exists
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
  formOptions: ['id', 'type'],
  dataSources,
  fields,
  handleSubmit,
});

ConnectionForm.displayName = 'ConnectionForm';

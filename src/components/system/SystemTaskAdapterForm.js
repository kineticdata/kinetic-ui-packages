import {
  fetchSystemDefaultSQLDbAdapter,
  updateSystemDefaultSQLDbAdapter,
} from '../../apis/system';
import { generateForm } from '../form/Form';
import {
  adapterProperties,
  MSSQL_FIELDS,
  ORACLE_FIELDS,
  POSTGRES_FIELDS,
  VALIDATE_DB_ADAPTERS,
} from './helpers';
import { getIn } from 'immutable';
import { handleFormErrors } from '../form/Form.helpers';

const dataSources = () => ({
  defaultSQLDatabaseAdapter: {
    fn: fetchSystemDefaultSQLDbAdapter,
    params: [],
    transform: result => result.adapter,
  },
  fileFields: {
    fn: () => ({
      mssql: ['sslrootcert', 'sslcert'],
      oracle: ['serverCert', 'clientCert'],
      postgres: ['sslrootcert', 'sslcert', 'sslkey'],
    }),
    params: [],
  },
});

const handleSubmit =
  () =>
  (values, { fileFields, values: rawValues }) => {
    const type = values.get('type');
    const fileFieldsForType = fileFields.get(type);
    // Only include values for file fields if the toggle field is true
    const filterFn = (value, key) =>
      !fileFieldsForType.includes(key) ||
      !!rawValues.get(`${type}_change_${key}`);

    const adapter = {
      type,
      properties: adapterProperties(values, null, type, filterFn),
    };

    return updateSystemDefaultSQLDbAdapter({
      adapter,
      multipart: Object.entries(adapter.properties).some(
        ([name, value]) => value instanceof File,
      ),
    }).then(
      handleFormErrors('adapter', 'There was an error saving the Adapter.'),
    );
  };

const fields =
  () =>
  ({ defaultSQLDatabaseAdapter }) =>
    (defaultSQLDatabaseAdapter || defaultSQLDatabaseAdapter === null) && [
      {
        name: 'type',
        label: 'Database Adapter',
        type: 'select',
        options: VALIDATE_DB_ADAPTERS,
        initialValue: getIn(defaultSQLDatabaseAdapter, ['type'], ''),
      },
      ...MSSQL_FIELDS('type', defaultSQLDatabaseAdapter, [], null),
      ...ORACLE_FIELDS('type', defaultSQLDatabaseAdapter, [], null),
      ...POSTGRES_FIELDS('type', defaultSQLDatabaseAdapter, [], null),
    ];

export const SystemTaskAdapterForm = generateForm({
  formOptions: [],
  dataSources,
  fields,
  handleSubmit,
});

SystemTaskAdapterForm.displayName = 'SystemTaskAdapterForm';

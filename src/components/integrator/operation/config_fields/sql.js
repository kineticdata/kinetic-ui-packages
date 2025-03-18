import { get, Map } from 'immutable';
import integrationTypes from '../../integrationTypes';

export const serializeSQLOperationConfigFields = configFields => ({
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

export const generatePostgresOperationConfigFields = config => [
  {
    name: 'configType',
    label: 'Type',
    type: 'select',
    options: integrationTypes,
    initialValue: 'postgres',
    required: true,
    enabled: false,
  },
  {
    name: 'statement',
    label: 'Query',
    type: 'code',
    language: 'postgresql',
    initialValue: get(config, 'statement'),
    required: true,
  },
  {
    name: 'parameters',
    label: 'Query Parameters',
    type: 'text-multi',
    initialValue: get(config, 'parameters'),
    placeholder: 'Value',
    helpText: (
      <>
        Use the <code>{'{{parameter}}'}</code> format to create dynamic
        parameters.
      </>
    ),
  },
];

export const generateMSSQLOperationConfigFields = config => [
  {
    name: 'configType',
    label: 'Type',
    type: 'select',
    options: integrationTypes,
    initialValue: 'mssql',
    required: true,
    enabled: false,
  },
  {
    name: 'statement',
    label: 'Query',
    type: 'code',
    language: 'mssql',
    initialValue: get(config, 'statement'),
    required: true,
  },
  {
    name: 'parameters',
    label: 'Query Parameters',
    type: 'map',
    initialValue: get(config, 'parameters'),
    placeholder: 'Key',
    helpText: (
      <>
        Use the <code>{'{{parameter}}'}</code> format to create dynamic
        parameters.
      </>
    ),
  },
];

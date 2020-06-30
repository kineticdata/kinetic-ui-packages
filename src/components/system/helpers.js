import { get, getIn, List } from 'immutable';

export const VALIDATE_DB_ADAPTERS = [
  { label: 'Microsoft SQL Server', value: 'mssql' },
  { label: 'Oracle DB Server', value: 'oracle' },
  { label: 'PostgreSQL DB Server', value: 'postgres' },
];

const getValueFromList = (properties, key, initialValue) => {
  const property = properties.find(p => p.get('name') === key);
  return property ? property.get('value') : initialValue;
};

export const generateInitialValues = (
  persistedObject,
  persistedPath,
  defaultObject,
  adapter,
) => (key, initialValue = '') => {
  const sameAsTenant =
    getIn(persistedObject, persistedPath.concat(['type']), '') === adapter;
  const defaultObjectValue = getValueFromList(get(defaultObject, 'properties', List()), key, initialValue);

  if (sameAsTenant) {
    // Get the properties from the persisted object.
    const properties = getIn(
      persistedObject,
      persistedPath.concat(['properties']),
      List(),
    );
    if (List.isList(properties)) {
      const property = properties.find(p => p.get('name') === key);
      return property ? property.get('value') : defaultObjectValue;
    } else {
      return get(properties, key, defaultObjectValue);
    }
  } else if (get(defaultObject, 'type') === adapter) {
    const adapterProperty = get(defaultObject, 'properties', List()).find(
      property => property.get('name') === key,
    );
    return get(adapterProperty, 'value', defaultObjectValue);
  }

  return initialValue;
};

const generatePasswordFields = (
  adapterName,
  persistedObject,
  currentAdapter,
  defaultAdapter,
  label = 'Password',
  fieldName = 'password',
) => {
  const required = ({ values }) => {
    const currentAdapterName = values.get(currentAdapter);

    if (currentAdapterName === adapterName) {
      if (persistedObject) {
        return values.get(`${adapterName}_${fieldName}Change`);
      } else {
        return getIn(defaultAdapter, ['type'], '') !== adapterName;
      }
    }
    return false;
  };

  const name = `${adapterName}_${fieldName}`;

  return [
    {
      name: name,
      label,
      type: 'password',
      transient: ({ values }) =>
        persistedObject
          ? !values.get(`${name}Change`)
          : values.get(name) === '',
      required,
      visible: ({ values }) => values.get(`${name}Change`),
    },
    {
      name: `${name}Change`,
      label: `Change ${label}`,
      type: 'checkbox',
      visible: !!persistedObject,
      initialValue: !persistedObject,
      transient: true,
      onChange: ({ values }, { setValue }) => {
        if (values.get(`${name}`) !== '') {
          setValue(`${name}`, '');
        }
      },
    },
  ];
};

export const MSSQL_FIELDS = (
  adapter,
  persistedObject,
  persistedPath,
  defaultAdapter,
) => {
  const trueIfAdapter = ({ values }) => values.get(adapter) === 'mssql';
  const initialValues = generateInitialValues(
    persistedObject,
    persistedPath,
    defaultAdapter,
    'mssql',
  );
  return [
    {
      name: 'mssql_host',
      label: 'Host',
      type: 'text',
      transient: true,
      required: trueIfAdapter,
      visible: trueIfAdapter,
      initialValue: initialValues('host', '127.0.0.1'),
    },
    {
      name: 'mssql_port',
      label: 'Port',
      type: 'text',
      transient: true,
      required: trueIfAdapter,
      visible: trueIfAdapter,
      initialValue: initialValues('port', '1433'),
    },
    {
      name: 'mssql_database',
      label: 'Database',
      type: 'text',
      transient: true,
      required: trueIfAdapter,
      visible: trueIfAdapter,
      initialValue: initialValues('database', ''),
    },
    {
      name: 'mssql_instance',
      label: 'Instance',
      type: 'text',
      transient: true,
      required: false,
      visible: trueIfAdapter,
      initialValue: initialValues('instance', ''),
    },
    {
      name: 'mssql_username',
      label: 'Username',
      type: 'text',
      transient: true,
      required: false,
      visible: trueIfAdapter,
      initialValue: initialValues('username', ''),
    },
    ...generatePasswordFields(
      'mssql',
      persistedObject,
      adapter,
      defaultAdapter,
      'Password',
      'password',
    ),
    {
      name: 'mssql_sslEnabled',
      label: 'Enable SSL',
      type: 'select',
      transient: true,
      required: false,
      visible: trueIfAdapter,
      options: [
        { label: 'True', value: 'true' },
        { label: 'False', value: 'false' },
      ],
      initialValue: initialValues('sslEnabled', 'false'),
    },
    {
      name: 'mssql_sslProtocol',
      description: 'Protocol to use with SSL encryption',
      label: 'SSL Protocol',
      type: 'text',
      transient: true,
      required: false,
      visible: trueIfAdapter,
      initialValue: initialValues('sslProtocol', 'TLSv1.2'),
    },
    {
      name: 'mssql_sslrootcert',
      label: 'Root Certificate',
      type: 'text-area',
      transient: true,
      required: false,
      visible: trueIfAdapter,
      initialValue: initialValues('sslrootcert', ''),
    },
    {
      name: 'mssql_sslcert',
      label: 'Client Certificate',
      type: 'text-area',
      transient: true,
      required: false,
      visible: trueIfAdapter,
      initialValue: initialValues('sslcert', ''),
    },
    ...generatePasswordFields(
      'mssql',
      persistedObject,
      adapter,
      defaultAdapter,
      'Truststore Password',
      'ssltruststorepw',
    ),
    ...generatePasswordFields(
      'mssql',
      persistedObject,
      adapter,
      defaultAdapter,
      'Keystore Password',
      'sslkeystorepw',
    ),
  ];
};

export const ORACLE_FIELDS = (
  adapter,
  persistedObject,
  persistedPath,
  defaultAdapter,
) => {
  const initialValues = generateInitialValues(
    persistedObject,
    persistedPath,
    defaultAdapter,
    'oracle',
  );
  const trueIfAdapter = ({ values }) => values.get(adapter) === 'oracle';
  return [
    {
      name: 'oracle_host',
      label: 'Host',
      type: 'text',
      transient: true,
      required: trueIfAdapter,
      visible: trueIfAdapter,
      initialValue: initialValues('host', '127.0.0.1'),
    },
    {
      name: 'oracle_port',
      label: 'Port',
      type: 'text',
      transient: true,
      required: trueIfAdapter,
      visible: trueIfAdapter,
      initialValue: initialValues('port', '1521'),
    },
    {
      name: 'oracle_service',
      label: 'Service Name',
      type: 'text',
      transient: true,
      required: trueIfAdapter,
      visible: trueIfAdapter,
      initialValue: initialValues('service', 'ORCLCDB'),
    },
    {
      name: 'oracle_username',
      label: 'Username',
      type: 'text',
      transient: true,
      required: false,
      initialValue: initialValues('username', ''),
      visible: trueIfAdapter,
    },
    ...generatePasswordFields(
      'oracle',
      persistedObject,
      adapter,
      defaultAdapter,
    ),
    {
      name: 'oracle_sslEnabled',
      label: 'Enable SSL',
      type: 'select',
      transient: true,
      required: false,
      visible: trueIfAdapter,
      options: [
        { label: 'True', value: 'true' },
        { label: 'False', value: 'false' },
      ],
      initialValue: initialValues('sslEnabled', 'false'),
    },
    {
      name: 'oracle_sslVersion',
      label: 'TLS Version',
      type: 'text',
      transient: true,
      required: false,
      visible: trueIfAdapter,
      initialValue: initialValues('sslVersion', '1.2'),
    },
    {
      name: 'oracle_sslServerDnMatch',
      label: 'Server DN Match',
      type: 'select',
      transient: true,
      required: false,
      visible: trueIfAdapter,
      options: [
        { label: 'True', value: 'true' },
        { label: 'False', value: 'false' },
      ],
      initialValue: initialValues('sslServerDnMatch', 'false'),
    },
    {
      name: 'oracle_ciphersuites',
      label: 'Cipher Suites',
      type: 'text',
      transient: true,
      required: false,
      visible: trueIfAdapter,
      initialValue: initialValues('ciphersuites', ''),
    },
    {
      name: 'oracle_serverCert',
      label: 'Server Certificate',
      type: 'text-area',
      transient: true,
      required: false,
      visible: trueIfAdapter,
      initialValue: initialValues('serverCert', ''),
    },
    {
      name: 'oracle_clientCert',
      label: 'Client Certificate',
      type: 'text-area',
      transient: true,
      required: false,
      visible: trueIfAdapter,
      initialValue: initialValues('clientCert', ''),
    },
    ...generatePasswordFields(
      'oracle',
      persistedObject,
      adapter,
      defaultAdapter,
      'Truststore Password',
      'truststorePassword',
    ),
    ...generatePasswordFields(
      'oracle',
      persistedObject,
      adapter,
      defaultAdapter,
      'Keystore Password',
      'keystorePassword',
    ),
  ];
};

export const POSTGRES_FIELDS = (
  adapter,
  persistedObject,
  persistedPath,
  defaultAdapter,
) => {
  const trueIfAdapter = ({ values }) => values.get(adapter) === 'postgres';
  const initialValues = generateInitialValues(
    persistedObject,
    persistedPath,
    defaultAdapter,
    'postgres',
  );

  return [
    {
      name: 'postgres_host',
      label: 'Host',
      type: 'text',
      required: trueIfAdapter,
      visible: trueIfAdapter,
      initialValue: initialValues('host', '127.0.0.1'),
    },
    {
      name: 'postgres_port',
      label: 'Port',
      type: 'text',
      required: trueIfAdapter,
      visible: trueIfAdapter,
      initialValue: initialValues('port', '5432'),
    },
    {
      name: 'postgres_database',
      label: 'Database',
      type: 'text',
      required: trueIfAdapter,
      visible: trueIfAdapter,
      initialValue: initialValues('database', 'postgres'),
    },
    {
      name: 'postgres_username',
      label: 'Username',
      type: 'text',
      required: false,
      visible: trueIfAdapter,
      initialValue: initialValues('username', ''),
    },
    ...generatePasswordFields(
      'postgres',
      persistedObject,
      adapter,
      defaultAdapter,
    ),
    {
      name: 'postgres_sslEnabled',
      label: 'Enable SSL',
      type: 'select',
      required: false,
      visible: trueIfAdapter,
      options: [
        { label: 'True', value: 'true' },
        { label: 'False', value: 'false' },
      ],
      initialValue: initialValues('sslEnabled', 'false'),
    },
    {
      name: 'postgres_sslmode',
      label: 'SSL Mode',
      type: 'select',
      required: false,
      visible: trueIfAdapter,
      options: [
        { label: 'Disable', value: 'disable' },
        { label: 'Allow', value: 'allow' },
        { label: 'Prefer', value: 'prefer' },
        { label: 'Verify CA', value: 'verify-ca' },
        { label: 'Verify Full', value: 'verify-full' },
      ],
      initialValue: initialValues('sslmode', 'disable'),
    },
    {
      name: 'postgres_sslrootcert',
      description:
        'x509 certificate (PEM format) used for server authentication',
      label: 'Root Certificate',
      type: 'text-area',
      required: false,
      visible: trueIfAdapter,
      initialValue: initialValues('sslrootcert', ''),
    },
    {
      name: 'postgres_sslcert',
      label: 'Client Certificate',
      type: 'text-area',
      required: false,
      visible: trueIfAdapter,
      initialValue: initialValues('sslcert', ''),
    },
    {
      name: 'postgres_sslkey',
      label: 'Client Key',
      type: 'text-area',
      required: false,
      visible: trueIfAdapter,
      initialValue: initialValues('sslkey', ''),
    },
  ];
};

export const adapterProperties = (values, adapter) => {
  const adapterPrefix = `${adapter}_`;
  const properties = values
    // Remove the other adapters properties.
    .filter((_v, key) => key.startsWith(adapterPrefix))
    // Remove the adapter prefix from the property names.
    .mapKeys(key => key.replace(adapterPrefix, ''))
    .toObject();

  return properties;
};

export const propertiesFromAdapters = (
  taskDbAdapters = List(),
  typeKey = 'type',
) =>
  taskDbAdapters.flatMap(adapter =>
    adapter
      .get('properties', List())
      .map(property => property.set('type', adapter.get(typeKey))),
  );

export const propertiesFromValues = (
  values,
  adapterType = 'type',
  prefix = '',
) => {
  const adapterTypeName = formPropertyName(prefix, adapterType);
  const propertiesType = formPropertyName(
    prefix,
    'properties',
    values.get(adapterTypeName),
  );
  return values
    .filter((value, name) => name.startsWith(propertiesType))
    .mapKeys(name => name.replace(`${propertiesType}_`, ''));
};

export const formPropertyName = (...names) =>
  names.filter(n => n !== '').join('_');

const getPropertyValue = (property, adapter, adapterType) => {
  const defaultType = get(adapter, adapterType, null);
  const type = property.get('type');
  const propertyValue = property.get('value', '') || '';

  if (defaultType && defaultType === type) {
    const defaultProperty = adapter.getIn(
      ['properties', property.get('name')],
      null,
    );

    return defaultProperty || propertyValue || '';
  } else {
    return propertyValue;
  }
};

export const adapterPropertiesFields = ({
  adapterProperties,
  defaultAdapter,
  prefix = '',
  adapterType = 'type',
}) =>
  adapterProperties.map(property => {
    return {
      name: formPropertyName(
        prefix,
        'properties',
        property.get('type'),
        property.get('name'),
      ),
      label: property.get('label') || property.get('name'),
      visible: ({ values }) =>
        values.get(formPropertyName(prefix, adapterType)) ===
        property.get('type'),
      type: property.get('sensitive')
        ? 'password'
        : property.has('options')
        ? 'select'
        : 'text',
      helpText: property.get('description'),
      required: ({ values }) =>
        values.get(formPropertyName(prefix, adapterType)) ===
          property.get('type') && property.get('required', false),
      transient: true,
      options: property.get('options', undefined),
      initialValue: getPropertyValue(property, defaultAdapter, adapterType),
    };
  });

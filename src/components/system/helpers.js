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
  const defaultObjectValue = getValueFromList(
    get(defaultObject, 'properties', List()),
    key,
    initialValue,
  );

  if (sameAsTenant) {
    // Get the properties from the persisted object.
    const properties = getIn(
      persistedObject,
      persistedPath.concat(['properties']),
      List(),
    );
    if (List.isList(properties)) {
      const property = properties.find(p => p.get('name') === key);
      return property
        ? property.get('certificate') || property.get('value')
        : defaultObjectValue;
    } else {
      return get(properties, key, defaultObjectValue);
    }
  } else if (get(defaultObject, 'type') === adapter) {
    const adapterProperty = get(defaultObject, 'properties', List()).find(
      property => property.get('name') === key,
    );
    return get(
      adapterProperty,
      'certificate',
      get(adapterProperty, 'value', defaultObjectValue),
    );
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
  buildFieldName,
  additionalValidation,
) => {
  const required = ({ values }) => {
    const currentAdapterName = values.get(currentAdapter);

    // If this adapter is the same as the currently chosen adapter.
    if (currentAdapterName === adapterName) {
      // And we are editing an existing adaptedr, it is required if changing.
      if (persistedObject) {
        return values.get(`${adapterName}_${fieldName}Change`);
        // Otherwise it's only required, when editing, if the adapter is different than the default.
      } else if (typeof additionalValidation === 'function') {
        return additionalValidation(values);
      } else {
        return getIn(defaultAdapter, ['type'], '') !== adapterName;
      }
    }

    return false;
  };

  const name =
    typeof buildFieldName === 'function'
      ? buildFieldName(fieldName)
      : `${adapterName}_${fieldName}`;

  return [
    {
      name: name,
      label,
      type: 'secret',
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
      type: 'toggle',
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
  const buildName = property =>
    `${persistedPath[0] ? persistedPath[0] + '_' : ''}mssql_${property}`;
  const trueIfAdapter = ({ values }) => values.get(adapter) === 'mssql';
  const initialValues = generateInitialValues(
    persistedObject,
    persistedPath,
    defaultAdapter,
    'mssql',
  );

  return [
    {
      name: buildName('host'),
      label: 'Host',
      type: 'text',
      required: trueIfAdapter,
      visible: trueIfAdapter,
      initialValue: initialValues('host', '127.0.0.1'),
    },
    {
      name: buildName('port'),
      label: 'Port',
      type: 'text',
      required: trueIfAdapter,
      visible: trueIfAdapter,
      initialValue: initialValues('port', '1433'),
    },
    {
      name: buildName('database'),
      label: 'Database',
      type: 'text',
      required: trueIfAdapter,
      visible: trueIfAdapter,
      initialValue: initialValues('database', ''),
    },
    {
      name: buildName('instance'),
      label: 'Instance',
      type: 'text',
      required: false,
      visible: trueIfAdapter,
      initialValue: initialValues('instance', ''),
    },
    {
      name: buildName('username'),
      label: 'Username',
      type: 'text',
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
      buildName,
    ),
    {
      name: buildName('windowsauthenabled'),
      label: 'Use Windows Authentication (Kerberos)',
      type: 'select',
      required: false,
      visible: trueIfAdapter,
      options: [
        { label: 'True', value: 'true' },
        { label: 'False', value: 'false' },
      ],
      initialValue: initialValues('windowsauthenabled', 'false'),
    },
    {
      name: buildName('sslEnabled'),
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
      name: buildName('sslProtocol'),
      helpText: 'Protocol to use with SSL encryption',
      label: 'SSL Protocol',
      type: 'text',
      required: ({ values }) => values.get(buildName('sslEnabled')) === 'true',
      visible: trueIfAdapter,
      initialValue: initialValues('sslProtocol', 'TLSv1.2'),
    },
    {
      name: buildName('current_sslrootcert'),
      label: 'Root Certificate',
      type: 'certificate',
      transient: true,
      required: ({ values }) =>
        !values.get(buildName('change_sslrootcert')) &&
        values.get(buildName('sslEnabled')) === 'true',
      visible: trueIfAdapter,
      initialValue: initialValues('sslrootcert', {}),
    },
    {
      name: buildName('sslrootcert'),
      label: 'Root Certificate',
      type: 'file',
      required: ({ values }) =>
        !!values.get(buildName('change_sslrootcert')) &&
        values.get(buildName('sslEnabled')) === 'true',
      visible: trueIfAdapter,
    },
    {
      name: buildName('change_sslrootcert'),
      label: 'Change Root Certificate',
      type: 'toggle',
      transient: true,
      initialValue: false,
      onChange: ({ values }, { setValue }) => {
        if (
          !List.isList(values.get(buildName('sslrootcert'))) ||
          values.get(buildName('sslrootcert')).size > 0
        ) {
          setValue(buildName('sslrootcert'), List());
        }
      },
    },
    {
      name: buildName('current_sslcert'),
      label: 'Client Certificate',
      type: 'certificate',
      transient: true,
      required: false,
      visible: trueIfAdapter,
      initialValue: initialValues('sslcert', ''),
    },
    {
      name: buildName('sslcert'),
      label: 'Client Certificate',
      type: 'file',
      required: false,
      visible: trueIfAdapter,
    },
    {
      name: buildName('change_sslcert'),
      label: 'Change Client Certificate',
      type: 'toggle',
      transient: true,
      initialValue: false,
      onChange: ({ values }, { setValue }) => {
        if (
          !List.isList(values.get(buildName('sslcert'))) ||
          values.get(buildName('sslcert')).size > 0
        ) {
          setValue(buildName('sslcert'), List());
        }
      },
    },
    ...generatePasswordFields(
      'mssql',
      persistedObject,
      adapter,
      defaultAdapter,
      'Truststore Password',
      'trustStorePassword',
      buildName,
      values => values.get(buildName('sslrootcert'), '') !== '',
    ),
    ...generatePasswordFields(
      'mssql',
      persistedObject,
      adapter,
      defaultAdapter,
      'Keystore Password',
      'keyStoreSecret',
      buildName,
      values => values.get(buildName('sslcert'), '') !== '',
    ),
  ];
};

export const ORACLE_FIELDS = (
  adapter,
  persistedObject,
  persistedPath,
  defaultAdapter,
) => {
  const buildName = property =>
    `${persistedPath[0] ? persistedPath[0] + '_' : ''}oracle_${property}`;
  const initialValues = generateInitialValues(
    persistedObject,
    persistedPath,
    defaultAdapter,
    'oracle',
  );
  const trueIfAdapter = ({ values }) => values.get(adapter) === 'oracle';

  return [
    {
      name: buildName('host'),
      label: 'Host',
      type: 'text',
      required: trueIfAdapter,
      visible: trueIfAdapter,
      initialValue: initialValues('host', '127.0.0.1'),
    },
    {
      name: buildName('port'),
      label: 'Port',
      type: 'text',
      required: trueIfAdapter,
      visible: trueIfAdapter,
      initialValue: initialValues('port', '1521'),
    },
    {
      name: buildName('service'),
      label: 'Service Name',
      type: 'text',
      required: trueIfAdapter,
      visible: trueIfAdapter,
      initialValue: initialValues('service', 'ORCLCDB'),
    },
    {
      name: buildName('username'),
      label: 'Username',
      type: 'text',
      required: false,
      initialValue: initialValues('username', ''),
      visible: trueIfAdapter,
    },
    ...generatePasswordFields(
      'oracle',
      persistedObject,
      adapter,
      defaultAdapter,
      undefined,
      undefined,
      buildName,
    ),
    {
      name: buildName('sslEnabled'),
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
      name: buildName('sslVersion'),
      label: 'TLS Version',
      type: 'text',
      required: ({ values }) => values.get(buildName('sslEnabled')) === 'true',
      visible: trueIfAdapter,
      initialValue: initialValues('sslVersion', '1.2'),
    },
    {
      name: buildName('sslServerDnMatch'),
      label: 'Server DN Match',
      type: 'select',
      required: ({ values }) => values.get(buildName('sslEnabled')) === 'true',
      visible: trueIfAdapter,
      options: [
        { label: 'True', value: 'true' },
        { label: 'False', value: 'false' },
      ],
      initialValue: initialValues('sslServerDnMatch', 'false'),
    },
    {
      name: buildName('ciphersuites'),
      label: 'Cipher Suites',
      type: 'text',
      required: false,
      visible: trueIfAdapter,
      initialValue: initialValues('ciphersuites', ''),
    },
    {
      name: buildName('current_serverCert'),
      label: 'Server Certificate',
      type: 'certificate',
      transient: true,
      required: ({ values }) =>
        !values.get(buildName('change_serverCert')) &&
        values.get(buildName('sslEnabled')) === 'true',
      visible: trueIfAdapter,
      initialValue: initialValues('serverCert', ''),
    },
    {
      name: buildName('serverCert'),
      label: 'Server Certificate',
      type: 'file',
      required: ({ values }) =>
        !!values.get(buildName('change_serverCert')) &&
        values.get(buildName('sslEnabled')) === 'true',
      visible: trueIfAdapter,
    },
    {
      name: buildName('change_serverCert'),
      label: 'Change Server Certificate',
      type: 'toggle',
      transient: true,
      initialValue: false,
      onChange: ({ values }, { setValue }) => {
        if (
          !List.isList(values.get(buildName('serverCert'))) ||
          values.get(buildName('serverCert')).size > 0
        ) {
          setValue(buildName('serverCert'), List());
        }
      },
    },
    {
      name: buildName('current_clientCert'),
      label: 'Client Certificate',
      type: 'certificate',
      transient: true,
      required: false,
      visible: trueIfAdapter,
      initialValue: initialValues('clientCert', ''),
    },
    {
      name: buildName('clientCert'),
      label: 'Client Certificate',
      type: 'file',
      required: false,
      visible: trueIfAdapter,
    },
    {
      name: buildName('change_clientCert'),
      label: 'Change Client Certificate',
      type: 'toggle',
      transient: true,
      initialValue: false,
      onChange: ({ values }, { setValue }) => {
        if (
          !List.isList(values.get(buildName('clientCert'))) ||
          values.get(buildName('clientCert')).size > 0
        ) {
          setValue(buildName('clientCert'), List());
        }
      },
    },
    ...generatePasswordFields(
      'oracle',
      persistedObject,
      adapter,
      defaultAdapter,
      'Truststore Password',
      'trustStorePassword',
      buildName,
      values => values.get(buildName('serverCert'), '') !== '',
    ),
    ...generatePasswordFields(
      'oracle',
      persistedObject,
      adapter,
      defaultAdapter,
      'Keystore Password',
      'keyStorePassword',
      buildName,
      values => values.get(buildName('clientCert'), '') !== '',
    ),
  ];
};

export const POSTGRES_FIELDS = (
  adapter,
  persistedObject,
  persistedPath,
  defaultAdapter,
) => {
  const buildName = property =>
    `${persistedPath[0] ? persistedPath[0] + '_' : ''}postgres_${property}`;
  const trueIfAdapter = ({ values }) => values.get(adapter) === 'postgres';
  const initialValues = generateInitialValues(
    persistedObject,
    persistedPath,
    defaultAdapter,
    'postgres',
  );

  const isIntegrator = persistedPath[0] === 'integrator';
  // Make sure the ssl mode options and value are valid for the component type
  const sslModeOptions = isIntegrator
    ? [
        { label: 'Verify None', value: 'verify-none' },
        { label: 'Verify Peer', value: 'verify-peer' },
      ]
    : [
        { label: 'Disable', value: 'disable' },
        { label: 'Allow', value: 'allow' },
        { label: 'Prefer', value: 'prefer' },
        { label: 'Verify CA', value: 'verify-ca' },
        { label: 'Verify Full', value: 'verify-full' },
      ];
  const sslModeInitialValueRaw = initialValues('sslmode');
  const sslModeInitialValue = !!sslModeOptions.find(
    o => o.value === sslModeInitialValueRaw,
  )
    ? sslModeInitialValueRaw
    : isIntegrator
      ? 'verify-peer'
      : 'disable';

  return [
    {
      name: buildName('host'),
      label: 'Host',
      type: 'text',
      required: trueIfAdapter,
      visible: trueIfAdapter,
      initialValue: initialValues('host', '127.0.0.1'),
    },
    {
      name: buildName('port'),
      label: 'Port',
      type: 'text',
      required: trueIfAdapter,
      visible: trueIfAdapter,
      initialValue: initialValues('port', '5432'),
    },
    {
      name: buildName('database'),
      label: 'Database',
      type: 'text',
      required: trueIfAdapter,
      visible: trueIfAdapter,
      initialValue: initialValues('database', 'postgres'),
    },
    {
      name: buildName('username'),
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
      undefined,
      undefined,
      buildName,
    ),
    {
      name: buildName('sslEnabled'),
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
      name: buildName('sslmode'),
      label: 'SSL Mode',
      type: 'select',
      required: ({ values }) => values.get(buildName('sslEnabled')) === 'true',
      visible: trueIfAdapter,
      options: sslModeOptions,
      initialValue: sslModeInitialValue,
    },
    {
      name: buildName('current_sslrootcert'),
      helpText: 'x509 certificate (PEM format) used for server authentication',
      label: 'Root Certificate',
      type: 'certificate',
      transient: true,
      required: ({ values }) =>
        !values.get(buildName('change_sslrootcert')) &&
        values.get(buildName('sslEnabled')) === 'true' &&
        values.get(buildName('sslmode')) !== 'disable',
      visible: trueIfAdapter,
      initialValue: initialValues('sslrootcert', {}),
    },
    {
      name: buildName('sslrootcert'),
      helpText: 'x509 certificate (PEM format) used for server authentication',
      label: 'Root Certificate',
      type: 'file',
      required: ({ values }) =>
        !!values.get(buildName('change_sslrootcert')) &&
        values.get(buildName('sslEnabled')) === 'true' &&
        values.get(buildName('sslmode')) !== 'disable',
      visible: trueIfAdapter,
    },
    {
      name: buildName('change_sslrootcert'),
      label: 'Change Root Certificate',
      type: 'toggle',
      transient: true,
      initialValue: false,
      onChange: ({ values }, { setValue }) => {
        if (
          !List.isList(values.get(buildName('sslrootcert'))) ||
          values.get(buildName('sslrootcert')).size > 0
        ) {
          setValue(buildName('sslrootcert'), List());
        }
      },
    },
    {
      name: buildName('current_sslcert'),
      label: 'Client Certificate',
      type: 'certificate',
      transient: true,
      required: false,
      visible: trueIfAdapter,
      initialValue: initialValues('sslcert', ''),
    },
    {
      name: buildName('sslcert'),
      label: 'Client Certificate',
      type: 'file',
      required: false,
      visible: trueIfAdapter,
    },
    {
      name: buildName('change_sslcert'),
      label: 'Change Client Certificate',
      type: 'toggle',
      transient: true,
      initialValue: false,
      onChange: ({ values }, { setValue }) => {
        if (
          !List.isList(values.get(buildName('sslcert'))) ||
          values.get(buildName('sslcert')).size > 0
        ) {
          setValue(buildName('sslcert'), List());
        }
      },
    },
    {
      name: buildName('current_sslkey'),
      label: 'Client Key',
      type: 'secret',
      transient: true,
      required: false,
      visible: false,
      initialValue: '',
    },
    {
      name: buildName('sslkey'),
      label: 'Client Key',
      type: 'file',
      required: false,
      visible: trueIfAdapter,
    },
    {
      name: buildName('change_sslkey'),
      label: 'Change Private Key',
      type: 'toggle',
      transient: true,
      initialValue: false,
      onChange: ({ values }, { setValue }) => {
        if (
          !List.isList(values.get(buildName('sslkey'))) ||
          values.get(buildName('sslkey')).size > 0
        ) {
          setValue(buildName('sslkey'), List());
        }
      },
    },
  ];
};

export const adapterProperties = (
  values,
  prefix,
  adapter,
  filterFn = o => o,
) => {
  const adapterPrefix = prefix ? `${prefix}_${adapter}_` : `${adapter}_`;

  return (
    values
      // Remove the other adapters properties.
      .filter((_v, key) => key.startsWith(adapterPrefix))
      // Remove the adapter prefix from the property names.
      .mapKeys(key => key.replace(adapterPrefix, ''))
      // Map values that are Lists to their first entry (used for File fields)
      .map(value => (List.isList(value) ? value.get(0) || '' : value))
      // Call the provided filter function in case we need to filter out values,
      // such as for hidden file fields
      .filter(filterFn)
      .toObject()
  );
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
      placeholder:
        property.get('sensitive') &&
        defaultAdapter &&
        defaultAdapter.get('adapterClass') === property.get('type')
          ? '•••••••'
          : undefined,
      helpText: property.get('description'),
      required: ({ values }) =>
        values.get(formPropertyName(prefix, adapterType)) ===
          property.get('type') && property.get('required', false),
      options: property.get('options', undefined),
      initialValue: getPropertyValue(property, defaultAdapter, adapterType),
    };
  });

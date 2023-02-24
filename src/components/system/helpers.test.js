import { fromJS } from 'immutable';
import { generateInitialValues } from './helpers';

describe('#generateInitialValues', () => {
  const defaultTaskAdapter = fromJS({
    name: 'pg',
    type: 'postgres',
    properties: [
      {
        name: 'host',
        value: 'default-host-value',
      },
      {
        name: 'database',
        value: 'default-db-name',
      },
    ],
  });

  const tenantTaskAdapter = fromJS({
    slug: 'acme',
    space: {},
    task: {
      databaseAdapter: {
        application: 'task',
        type: 'postgres',
        properties: {
          host: 'tenant-host-value',
        },
      },
    },
  });

  describe('when used for default task adapter', () => {
    test('happy path', () => {
      const persistedPath = [];
      const defaultAdapter = null;
      const initialValues = generateInitialValues(
        defaultTaskAdapter,
        persistedPath,
        defaultAdapter,
        'postgres',
      );

      // Expect the value from the persisted object.
      expect(initialValues('host', 'default')).toBe('default-host-value');
      // Expect the overall default value.
      expect(initialValues('port', '1234')).toBe('1234');
    });
  });

  describe('when used for tenant task adapter', () => {
    test('happy path', () => {
      const persistedPath = ['task', 'databaseAdapter'];
      const initialValues = generateInitialValues(
        tenantTaskAdapter,
        persistedPath,
        defaultTaskAdapter,
        'postgres',
      );

      // Expect the value from the persisted object.
      expect(initialValues('host', 'default')).toBe('tenant-host-value');
      // Expect the default task adapter's value.
      expect(initialValues('database', 'invalid-db')).toBe('default-db-name');
      // Expect the overall default value.
      expect(initialValues('port', '1234')).toBe('1234');
    });
  });
});

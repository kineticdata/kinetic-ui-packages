import axios from 'axios';

import { resolvePromiseWith } from '../../../tests/utils/promises';
import {
  bridgedResourceUrl,
  bridgedResourceData,
  fetchBridgedResource,
  countBridgedResource,
} from './bridgedresources';

// Mock out the bundle object from a dependency.
jest.mock('../../helpers', () => ({
  bundle: {
    apiLocation: () => 'user/app/api/v1',
    spaceLocation: () => 'user',
    kappSlug: () => 'mock-kapp',
  },
}));

describe('bridged resource api', () => {
  let options;

  beforeEach(() => {
    options = {
      kappSlug: 'kappslug',
      formSlug: 'formslug',
      bridgedResourceName: 'Collection',
    };
  });

  describe('#bridgedResourceUrl', () => {
    describe('options', () => {
      test('with valid parameters does not throw an exception', () => {
        expect(() => {
          bridgedResourceUrl(options);
        }).not.toThrow();
      });
      test('missing "formSlug" throws an exception', () => {
        delete options.formSlug;

        expect(() => {
          bridgedResourceUrl(options);
        }).toThrow();
      });
      test('missing "bridgedResourceName" throws an exception', () => {
        expect(() => {
          bridgedResourceUrl({ kappSlug: 'kapp', formSlug: 'form' });
        }).toThrow();
      });
    });

    test('normal output', () => {
      expect(bridgedResourceUrl(options)).toBe(
        'user/kappslug/formslug/bridgedResources/Collection',
      );
    });

    test('datastore form', () => {
      expect(bridgedResourceUrl({ ...options, datastore: true })).toBe(
        'user/datastore/formslug/bridgedResources/Collection',
      );
    });

    test('default the kapp option', () => {
      delete options.kappSlug;
      expect(bridgedResourceUrl(options)).toBe(
        'user/mock-kapp/formslug/bridgedResources/Collection',
      );
    });
  });

  describe('#bridgedResourceData', () => {
    test('without data options', () => {
      expect(bridgedResourceData(options)).toEqual('');
    });

    test('with limit option', () => {
      options.limit = 10;
      expect(bridgedResourceData(options)).toMatch(/limit=10/);
    });

    test('with offset option', () => {
      options.offset = 10;
      expect(bridgedResourceData(options)).toMatch(/offset=10/);
    });

    describe('values option', () => {
      test('with one value', () => {
        options.values = { a: 'b' };
        expect(bridgedResourceData(options)).toMatch(/values%5Ba%5D=b/);
      });

      test('with multiple values', () => {
        options.values = { a: 'b', c: 'd' };
        const url = bridgedResourceData(options);
        expect(url).toMatch(/values%5Ba%5D=b/);
        expect(url).toMatch(/values%5Bc%5D=d/);
      });
    });

    describe('metadata option', () => {
      test('with one value', () => {
        options.metadata = { a: 'b' };
        expect(bridgedResourceData(options)).toMatch(/metadata%5Ba%5D=b/);
      });

      test('with multiple values', () => {
        options.metadata = { a: 'b', c: 'd' };
        const url = bridgedResourceData(options);
        expect(url).toMatch(/metadata%5Ba%5D=b/);
        expect(url).toMatch(/metadata%5Bc%5D=d/);
      });
    });

    describe('attributes option', () => {
      test('with one attribute', () => {
        options.attributes = ['a'];
        expect(bridgedResourceData(options)).toMatch(/attributes=a/);
      });

      test('with multiple values', () => {
        options.attributes = ['a', 'b'];
        expect(bridgedResourceData(options)).toMatch(/attributes=a%2Cb/);
      });
    });
  });

  describe('#count', () => {
    describe('when successful', () => {
      let response;

      beforeEach(() => {
        response = {
          status: 200,
          data: {
            count: 2,
          },
        };
        axios.post = resolvePromiseWith(response);
      });

      test('does not return errors', () => {
        expect.assertions(1);
        return countBridgedResource(options).then(({ error }) => {
          expect(error).toBeUndefined();
        });
      });

      test('returns an object with a count', () => {
        expect.assertions(1);
        // eslint-disable-next-line
        return countBridgedResource(options).then(({ count }) => {
          expect(count).toBe(2);
        });
      });
    });
  });
  describe('#fetch', () => {
    describe('when successful', () => {
      describe('multiple records', () => {
        let response;

        beforeEach(() => {
          response = {
            status: 200,
            data: {
              records: {
                fields: ['Field A', 'Field B'],
                records: [['Value A1', 'Value B1'], ['Value A2', 'Value B2']],
                metadata: {
                  size: 2,
                  nextPageToken: null,
                },
              },
            },
          };
          axios.post = resolvePromiseWith(response);
        });

        test('does not return errors', () => {
          expect.assertions(1);
          return fetchBridgedResource(options).then(({ serverError }) => {
            expect(serverError).toBeUndefined();
          });
        });

        test('returns a records object', () => {
          expect.assertions(7);
          return fetchBridgedResource(options).then(({ records }) => {
            expect(records).toBeDefined();
            expect(records).toBeInstanceOf(Array);
            expect(records).toHaveLength(2);
            expect(records[0]).toHaveProperty('Field A', 'Value A1');
            expect(records[0]).toHaveProperty('Field B', 'Value B1');
            expect(records[1]).toHaveProperty('Field A', 'Value A2');
            expect(records[1]).toHaveProperty('Field B', 'Value B2');
          });
        });
      });
      describe('single record', () => {
        let response;

        beforeEach(() => {
          response = {
            status: 200,
            data: {
              record: {
                attributes: {
                  'Field A': 'Value A',
                  'Field B': 'Value B',
                },
              },
            },
          };
          axios.post = resolvePromiseWith(response);
        });

        test('does not return errors', () => {
          expect.assertions(1);
          return fetchBridgedResource(options).then(({ error }) => {
            expect(error).toBeUndefined();
          });
        });

        test('returns a record object', () => {
          expect.assertions(3);
          return fetchBridgedResource(options).then(({ record }) => {
            expect(record).toBeDefined();
            expect(record).toHaveProperty('Field A');
            expect(record).toHaveProperty('Field B');
          });
        });
      });
    });
  });
});

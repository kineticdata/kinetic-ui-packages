import {
  headerBuilder,
  corePath,
  handleErrors,
  paramBuilder,
  operations,
} from './http';
import { List } from 'immutable';

jest.mock('../helpers', () => ({
  bundle: {
    spaceLocation: () => '/kinetic/acme',
    kappSlug: () => 'catalog',
  },
}));

describe('http module', () => {
  describe('#handleErrors', () => {
    // What scenarios do we handle?
    describe('when there is a 500 with an error object', () => {
      test('returns an object with "error"', () => {
        const errorResponse = {
          response: {
            status: 500,
            statusText: 'Internal server error',
            data: {
              error: 'There were no attributes, QQ',
            },
          },
        };

        const { error } = handleErrors(errorResponse);
        expect(error).toEqual({
          key: null,
          message: 'There were no attributes, QQ',
          statusCode: 500,
        });
      });
    });
    // What scenarios do we handle?
    describe('when there is a 500 with empty data object', () => {
      test('returns an object without "error"', () => {
        const errorResponse = {
          response: {
            status: 500,
            statusText: 'Internal server error',
            data: {},
          },
        };

        const { error } = handleErrors(errorResponse);
        expect(error).toEqual({
          statusCode: 500,
          key: null,
          message: 'Internal server error',
        });
      });
    });
  });

  describe('corePath', () => {
    describe('kapp forms and submissions', () => {
      test('builds url with specified kapp', () => {
        expect(corePath({ form: 'ipad-request', kapp: 'services' })).toBe(
          '/kinetic/acme/services/ipad-request',
        );
      });

      test('builds url with the submission id', () => {
        expect(corePath({ submission: 'abc123' })).toBe(
          '/kinetic/acme/submissions/abc123',
        );
      });
    });

    describe('space forms and submissions', () => {
      test('builds url to form', () => {
        expect(corePath({ form: 'cars' })).toBe('/kinetic/acme/app/forms/cars');
      });

      test('builds url with the submission id', () => {
        expect(corePath({ submission: 'abc123' })).toBe(
          '/kinetic/acme/submissions/abc123',
        );
      });
    });
  });

  describe('headerBuilder', () => {
    test('defaults to setting the X-Kinetic-AuthAssumed header to true', () => {
      expect(headerBuilder({})).toEqual({
        'X-Kinetic-AuthAssumed': 'true',
      });
    });
    test('omits X-Kinetic-AuthAssumed when public is true', () => {
      expect(headerBuilder({ public: true })).toEqual({});
    });
  });

  // The `paramBuilder` only strips out unnecessary options.
  describe('#paramBuilder', () => {
    test('returns parameter values', () => {
      const params = [
        ['include', 'include'],
        ['limit', 1],
        ['pageToken', 'pageToken'],
        ['q', 'q'],
        ['direction', 'direction'],
        ['orderBy', 'orderBy'],
        ['manage', 'manage'],
        ['export', 'export'],
      ];

      params.forEach(([param, value]) =>
        expect(paramBuilder({ [param]: value })).toMatchObject({
          [param]: value,
        }),
      );
    });
    test('does not return non-parameter values', () => {
      expect(
        paramBuilder({ limit: 'limit', foobar: 'foobar' }),
      ).not.toMatchObject({ foobar: 'foobar' });
    });
    test('does not return parameters not passed', () => {
      expect(
        paramBuilder({ limit: 'limit', foobar: 'foobar' }),
      ).not.toMatchObject({ include: undefined });
    });
  });

  describe('search operations', () => {
    test('startsWith', () => {
      const op = operations.get('startsWith');
      expect(op('field', 'value')).toEqual('field =* "value"');
    });
    test('equals', () => {
      const op = operations.get('equals');
      expect(op('field', 'value')).toEqual('field = "value"');
    });
    test('lt', () => {
      const op = operations.get('lt');
      expect(op('field', 'value')).toEqual('field < "value"');
    });
    test('lteq', () => {
      const op = operations.get('lteq');
      expect(op('field', 'value')).toEqual('field <= "value"');
    });
    test('gt', () => {
      const op = operations.get('gt');
      expect(op('field', 'value')).toEqual('field > "value"');
    });
    test('gteq', () => {
      const op = operations.get('gteq');
      expect(op('field', 'value')).toEqual('field >= "value"');
    });
    test('between', () => {
      const op = operations.get('between');
      expect(op('field', List(['v1', 'v2']))).toEqual(
        'field BETWEEN ("v1", "v2")',
      );
    });
    test('in', () => {
      const op = operations.get('in');
      expect(op('field', List(['v1', 'v2']))).toEqual('field IN ("v1", "v2")');
    });
  });
});

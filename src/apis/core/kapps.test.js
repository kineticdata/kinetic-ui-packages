import axios from 'axios';
import createError from 'axios/lib/core/createError';
import { fetchKapp, fetchKapps, updateKapp } from './kapps';
import { KappBuilder } from '../../../tests/utils/kapp_builder';
import {
  rejectPromiseWith,
  resolvePromiseWith,
} from '../../../tests/utils/promises';

jest.mock('axios');

// Mock out the bundle object from a dependency.
jest.mock('../../helpers', () => ({
  bundle: {
    apiLocation: () => 'kapp/app/api/v1',
    kappSlug: () => 'mock-kapp',
  },
}));

describe('kapps api', () => {
  describe('#fetchKapps', () => {
    describe('when successful', () => {
      let response;
      let testKapp;

      beforeEach(() => {
        response = {
          status: 200,
          data: {
            kapps: [],
          },
        };
        testKapp = new KappBuilder()
          .stub()
          .withAttribute('Attribute', 'value')
          .build();
        response.data.kapps.push(testKapp);
        axios.get = resolvePromiseWith(response);
      });

      test('does not return errors', () => {
        expect.assertions(1);
        return fetchKapps().then(({ serverError }) => {
          expect(serverError).toBeUndefined();
        });
      });

      test('returns an array of kapps', () => {
        expect.assertions(2);
        return fetchKapps().then(({ kapps }) => {
          expect(kapps).toBeInstanceOf(Array);
          expect(kapps[0]).toMatchObject({
            name: testKapp.name,
            slug: testKapp.slug,
          });
        });
      });

      test('returns attributes', () => {
        expect.assertions(2);
        return fetchKapps({ xlatAttributes: true }).then(({ kapps }) => {
          expect(kapps[0].attributes).toBeDefined();
          expect(kapps[0].attributes).toBeInstanceOf(Array);
        });
      });
    });
  });

  describe('#fetchKapp', () => {
    describe('when successful', () => {
      let response;
      let testKapp;

      beforeEach(() => {
        response = {
          status: 200,
          data: {
            kapp: {},
          },
        };
        testKapp = new KappBuilder()
          .stub()
          .withAttribute('Attribute', 'value')
          .build();
        response.data.kapp = testKapp;
        axios.get = resolvePromiseWith(response);
      });

      test('does not return errors', () => {
        expect.assertions(1);
        return fetchKapp().then(({ errors }) => {
          expect(errors).toBeUndefined();
        });
      });

      test('returns a kapp', () => {
        expect.assertions(1);
        return fetchKapp().then(({ kapp }) => {
          expect(kapp).toMatchObject({
            name: testKapp.name,
            slug: testKapp.slug,
          });
        });
      });

      test('returns attributes', () => {
        expect.assertions(2);
        return fetchKapp({ xlatAttributes: true }).then(({ kapp }) => {
          expect(kapp.attributes).toBeDefined();
          expect(kapp.attributes).toBeInstanceOf(Array);
        });
      });
    });

    describe('when unsuccessful', () => {
      let response;

      beforeEach(() => {
        response = {
          status: 500,
          data: {},
        };
        axios.get = rejectPromiseWith({ response });
      });

      test('does return errors', () => {
        expect.assertions(1);
        return fetchKapp({ includes: 'attributes', xlatAttributes: true }).then(
          ({ error }) => {
            expect(error).toBeDefined();
          },
        );
      });
    });
  });

  describe('updateKapp', () => {
    beforeEach(() => {
      axios.put.mockReset();
    });

    test('success', async () => {
      axios.put.mockResolvedValue({
        status: 200,
        data: {
          kapp: {
            name: 'Test',
            attributes: [{ name: 'Company Name', values: ['Foo Bar'] }],
          },
        },
      });
      const { kapp, error } = await updateKapp({
        kappSlug: 'catalog',
        kapp: {
          name: 'Test',
          attributes: [{ name: 'Company Name', values: ['Foo Bar'] }],
        },
        include: 'attributes',
      });
      expect(axios.put.mock.calls).toEqual([
        [
          'kapp/app/api/v1/kapps/catalog',
          {
            name: 'Test',
            attributes: [{ name: 'Company Name', values: ['Foo Bar'] }],
          },
          {
            params: { include: 'attributes' },
            headers: { 'X-Kinetic-AuthAssumed': 'true' },
          },
        ],
      ]);
      expect(kapp).toEqual({
        name: 'Test',
        attributes: [{ name: 'Company Name', values: ['Foo Bar'] }],
      });
      expect(error).toBeUndefined();
    });

    test('defaults to bundle.kappSlug() when no kappSlug provided', async () => {
      axios.put.mockResolvedValue({ status: 200, data: {} });
      await updateKapp({ kapp: { name: 'Test' } });
      expect(axios.put.mock.calls).toEqual([
        [
          'kapp/app/api/v1/kapps/mock-kapp',
          { name: 'Test' },
          { params: {}, headers: { 'X-Kinetic-AuthAssumed': 'true' } },
        ],
      ]);
    });

    test('missing kapp', () => {
      expect(() => {
        updateKapp({});
      }).toThrow('updateKapp failed! The option "kapp" is required.');
    });

    test('missing kappSlug', () => {
      // Note that we need to set it to null becuse by default if kappSlug is
      // not passed (undefined) it checks the 'bundle' helper.
      expect(() => {
        updateKapp({ kapp: {}, kappSlug: null });
      }).toThrow('updateKapp failed! The option "kappSlug" is required.');
    });

    test('bad request', async () => {
      axios.put.mockRejectedValue(
        createError('Request failed with status code 400', null, 400, null, {
          status: 400,
          statusText: 'Bad Request',
          data: { error: 'Invalid kapp' },
        }),
      );
      const { kapp, error } = await updateKapp({
        kapp: { name: null },
      });
      expect(kapp).toBeUndefined();
      expect(error).toEqual({
        statusCode: 400,
        key: null,
        badRequest: true,
        message: 'Invalid kapp',
      });
    });

    test('forbidden', async () => {
      axios.put.mockRejectedValue(
        createError('Request failed with status code 403', null, 403, null, {
          status: 403,
          statusText: 'Forbidden',
          data: {},
        }),
      );
      const { kapp, error } = await updateKapp({
        kapp: { name: 'Foo' },
      });
      expect(kapp).toBeUndefined();
      expect(error).toEqual({
        statusCode: 403,
        key: null,
        forbidden: true,
        message: 'Forbidden',
      });
    });
  });
});

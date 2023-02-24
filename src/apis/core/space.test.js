import axios from 'axios';
import createError from 'axios/lib/core/createError';
import { fetchSpace, updateSpace } from './space';

jest.mock('axios');

describe('space api', () => {
  describe('#fetchSpace', () => {
    describe('when successful', () => {
      beforeEach(() => {
        axios.get.mockResolvedValue({
          status: 200,
          data: {
            space: { name: 'Acme', slug: 'acme', attributes: [] },
          },
        });
      });

      test('does not return errors', () => {
        expect.assertions(1);
        return fetchSpace().then(({ serverError }) => {
          expect(serverError).toBeUndefined();
        });
      });

      test('returns a space', () => {
        expect.assertions(1);
        return fetchSpace().then(({ space }) => {
          expect(space).toMatchObject({
            name: 'Acme',
            slug: 'acme',
          });
        });
      });

      test('returns attributes', () => {
        expect.assertions(2);
        return fetchSpace({ xlatAttributes: true }).then(({ space }) => {
          expect(space.attributes).toBeDefined();
          expect(space.attributes).toBeInstanceOf(Array);
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
        axios.get.mockRejectedValue({ response });
      });

      test('does return errors', () => {
        expect.assertions(1);
        return fetchSpace({
          includes: 'attributes',
          xlatAttributes: true,
        }).then(({ error }) => {
          expect(error).toBeDefined();
        });
      });
    });
  });

  describe('updateSpace', () => {
    beforeEach(() => {
      axios.put.mockReset();
    });

    test('success', async () => {
      axios.put.mockResolvedValue({
        status: 200,
        data: {
          space: {
            name: 'Foo',
            attributes: [{ name: 'Company Name', values: ['Foo Bar'] }],
          },
        },
      });
      const { space, error } = await updateSpace({
        space: {
          name: 'Foo',
          attributes: [{ name: 'Company Name', values: ['Foo Bar'] }],
        },
        include: 'attributes',
      });
      expect(axios.put.mock.calls).toEqual([
        [
          '/app/api/v1/space',
          {
            name: 'Foo',
            attributes: [{ name: 'Company Name', values: ['Foo Bar'] }],
          },
          {
            params: { include: 'attributes' },
            headers: { 'X-Kinetic-AuthAssumed': 'true' },
          },
        ],
      ]);
      expect(space).toEqual({
        name: 'Foo',
        attributes: [{ name: 'Company Name', values: ['Foo Bar'] }],
      });
      expect(error).toBeUndefined();
    });

    test('missing space', async () => {
      expect(() => {
        updateSpace({});
      }).toThrow('updateSpace failed! The option "space" is required.');
    });

    test('bad request', async () => {
      axios.put.mockRejectedValue(
        createError('Request failed with status code 400', null, 400, null, {
          status: 400,
          statusText: 'Bad Request',
          data: { error: 'Invalid space' },
        }),
      );
      const { space, error } = await updateSpace({
        space: { name: null },
      });
      expect(space).toBeUndefined();
      expect(error).toEqual({
        message: 'Invalid space',
        statusCode: 400,
        key: null,
        badRequest: true,
      });
    });

    test('serverError', async () => {
      axios.put.mockRejectedValue(
        createError('Request failed with status code 403', null, 403, null, {
          status: 403,
          statusText: 'Forbidden',
          data: {},
        }),
      );
      const { space, error } = await updateSpace({
        space: { name: 'Foo' },
      });
      expect(space).toBeUndefined();
      expect(error).toEqual({
        statusCode: 403,
        message: 'Forbidden',
        key: null,
        forbidden: true,
      });
    });
  });
});

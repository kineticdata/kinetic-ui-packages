import axios from 'axios';
import createError from 'axios/lib/core/createError';
import {
  fetchWebhooks,
  fetchWebhook,
  createWebhook,
  updateWebhook,
} from './webhooks';

jest.mock('axios');

// Mock out the bundle object from a dependency.
jest.mock('../../helpers', () => ({
  bundle: {
    apiLocation: () => 'space/app/api/v1',
  },
}));

describe('webhooks api', () => {
  describe('fetchWebhooks', () => {
    beforeEach(() => {
      axios.get.mockReset();
    });

    test('success space scoped webhooks', async () => {
      axios.get.mockResolvedValue({
        status: 200,
        data: {
          webhooks: [
            {
              authStrategy: null,
              event: 'Login Failure',
              filter: '',
              name: 'Test Webhook Name',
              type: 'Space',
              url: 'https://myapi.com/api/v1',
            },
          ],
        },
      });
      const result = await fetchWebhooks();
      expect(axios.get.mock.calls).toEqual([
        [
          'space/app/api/v1/webhooks',
          { params: {}, headers: { 'X-Kinetic-AuthAssumed': 'true' } },
        ],
      ]);
      expect(result).toEqual({
        webhooks: [
          {
            authStrategy: null,
            event: 'Login Failure',
            filter: '',
            name: 'Test Webhook Name',
            type: 'Space',
            url: 'https://myapi.com/api/v1',
          },
        ],
      });
    });

    test('success kapp scoped webhooks', async () => {
      axios.get.mockResolvedValue({
        status: 200,
        data: {
          webhooks: [
            {
              authStrategy: null,
              event: 'Login Failure',
              filter: '',
              name: 'Test Webhook Name',
              type: 'Space',
              url: 'https://myapi.com/api/v1',
            },
          ],
        },
      });
      const result = await fetchWebhooks({
        kappSlug: 'services',
      });
      expect(axios.get.mock.calls).toEqual([
        [
          'space/app/api/v1/kapps/services/webhooks',
          { params: {}, headers: { 'X-Kinetic-AuthAssumed': 'true' } },
        ],
      ]);
      expect(result).toEqual({
        webhooks: [
          {
            authStrategy: null,
            event: 'Login Failure',
            filter: '',
            name: 'Test Webhook Name',
            type: 'Space',
            url: 'https://myapi.com/api/v1',
          },
        ],
      });
    });

    test('forbidden', async () => {
      axios.get.mockRejectedValue(
        createError('Request failed with status code 403', null, 403, null, {
          status: 403,
          statusText: 'Forbidden',
        }),
      );
      const result = await fetchWebhooks();
      expect(axios.get.mock.calls).toEqual([
        [
          'space/app/api/v1/webhooks',
          { params: {}, headers: { 'X-Kinetic-AuthAssumed': 'true' } },
        ],
      ]);
      expect(result).toEqual({
        error: {
          forbidden: true,
          statusCode: 403,
          key: null,
          message: 'Forbidden',
        },
      });
    });
  });

  describe('fetchWebhook', () => {
    beforeEach(() => {
      axios.get.mockReset();
    });

    test('success', async () => {
      axios.get.mockResolvedValue({
        status: 200,
        data: {
          webhook: {
            authStrategy: null,
            event: 'Login Failure',
            filter: '',
            name: 'Test Webhook Name',
            type: 'Space',
            url: 'https://myapi.com/api/v1',
          },
        },
      });
      const result = await fetchWebhook({
        webhookName: 'Test Webhook Name',
      });
      expect(axios.get.mock.calls).toEqual([
        [
          'space/app/api/v1/webhooks/Test%20Webhook%20Name',
          { params: {}, headers: { 'X-Kinetic-AuthAssumed': 'true' } },
        ],
      ]);
      expect(result).toEqual({
        webhook: {
          authStrategy: null,
          event: 'Login Failure',
          filter: '',
          name: 'Test Webhook Name',
          type: 'Space',
          url: 'https://myapi.com/api/v1',
        },
      });
    });
  });

  describe('createWebhook', () => {
    beforeEach(() => {
      axios.post.mockReset();
    });

    test('failure kapp scoped webhook - missing kappSlug', () => {
      expect(() => {
        createWebhook({
          webhook: {
            type: 'Kapp',
          },
        });
      }).toThrowError(
        'createWebhook failed! A kappSlug is required when using type: Kapp',
      );
    });

    test('success create webhook space', async () => {
      axios.post.mockResolvedValue({
        status: 200,
        data: {
          webhook: {
            authStrategy: null,
            event: 'Login Failure',
            filter: '',
            name: 'Test Webhook Name',
            type: 'Space',
            url: 'https://myapi.com/api/v1',
          },
        },
      });
      const result = await createWebhook({
        webhook: {
          authStrategy: null,
          event: 'Login Failure',
          filter: '',
          name: 'Test Webhook Name',
          type: 'Space',
          url: 'https://myapi.com/api/v1',
        },
      });
      expect(axios.post.mock.calls).toEqual([
        [
          'space/app/api/v1/webhooks',
          {
            authStrategy: null,
            event: 'Login Failure',
            filter: '',
            name: 'Test Webhook Name',
            type: 'Space',
            url: 'https://myapi.com/api/v1',
          },
          { params: {}, headers: { 'X-Kinetic-AuthAssumed': 'true' } },
        ],
      ]);
      expect(result).toEqual({
        webhook: {
          authStrategy: null,
          event: 'Login Failure',
          filter: '',
          name: 'Test Webhook Name',
          type: 'Space',
          url: 'https://myapi.com/api/v1',
        },
      });
    });

    test('success create security definition kapp', async () => {
      axios.post.mockResolvedValue({
        status: 200,
        data: {
          webhook: {
            authStrategy: null,
            event: 'Login Failure',
            filter: '',
            name: 'Test Webhook Name',
            type: 'Space',
            url: 'https://myapi.com/api/v1',
          },
        },
      });
      const result = await createWebhook({
        kappSlug: 'services',
        webhook: {
          authStrategy: null,
          event: 'Login Failure',
          filter: '',
          name: 'Test Webhook Name',
          type: 'Space',
          url: 'https://myapi.com/api/v1',
        },
      });
      expect(axios.post.mock.calls).toEqual([
        [
          'space/app/api/v1/kapps/services/webhooks',
          {
            authStrategy: null,
            event: 'Login Failure',
            filter: '',
            name: 'Test Webhook Name',
            type: 'Space',
            url: 'https://myapi.com/api/v1',
          },
          { params: {}, headers: { 'X-Kinetic-AuthAssumed': 'true' } },
        ],
      ]);
      expect(result).toEqual({
        webhook: {
          authStrategy: null,
          event: 'Login Failure',
          filter: '',
          name: 'Test Webhook Name',
          type: 'Space',
          url: 'https://myapi.com/api/v1',
        },
      });
    });
  });

  describe('updateWebhook', () => {
    beforeEach(() => {
      axios.put.mockReset();
    });

    test('success update webhook', async () => {
      axios.put.mockResolvedValue({
        status: 200,
        data: {
          webhook: {
            authStrategy: null,
            event: 'Login Failure',
            filter: '',
            name: 'New Test Webhook Name',
            type: 'Space',
            url: 'https://myapi.com/api/v1',
          },
        },
      });
      const result = await updateWebhook({
        webhookName: 'Test Webhook Name',
        webhook: {
          authStrategy: null,
          event: 'Login Failure',
          filter: '',
          name: 'New Test Webhook Name',
          type: 'Space',
          url: 'https://myapi.com/api/v1',
        },
      });
      expect(axios.put.mock.calls).toEqual([
        [
          'space/app/api/v1/webhooks/Test%20Webhook%20Name',
          {
            authStrategy: null,
            event: 'Login Failure',
            filter: '',
            name: 'New Test Webhook Name',
            type: 'Space',
            url: 'https://myapi.com/api/v1',
          },
          { params: {}, headers: { 'X-Kinetic-AuthAssumed': 'true' } },
        ],
      ]);
      expect(result).toEqual({
        webhook: {
          authStrategy: null,
          event: 'Login Failure',
          filter: '',
          name: 'New Test Webhook Name',
          type: 'Space',
          url: 'https://myapi.com/api/v1',
        },
      });
    });
  });
});

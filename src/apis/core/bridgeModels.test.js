import axios from 'axios';
import createError from 'axios/lib/core/createError';
import {
  fetchBridgeModels,
  fetchBridgeModel,
  createBridgeModel,
  updateBridgeModel,
} from './bridgeModels';

jest.mock('axios');

// Mock out the bundle object from a dependency.
jest.mock('../../helpers', () => ({
  bundle: {
    apiLocation: () => 'space/app/api/v1',
  },
}));

describe('bridgeModels api', () => {
  describe('fetchBridgeModels', () => {
    beforeEach(() => {
      axios.get.mockReset();
    });

    test('success', async () => {
      axios.get.mockResolvedValue({
        status: 200,
        data: {
          models: [{ name: 'Person' }, { name: 'Building' }],
        },
      });
      const result = await fetchBridgeModels({ include: 'attributes' });
      expect(axios.get.mock.calls).toEqual([
        [
          'space/app/api/v1/models',
          {
            params: { include: 'attributes' },
            headers: { 'X-Kinetic-AuthAssumed': 'true' },
          },
        ],
      ]);
      expect(result).toEqual({
        bridgeModels: [{ name: 'Person' }, { name: 'Building' }],
      });
    });

    test('forbidden', async () => {
      axios.get.mockRejectedValue(
        createError('Request failed with status code 403', null, 403, null, {
          status: 403,
          statusText: 'Forbidden',
        }),
      );
      const result = await fetchBridgeModels({ include: 'attributes' });
      expect(axios.get.mock.calls).toEqual([
        [
          'space/app/api/v1/models',
          {
            params: { include: 'attributes' },
            headers: { 'X-Kinetic-AuthAssumed': 'true' },
          },
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

  describe('fetchBridgeModel', () => {
    beforeEach(() => {
      axios.get.mockReset();
    });

    test('success', async () => {
      axios.get.mockResolvedValue({
        status: 200,
        data: {
          model: { name: 'Person' },
        },
      });
      const result = await fetchBridgeModel({
        modelName: 'Person',
        include: 'attributes',
      });
      expect(axios.get.mock.calls).toEqual([
        [
          'space/app/api/v1/models/Person',
          {
            params: { include: 'attributes' },
            headers: { 'X-Kinetic-AuthAssumed': 'true' },
          },
        ],
      ]);
      expect(result).toEqual({
        bridgeModel: { name: 'Person' },
      });
    });

    test('missing modelName', () => {
      expect(() => {
        fetchBridgeModel({ include: 'attributes' });
      }).toThrowError(
        'fetchBridgeModel failed! The following required options are missing: modelName',
      );
    });

    test('forbidden', async () => {
      axios.get.mockRejectedValue(
        createError('Request failed with status code 403', null, 403, null, {
          status: 403,
          statusText: 'Forbidden',
        }),
      );
      const result = await fetchBridgeModel({
        modelName: 'Person',
        include: 'attributes',
      });
      expect(axios.get.mock.calls).toEqual([
        [
          'space/app/api/v1/models/Person',
          {
            params: { include: 'attributes' },
            headers: { 'X-Kinetic-AuthAssumed': 'true' },
          },
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

  describe('createBridgeModel', () => {
    beforeEach(() => {
      axios.post.mockReset();
    });

    test('success', async () => {
      axios.post.mockResolvedValue({
        status: 200,
        data: {
          model: { name: 'Person' },
        },
      });
      const result = await createBridgeModel({
        bridgeModel: { name: 'Person', status: 'Active' },
        include: 'attributes',
      });
      expect(axios.post.mock.calls).toEqual([
        [
          'space/app/api/v1/models',
          { name: 'Person', status: 'Active' },
          {
            params: { include: 'attributes' },
            headers: { 'X-Kinetic-AuthAssumed': 'true' },
          },
        ],
      ]);
      expect(result).toEqual({
        bridgeModel: { name: 'Person' },
      });
    });

    test('missing bridgeModel', () => {
      expect(() => {
        createBridgeModel({ include: 'attributes' });
      }).toThrowError(
        'createBridgeModel failed! The following required options are missing: bridgeModel',
      );
    });

    test('bad request', async () => {
      axios.post.mockRejectedValue(
        createError('Request failed with status code 400', null, 400, null, {
          status: 400,
          statusText: 'Bad Request',
          data: { error: 'Invalid Bridge Model' },
        }),
      );
      const result = await createBridgeModel({
        bridgeModel: { name: '', status: 'Active' },
        include: 'attributes',
      });
      expect(result).toEqual({
        error: {
          badRequest: true,
          statusCode: 400,
          key: null,
          message: 'Invalid Bridge Model',
        },
      });
    });

    test('forbidden', async () => {
      axios.post.mockRejectedValue(
        createError('Request failed with status code 403', null, 403, null, {
          status: 403,
          statusText: 'Forbidden',
        }),
      );
      const result = await createBridgeModel({
        bridgeModel: { name: '', status: 'Active' },
        include: 'attributes',
      });
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

  describe('updateBridgeModel', () => {
    beforeEach(() => {
      axios.put.mockReset();
    });

    test('success', async () => {
      axios.put.mockResolvedValue({
        status: 200,
        data: {
          model: { name: 'Person New' },
        },
      });
      const result = await updateBridgeModel({
        modelName: 'Person',
        bridgeModel: { name: 'Person New', status: 'Active' },
        include: 'attributes',
      });
      expect(axios.put.mock.calls).toEqual([
        [
          'space/app/api/v1/models/Person',
          { name: 'Person New', status: 'Active' },
          {
            params: { include: 'attributes' },
            headers: { 'X-Kinetic-AuthAssumed': 'true' },
          },
        ],
      ]);
      expect(result).toEqual({
        bridgeModel: { name: 'Person New' },
      });
    });

    test('missing modelName', () => {
      expect(() => {
        updateBridgeModel({ bridgeModel: {}, include: 'attributes' });
      }).toThrowError(
        'updateBridgeModel failed! The following required options are missing: modelName',
      );
    });

    test('missing bridgeModel', () => {
      expect(() => {
        updateBridgeModel({ modelName: 'Foo', include: 'attributes' });
      }).toThrowError(
        'updateBridgeModel failed! The following required options are missing: bridgeModel',
      );
    });

    test('bad request', async () => {
      axios.put.mockRejectedValue(
        createError('Request failed with status code 400', null, 400, null, {
          status: 400,
          statusText: 'Bad Request',
          data: { error: 'Invalid Bridge Model' },
        }),
      );
      const result = await updateBridgeModel({
        modelName: 'Person',
        bridgeModel: { name: '', status: 'Active' },
        include: 'attributes',
      });
      expect(result).toEqual({
        error: {
          badRequest: true,
          statusCode: 400,
          key: null,
          message: 'Invalid Bridge Model',
        },
      });
    });

    test('forbidden', async () => {
      axios.put.mockRejectedValue(
        createError('Request failed with status code 403', null, 403, null, {
          status: 403,
          statusText: 'Forbidden',
        }),
      );
      const result = await updateBridgeModel({
        modelName: 'Person',
        bridgeModel: { name: '', status: 'Active' },
        include: 'attributes',
      });
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
});

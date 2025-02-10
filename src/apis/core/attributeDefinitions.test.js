import axios from 'axios';
import createError from 'axios/lib/core/createError';
import {
  fetchAttributeDefinitions,
  fetchAttributeDefinition,
  createAttributeDefinition,
  updateAttributeDefinition,
} from './attributeDefinitions';

jest.mock('axios');

// Mock out the bundle object from a dependency.
jest.mock('../../helpers', () => ({
  bundle: {
    apiLocation: () => 'space/app/api/v1',
  },
}));

describe('attributeDefinitions api', () => {
  describe('fetchAttributeDefinitions', () => {
    beforeEach(() => {
      axios.get.mockReset();
    });

    test('success space scoped attribute', async () => {
      axios.get.mockResolvedValue({
        status: 200,
        data: {
          spaceAttributeDefinitions: [
            {
              allowsMultiple: false,
              description: 'Slug of this spaces Admin Kapp (typically admin)',
              name: 'Admin Kapp Slug',
            },
            {
              allowsMultiple: false,
              description: null,
              name: 'Bundle Package Version',
            },
          ],
        },
      });
      const result = await fetchAttributeDefinitions({
        attributeType: 'spaceAttributeDefinitions',
      });
      expect(axios.get.mock.calls).toEqual([
        [
          'space/app/api/v1/spaceAttributeDefinitions',
          { params: {}, headers: { 'X-Kinetic-AuthAssumed': 'true' } },
        ],
      ]);
      expect(result).toEqual({
        attributeDefinitions: [
          {
            allowsMultiple: false,
            description: 'Slug of this spaces Admin Kapp (typically admin)',
            name: 'Admin Kapp Slug',
          },
          {
            allowsMultiple: false,
            description: null,
            name: 'Bundle Package Version',
          },
        ],
      });
    });

    test('success kapp scoped attribute', async () => {
      axios.get.mockResolvedValue({
        status: 200,
        data: {
          categoryAttributeDefinitions: [
            {
              allowsMultiple: false,
              description: 'Slug of this spaces Admin Kapp (typically admin)',
              name: 'Admin Kapp Slug',
            },
            {
              allowsMultiple: false,
              description: null,
              name: 'Bundle Package Version',
            },
          ],
        },
      });
      const result = await fetchAttributeDefinitions({
        attributeType: 'categoryAttributeDefinitions',
        kappSlug: 'services',
      });
      expect(axios.get.mock.calls).toEqual([
        [
          'space/app/api/v1/kapps/services/categoryAttributeDefinitions',
          { params: {}, headers: { 'X-Kinetic-AuthAssumed': 'true' } },
        ],
      ]);
      expect(result).toEqual({
        attributeDefinitions: [
          {
            allowsMultiple: false,
            description: 'Slug of this spaces Admin Kapp (typically admin)',
            name: 'Admin Kapp Slug',
          },
          {
            allowsMultiple: false,
            description: null,
            name: 'Bundle Package Version',
          },
        ],
      });
    });

    test('failure kapp scoped attribute - missing kappSlug', () => {
      expect(() => {
        fetchAttributeDefinitions({
          attributeType: 'categoryAttributeDefinitions',
        });
      }).toThrowError(
        'fetchAttributeDefinitions failed! A kappSlug is required when using categoryAttributeDefinitions',
      );
    });

    test('forbidden', async () => {
      axios.get.mockRejectedValue(
        createError('Request failed with status code 403', null, 403, null, {
          status: 403,
          statusText: 'Forbidden',
        }),
      );
      const result = await fetchAttributeDefinitions({
        attributeType: 'spaceAttributeDefinitions',
      });
      expect(axios.get.mock.calls).toEqual([
        [
          'space/app/api/v1/spaceAttributeDefinitions',
          { params: {}, headers: { 'X-Kinetic-AuthAssumed': 'true' } },
        ],
      ]);
      expect(result).toEqual({
        error: {
          statusCode: 403,
          key: null,
          forbidden: true,
          message: 'Forbidden',
        },
      });
    });
  });

  describe('fetchAttributeDefinition', () => {
    beforeEach(() => {
      axios.get.mockReset();
    });

    test('success', async () => {
      axios.get.mockResolvedValue({
        status: 200,
        data: {
          spaceAttributeDefinition: {
            allowsMultiple: false,
            name: 'Foo',
          },
        },
      });
      const result = await fetchAttributeDefinition({
        attributeType: 'spaceAttributeDefinitions',
        attributeName: 'Foo',
      });
      expect(axios.get.mock.calls).toEqual([
        [
          'space/app/api/v1/spaceAttributeDefinitions/Foo',
          { params: {}, headers: { 'X-Kinetic-AuthAssumed': 'true' } },
        ],
      ]);
      expect(result).toEqual({
        attributeDefinition: {
          allowsMultiple: false,
          name: 'Foo',
        },
      });
    });

    test('invalid attributeType', () => {
      expect(() => {
        fetchAttributeDefinition({
          attributeType: 'notAValidAttributeType',
          attributeName: 'Foo',
        });
      }).toThrowError(
        'fetchAttributeDefinition failed! The provided attributeType (notAValidAttributeType) is not valid',
      );
    });
  });

  describe('createAttributeDefinition', () => {
    beforeEach(() => {
      axios.post.mockReset();
    });

    test('success create attribute definition', async () => {
      axios.post.mockResolvedValue({
        status: 200,
        data: {
          spaceAttributeDefinition: {
            name: 'Test Attribute',
            description: 'Test Attr Desc',
            allowsMultiple: true,
          },
        },
      });
      const result = await createAttributeDefinition({
        attributeType: 'spaceAttributeDefinitions',
        attributeDefinition: {
          name: 'Test Attribute',
          description: 'Test Attr Desc',
          allowsMultiple: true,
        },
      });
      expect(axios.post.mock.calls).toEqual([
        [
          'space/app/api/v1/spaceAttributeDefinitions',
          {
            name: 'Test Attribute',
            description: 'Test Attr Desc',
            allowsMultiple: true,
          },
          { params: {}, headers: { 'X-Kinetic-AuthAssumed': 'true' } },
        ],
      ]);
      expect(result).toEqual({
        attributeDefinition: {
          name: 'Test Attribute',
          description: 'Test Attr Desc',
          allowsMultiple: true,
        },
      });
    });

    test('missing name', () => {
      expect(() => {
        createAttributeDefinition({
          attributeType: 'spaceAttributeDefinitions',
        });
      }).toThrowError(
        'createAttributeDefinition failed! The following required options are missing: attributeDefinition',
      );
    });
  });

  describe('updateAttributeDefinition', () => {
    beforeEach(() => {
      axios.put.mockReset();
    });

    test('success update attribute definition', async () => {
      axios.put.mockResolvedValue({
        status: 200,
        data: {
          spaceAttributeDefinition: {
            name: 'Test Attribute',
            description: 'Test Attr Desc',
            allowsMultiple: true,
          },
        },
      });
      const result = await updateAttributeDefinition({
        attributeType: 'spaceAttributeDefinitions',
        attributeName: 'Test Attribute',
        attributeDefinition: {
          name: 'Test Attribute',
          description: 'Test Attr Desc',
          allowsMultiple: true,
        },
      });
      expect(axios.put.mock.calls).toEqual([
        [
          'space/app/api/v1/spaceAttributeDefinitions/Test%20Attribute',
          {
            name: 'Test Attribute',
            description: 'Test Attr Desc',
            allowsMultiple: true,
          },
          { params: {}, headers: { 'X-Kinetic-AuthAssumed': 'true' } },
        ],
      ]);
      expect(result).toEqual({
        attributeDefinition: {
          name: 'Test Attribute',
          description: 'Test Attr Desc',
          allowsMultiple: true,
        },
      });
    });
  });
});

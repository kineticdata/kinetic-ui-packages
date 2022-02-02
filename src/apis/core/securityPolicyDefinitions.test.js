import axios from 'axios';
import createError from 'axios/lib/core/createError';
import {
  fetchSecurityPolicyDefinitions,
  fetchSecurityPolicyDefinition,
  createSecurityPolicyDefinition,
  updateSecurityPolicyDefinition,
} from './securityPolicyDefinitions';

jest.mock('axios');

// Mock out the bundle object from a dependency.
jest.mock('../../helpers', () => ({
  bundle: {
    apiLocation: () => 'space/app/api/v1',
  },
}));

describe('securityPolicyDefinitions api', () => {
  describe('fetchSecurityPolicyDefinitions', () => {
    beforeEach(() => {
      axios.get.mockReset();
    });

    test('success space scoped security policy definition', async () => {
      axios.get.mockResolvedValue({
        status: 200,
        data: {
          securityPolicyDefinitions: [
            {
              message: 'Must be an administrator.',
              name: 'Admins',
              rule:
                "/* \n * Space admins are allowed access regardless of the result of security \n * policies.  Returning 'false' denies anyone but a space access. \n */\nfalse",
              type: 'Space',
            },
            {
              message: 'Must be authenticated.',
              name: 'Authenticated Users',
              rule: "identity('authenticated')",
              type: 'Space',
            },
            {
              message: 'Everyone is allowed access.',
              name: 'Everyone',
              rule: 'true',
              type: 'Space',
            },
          ],
        },
      });
      const result = await fetchSecurityPolicyDefinitions();
      expect(axios.get.mock.calls).toEqual([
        [
          'space/app/api/v1/securityPolicyDefinitions',
          { params: {}, headers: { 'X-Kinetic-AuthAssumed': 'true' } },
        ],
      ]);
      expect(result).toEqual({
        securityPolicyDefinitions: [
          {
            message: 'Must be an administrator.',
            name: 'Admins',
            rule:
              "/* \n * Space admins are allowed access regardless of the result of security \n * policies.  Returning 'false' denies anyone but a space access. \n */\nfalse",
            type: 'Space',
          },
          {
            message: 'Must be authenticated.',
            name: 'Authenticated Users',
            rule: "identity('authenticated')",
            type: 'Space',
          },
          {
            message: 'Everyone is allowed access.',
            name: 'Everyone',
            rule: 'true',
            type: 'Space',
          },
        ],
      });
    });

    test('success kapp scoped security policy definitions', async () => {
      axios.get.mockResolvedValue({
        status: 200,
        data: {
          securityPolicyDefinitions: [
            {
              message: 'Must be an administrator.',
              name: 'Admins',
              rule:
                "/* \n * Space admins are allowed access regardless of the result of security \n * policies.  Returning 'false' denies anyone but a space access. \n */\nfalse",
              type: 'Kapp',
            },
            {
              message: 'Must be authenticated.',
              name: 'Authenticated Users',
              rule: "identity('authenticated')",
              type: 'Kapp',
            },
            {
              message: 'Everyone is allowed access.',
              name: 'Everyone',
              rule: 'true',
              type: 'Kapp',
            },
            {
              message: 'Must be the user that created the submission.',
              name: 'Submitter',
              rule:
                "(submission('anonymous') && submission('sessionToken') == identity('sessionToken'))\n|| (!submission('anonymous') && submission('createdBy') == identity('username'))",
              type: 'Submission',
            },
          ],
        },
      });
      const result = await fetchSecurityPolicyDefinitions({
        kappSlug: 'services',
      });
      expect(axios.get.mock.calls).toEqual([
        [
          'space/app/api/v1/kapps/services/securityPolicyDefinitions',
          { params: {}, headers: { 'X-Kinetic-AuthAssumed': 'true' } },
        ],
      ]);
      expect(result).toEqual({
        securityPolicyDefinitions: [
          {
            message: 'Must be an administrator.',
            name: 'Admins',
            rule:
              "/* \n * Space admins are allowed access regardless of the result of security \n * policies.  Returning 'false' denies anyone but a space access. \n */\nfalse",
            type: 'Kapp',
          },
          {
            message: 'Must be authenticated.',
            name: 'Authenticated Users',
            rule: "identity('authenticated')",
            type: 'Kapp',
          },
          {
            message: 'Everyone is allowed access.',
            name: 'Everyone',
            rule: 'true',
            type: 'Kapp',
          },
          {
            message: 'Must be the user that created the submission.',
            name: 'Submitter',
            rule:
              "(submission('anonymous') && submission('sessionToken') == identity('sessionToken'))\n|| (!submission('anonymous') && submission('createdBy') == identity('username'))",
            type: 'Submission',
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
      const result = await fetchSecurityPolicyDefinitions();
      expect(axios.get.mock.calls).toEqual([
        [
          'space/app/api/v1/securityPolicyDefinitions',
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

  describe('fetchSecurityPolicyDefinition', () => {
    beforeEach(() => {
      axios.get.mockReset();
    });

    test('success', async () => {
      axios.get.mockResolvedValue({
        status: 200,
        data: {
          securityPolicyDefinition: {
            message: 'Everyone is allowed access.',
            name: 'Everyone',
            rule: 'true',
            type: 'Space',
          },
        },
      });
      const result = await fetchSecurityPolicyDefinition({
        securityPolicyName: 'Everyone',
      });
      expect(axios.get.mock.calls).toEqual([
        [
          'space/app/api/v1/securityPolicyDefinitions/Everyone',
          { params: {}, headers: { 'X-Kinetic-AuthAssumed': 'true' } },
        ],
      ]);
      expect(result).toEqual({
        securityPolicyDefinition: {
          message: 'Everyone is allowed access.',
          name: 'Everyone',
          rule: 'true',
          type: 'Space',
        },
      });
    });
  });

  describe('createSecurityPolicyDefinition', () => {
    beforeEach(() => {
      axios.post.mockReset();
    });

    test('failure kapp scoped security policy def - missing kappSlug', () => {
      expect(() => {
        createSecurityPolicyDefinition({
          securityPolicyDefinition: {
            type: 'Kapp',
          },
        });
      }).toThrowError(
        'createSecurityPolicyDefinition failed! A kappSlug is required when using type: Kapp',
      );
    });

    test('success create security definition space', async () => {
      axios.post.mockResolvedValue({
        status: 200,
        data: {
          securityPolicyDefinition: {
            message: 'Everyone is allowed access.',
            name: 'Everyone',
            rule: 'true',
            type: 'Space',
          },
        },
      });
      const result = await createSecurityPolicyDefinition({
        securityPolicyDefinition: {
          name: 'Everyone',
          message: 'Everyone is allowed access.',
          rule: 'true',
          type: 'Space',
        },
      });
      expect(axios.post.mock.calls).toEqual([
        [
          'space/app/api/v1/securityPolicyDefinitions',
          {
            name: 'Everyone',
            message: 'Everyone is allowed access.',
            rule: 'true',
            type: 'Space',
          },
          { params: {}, headers: { 'X-Kinetic-AuthAssumed': 'true' } },
        ],
      ]);
      expect(result).toEqual({
        securityPolicyDefinition: {
          message: 'Everyone is allowed access.',
          name: 'Everyone',
          rule: 'true',
          type: 'Space',
        },
      });
    });

    test('success create security definition kapp', async () => {
      axios.post.mockResolvedValue({
        status: 200,
        data: {
          securityPolicyDefinition: {
            message: 'Everyone is allowed access.',
            name: 'Everyone',
            rule: 'true',
            type: 'Space',
          },
        },
      });
      const result = await createSecurityPolicyDefinition({
        kappSlug: 'services',
        securityPolicyDefinition: {
          name: 'Everyone',
          message: 'Everyone is allowed access.',
          rule: 'true',
          type: 'Kapp',
        },
      });
      expect(axios.post.mock.calls).toEqual([
        [
          'space/app/api/v1/kapps/services/securityPolicyDefinitions',
          {
            name: 'Everyone',
            message: 'Everyone is allowed access.',
            rule: 'true',
            type: 'Kapp',
          },
          { params: {}, headers: { 'X-Kinetic-AuthAssumed': 'true' } },
        ],
      ]);
      expect(result).toEqual({
        securityPolicyDefinition: {
          message: 'Everyone is allowed access.',
          name: 'Everyone',
          rule: 'true',
          type: 'Space',
        },
      });
    });
  });

  describe('updateSecurityPolicyDefinition', () => {
    beforeEach(() => {
      axios.put.mockReset();
    });

    test('success update security policy definition', async () => {
      axios.put.mockResolvedValue({
        status: 200,
        data: {
          securityPolicyDefinition: {
            message: 'Test Message Update',
            name: 'Everyone',
            rule: 'true',
            type: 'Space',
          },
        },
      });
      const result = await updateSecurityPolicyDefinition({
        securityPolicyName: 'Everyone',
        securityPolicyDefinition: {
          name: 'Everyone',
          message: 'Test Message Update',
          rule: 'true',
          type: 'Space',
        },
      });
      expect(axios.put.mock.calls).toEqual([
        [
          'space/app/api/v1/securityPolicyDefinitions/Everyone',
          {
            name: 'Everyone',
            message: 'Test Message Update',
            rule: 'true',
            type: 'Space',
          },
          { params: {}, headers: { 'X-Kinetic-AuthAssumed': 'true' } },
        ],
      ]);
      expect(result).toEqual({
        securityPolicyDefinition: {
          message: 'Test Message Update',
          name: 'Everyone',
          rule: 'true',
          type: 'Space',
        },
      });
    });
  });
});

import axios from 'axios';

import {
  fetchUser,
  fetchUsers,
  updateUser,
  createUser,
  deleteUser,
} from './users';
import { UserBuilder } from '../../../tests/utils/user_builder';
import {
  rejectPromiseWith,
  resolvePromiseWith,
} from '../../../tests/utils/promises';

// Mock out the bundle object from a dependency.
jest.mock('../../helpers', () => ({
  bundle: {
    apiLocation: () => 'user/app/api/v1',
    kappSlug: () => 'mock-kapp',
  },
}));

describe('users api', () => {
  describe('#fetchUsers', () => {
    describe('when successful', () => {
      let response;
      let testUser;

      beforeEach(() => {
        response = {
          status: 200,
          data: {
            users: [],
          },
        };
        testUser = new UserBuilder()
          .stub()
          .withAttribute('Attribute', 'value')
          .build();
        response.data.users.push(testUser);
        axios.get = resolvePromiseWith(response);
      });

      test('does not return errors', () => {
        expect.assertions(1);
        return fetchUsers().then(({ errors }) => {
          expect(errors).toBeUndefined();
        });
      });

      test('returns an array of users', () => {
        expect.assertions(2);
        return fetchUsers().then(({ users }) => {
          expect(users).toBeInstanceOf(Array);
          expect(users[0]).toMatchObject({
            username: testUser.username,
            displayName: testUser.displayName,
          });
        });
      });

      test('returns attributes', () => {
        expect.assertions(2);
        return fetchUsers({ xlatAttributes: true }).then(({ users }) => {
          expect(users[0].attributes).toBeDefined();
          expect(users[0].attributes).toBeInstanceOf(Array);
        });
      });
    });
  });

  describe('#fetchUser', () => {
    describe('when successful', () => {
      let response;
      let testUser;
      let username;

      beforeEach(() => {
        response = {
          status: 200,
          data: {
            user: {},
          },
        };
        testUser = new UserBuilder()
          .stub()
          .withAttribute('Attribute', 'value')
          .build();
        username = testUser.username;
        response.data.user = testUser;
        axios.get = resolvePromiseWith(response);
      });

      test('does not return errors', () => {
        expect.assertions(1);
        return fetchUser({ username }).then(({ errors }) => {
          expect(errors).toBeUndefined();
        });
      });

      test('returns a user', () => {
        expect.assertions(1);
        return fetchUser({ username }).then(({ user }) => {
          expect(user).toMatchObject({
            username: testUser.username,
            displayName: testUser.displayName,
          });
        });
      });

      test('returns attributes', () => {
        expect.assertions(2);
        return fetchUser({ username }).then(({ user }) => {
          expect(user.attributes).toBeDefined();
          expect(user.attributes).toBeInstanceOf(Array);
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

      test('throws an exception when no user slug is provided', () => {
        expect(() => {
          fetchUser({});
        }).toThrow();
      });

      test('does return errors', () => {
        expect.assertions(1);
        return fetchUser({ username: 'fake' }).then(({ error }) => {
          expect(error).toBeDefined();
        });
      });
    });
  });

  describe('#updateUser', () => {
    describe('when successful', () => {
      let response;
      let testUser;
      let username;

      beforeEach(() => {
        response = {
          status: 200,
          data: {
            user: {},
          },
        };
        testUser = new UserBuilder()
          .stub()
          .withAttribute('Attribute', 'value')
          .build();
        username = testUser.username;
        response.data.user = testUser;
        axios.put = resolvePromiseWith(response);
      });

      test('does not return errors', () => {
        expect.assertions(1);
        return updateUser({ username, user: testUser }).then(({ error }) => {
          expect(error).toBeUndefined();
        });
      });

      test('returns a user', () => {
        expect.assertions(1);
        return updateUser({ username, user: testUser }).then(({ user }) => {
          expect(user).toMatchObject({
            username: testUser.username,
            displayName: testUser.displayName,
          });
        });
      });

      test('returns attributes', () => {
        expect.assertions(2);
        return updateUser({ username, user: testUser }).then(({ user }) => {
          expect(user.attributes).toBeDefined();
          expect(user.attributes).toBeInstanceOf(Array);
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
        axios.put = rejectPromiseWith({ response });
      });

      test('throws an exception when no user slug is provided', () => {
        expect(() => {
          updateUser({ user: {} });
        }).toThrow();
      });

      test('throws an exception when no user object is provided', () => {
        expect(() => {
          updateUser({ username: 'fake' });
        }).toThrow();
      });

      test('does return errors', () => {
        expect.assertions(1);
        return updateUser({ username: 'fake', user: {} }).then(({ error }) => {
          expect(error).toBeDefined();
        });
      });
    });
  });

  describe('#createUser', () => {
    describe('when successful', () => {
      let response;
      let testUser;

      beforeEach(() => {
        response = {
          status: 200,
          data: {
            user: {},
          },
        };
        testUser = new UserBuilder()
          .stub()
          .withAttribute('Attribute', 'value')
          .build();
        response.data.user = testUser;
        axios.post = resolvePromiseWith(response);
      });

      test('does not return errors', () => {
        expect.assertions(1);
        return createUser({ user: testUser }).then(({ error }) => {
          expect(error).toBeUndefined();
        });
      });

      test('returns a user', () => {
        expect.assertions(1);
        return createUser({ user: testUser }).then(({ user }) => {
          expect(user).toMatchObject({
            username: testUser.username,
            displayName: testUser.displayName,
          });
        });
      });

      test('returns attributes', () => {
        expect.assertions(2);
        return createUser({ user: testUser }).then(({ user }) => {
          expect(user.attributes).toBeDefined();
          expect(user.attributes).toBeInstanceOf(Array);
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
        axios.post = rejectPromiseWith({ response });
      });

      test('throws an exception when no user object is provided', () => {
        expect(() => {
          createUser({});
        }).toThrow();
      });

      test('does return errors', () => {
        expect.assertions(1);
        return createUser({ user: {} }).then(({ error }) => {
          expect(error).toBeDefined();
        });
      });
    });
  });

  describe('#deleteUser', () => {
    describe('when successful', () => {
      let response;
      const username = 'testuser';

      beforeEach(() => {
        response = {
          status: 200,
          data: {},
        };
        axios.delete = resolvePromiseWith(response);
      });

      test('does not return errors', () => {
        expect.assertions(1);
        return deleteUser({ username }).then(({ error }) => {
          expect(error).toBeUndefined();
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
        axios.delete = rejectPromiseWith({ response });
      });

      test('throws an exception when no username is provided', () => {
        expect(() => {
          deleteUser({});
        }).toThrow();
      });

      test('does return errors', () => {
        expect.assertions(1);
        return deleteUser({ username: 'fake' }).then(({ error }) => {
          expect(error).toBeDefined();
        });
      });
    });
  });
});

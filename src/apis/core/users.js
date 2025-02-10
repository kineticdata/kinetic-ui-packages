import axios from 'axios';
import { bundle } from '../../helpers';
import { handleErrors, paramBuilder, headerBuilder } from '../http';

export const fetchUsers = (options = {}) => {
  const { spaceSlug } = options;
  // Build URL and fetch the space.
  return axios
    .get(
      options.spaceSlug
        ? `/app/system-coordinator/components/core/app/api/v1/spaces/${spaceSlug}/users`
        : `${bundle.apiLocation()}/users`,
      {
        params: paramBuilder(options),
        headers: headerBuilder(options),
      },
    )
    .then(response => ({
      users: response.data.users,
      count: response.data.count,
      nextPageToken: response.data.nextPageToken,
    }))
    .catch(handleErrors);
};

export const fetchUser = (options = {}) => {
  const { username, spaceSlug } = options;

  if (!username) {
    throw new Error('fetchUser failed! The option "username" is required.');
  }

  // Build URL and fetch the space.
  return axios
    .get(
      spaceSlug
        ? `/app/system-coordinator/components/core/app/api/v1/spaces/${spaceSlug}/users/${encodeURIComponent(
            username,
          )}`
        : `${bundle.apiLocation()}/users/${encodeURIComponent(username)}`,
      {
        params: paramBuilder(options),
        headers: headerBuilder(options),
      },
    )
    .then(response => ({ user: response.data.user }))
    .catch(handleErrors);
};

export const updateUser = (options = {}) => {
  const { spaceSlug, username, user } = options;

  if (!username) {
    throw new Error('fetchUser failed! The option "username" is required.');
  }

  if (!user) {
    throw new Error('fetchUser failed! The option "user" is required.');
  }

  // Build URL and fetch the space.
  return axios
    .put(
      spaceSlug
        ? `/app/system-coordinator/components/core/app/api/v1/spaces/${spaceSlug}/users/${encodeURIComponent(
            username,
          )}`
        : `${bundle.apiLocation()}/users/${encodeURIComponent(username)}`,
      user,
      {
        params: paramBuilder(options),
        headers: headerBuilder(options),
      },
    )
    .then(response => ({ user: response.data.user }))
    .catch(handleErrors);
};

export const createUser = (options = {}) => {
  const { spaceSlug, user } = options;

  if (!user) {
    throw new Error('createUser failed! The option "user" is required.');
  }

  // Build URL and fetch the space.
  return axios
    .post(
      spaceSlug
        ? `/app/system-coordinator/components/core/app/api/v1/spaces/${spaceSlug}/users`
        : `${bundle.apiLocation()}/users`,
      user,
      {
        params: paramBuilder(options),
        headers: headerBuilder(options),
      },
    )
    .then(response => ({ user: response.data.user }))
    .catch(handleErrors);
};

export const deleteUser = (options = {}) => {
  const { spaceSlug, username } = options;

  if (!username) {
    throw new Error('deleteUser failed! The option "username" is required.');
  }

  // Build URL and delete the user.
  return axios
    .delete(
      spaceSlug
        ? `/app/system-coordinator/components/core/app/api/v1/spaces/${spaceSlug}/users/${encodeURIComponent(
            username,
          )}`
        : `${bundle.apiLocation()}/users/${encodeURIComponent(username)}`,
      {
        params: paramBuilder(options),
        headers: headerBuilder(options),
      },
    )
    .then(response => ({ user: response.data.user }))
    .catch(handleErrors);
};

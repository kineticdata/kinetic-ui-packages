import axios from 'axios';
import { bundle } from '../../helpers';
import { handleErrors, paramBuilder, headerBuilder } from '../http';

/**
 * Fetches the current space or a specific space by slug.
 *
 * @param {Object} options - Options for fetching the space.
 * @param {string} [options.slug] - The space slug to retrieve, defaults to the bundle kapp slug.
 * @returns {Promise<{space: Object}>} Resolves with the fetched space object.
 */

export const fetchSpace = (options = {}) => {
  // Build URL and fetch the space.
  return axios
    .get(
      options.slug
        ? `/app/system-coordinator/components/core/app/api/v1/spaces/${
            options.slug
          }`
        : `${bundle.apiLocation()}/space`,
      {
        params: paramBuilder(options),
        headers: headerBuilder(options),
      },
    )
    .then(response => ({ space: response.data.space }))
    .catch(handleErrors);
};

/**
 * Updates a space with the provided space object.
 *
 * @param {Object} options - Options for updating the space.
 * @param {Object} options.space - The space object containing updated values.
 * @param {string} [options.slug] -  The space slug to retrieve, defaults to the bundle kapp slug.
 * @returns {Promise<{space: Object}>}
 */

export const updateSpace = (options = {}) => {
  const { space } = options;
  if (!space) {
    throw new Error('updateSpace failed! The option "space" is required.');
  }

  return axios
    .put(
      options.slug
        ? `/app/system-coordinator/components/core/app/api/v1/spaces/${
            options.slug
          }`
        : `${bundle.apiLocation()}/space`,
      space,
      {
        params: paramBuilder(options),
        headers: headerBuilder(options),
      },
    )
    .then(response => ({ space: response.data.space }))
    .catch(handleErrors);
};

import axios from 'axios';
import { bundle } from '../../helpers';
import { handleErrors, headerBuilder, paramBuilder } from '../http';

/**
 * Fetch a list of kapps.
 *
 * @param {object} options - Options to configure the call to fetch kapps
 * @param {string} options.kappSlug - The kapp slug to retrieve, defaults to the bundle kapp slug.
 * @param {string} options.include - Additional data to include in the response
 * @param {boolean} options.public - When true, do not send X-Kinetic-AuthAssumed header.
 * @returns {Promise<{kapp: *}>}
 */

export const fetchKapps = (options = {}) => {
  // Build URL and fetch the space.
  return axios
    .get(`${bundle.apiLocation()}/kapps`, {
      params: paramBuilder(options),
      headers: headerBuilder(options),
    })
    .then(response => ({
      kapps: response.data.kapps,
      count: response.data.count,
      nextPageToken: response.data.nextPageToken,
    }))
    .catch(handleErrors);
};

/**
 * Fetch a single kapp.
 *
 * @param {object} options - Options to configure the call to fetch kapps
 * @param {string} options.kappSlug - The kapp slug to retrieve, defaults to the bundle kapp slug.
 * @param {string} options.include - Additional data to include in the response
 * @param {boolean} options.public - When true, do not send X-Kinetic-AuthAssumed header.
 * @returns {Promise<{kapp: *}>}
 */

export const fetchKapp = (options = {}) => {
  const { kappSlug = bundle.kappSlug() } = options;

  // Build URL and fetch the space.
  return axios
    .get(`${bundle.apiLocation()}/kapps/${kappSlug}`, {
      params: paramBuilder(options),
      headers: headerBuilder(options),
    })
    .then(response => ({ kapp: response.data.kapp }))
    .catch(handleErrors);
};

/**
 * Updates an existing kapp.
 *
 * @param {Object} options - Options for updating the kapp.
 * @param {string} [options.kappSlug] - The slug of the kapp to update. Defaults to the bundle kapp slug.
 * @param {Object} options.kapp - The kapp object containing updated values.
 * @returns {Promise<{kapp: *}>}
 */

export const updateKapp = (options = {}) => {
  const { kappSlug = bundle.kappSlug(), kapp } = options;
  if (!kappSlug) {
    throw new Error('updateKapp failed! The option "kappSlug" is required.');
  }
  if (!kapp) {
    throw new Error('updateKapp failed! The option "kapp" is required.');
  }

  return axios
    .put(`${bundle.apiLocation()}/kapps/${kappSlug}`, kapp, {
      params: paramBuilder(options),
      headers: headerBuilder(options),
    })
    .then(response => ({ kapp: response.data.kapp }))
    .catch(handleErrors);
};

/**
 * Creates a new kapp.
 *
 * @param {Object} options - Options for creating the kapp.
 * @param {Object} options.kapp - The kapp object to be created.
 * @returns {Promise<{kapp: *}>}
 */

export const createKapp = (options = {}) => {
  const { kapp } = options;
  if (!kapp) {
    throw new Error('createKapp failed! The option "kapp" is required.');
  }

  return axios
    .post(`${bundle.apiLocation()}/kapps`, kapp, {
      params: paramBuilder(options),
      headers: headerBuilder(options),
    })
    .then(response => ({ kapp: response.data.kapp }))
    .catch(handleErrors);
};

/**
 * Deletes a kapp.
 *
 * @param {Object} options - Options for deleting the kapp.
 * @param {string} options.kappSlug - The slug of the kapp to delete.
 * @returns {Promise<{kapp: *}>}
 */

export const deleteKapp = (options = {}) => {
  const { kappSlug } = options;
  if (!kappSlug) {
    throw new Error('deleteKapp failed! The option "kappSlug" is required.');
  }

  return axios
    .delete(`${bundle.apiLocation()}/kapps/${kappSlug}`, {
      params: paramBuilder(options),
      headers: headerBuilder(options),
    })
    .then(response => ({ kapp: response.data.kapp }))
    .catch(handleErrors);
};

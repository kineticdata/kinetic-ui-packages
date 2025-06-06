import axios from 'axios';
import { bundle } from '../../helpers';
import { handleErrors, paramBuilder, headerBuilder } from '../http';

const getPath = (kappSlug, formSlug) => {
  const formSuffix = formSlug ? `/${formSlug}` : '';
  return kappSlug
    ? `${bundle.apiLocation()}/kapps/${kappSlug}/forms${formSuffix}`
    : // Default kapp to 'datastore' if not provided to support deprecated datastore functionality
      `${bundle.apiLocation()}/kapps/datastore/forms${formSuffix}`;
};

/**
 * Retrieves all forms in the specified kapp.
 *
 * @param {Object} [options] - Options for the request.
 * @param {string} [options.kappSlug] - The slug of the kapp. Defaults to 'datastore'.
 * @returns {Promise<{forms: *, count: number, nextPageToken: string}>}
 */

// TODO: datastore is deprecated, remove datastore routes from paths.
export const fetchForms = (options = {}) => {
  const { kappSlug } = options;

  const path = getPath(kappSlug);

  // Build URL and fetch the space.
  return axios
    .get(path, {
      params: paramBuilder(options),
      headers: headerBuilder(options),
    })
    .then(response => ({
      forms: response.data.forms,
      count: response.data.count,
      nextPageToken: response.data.nextPageToken,
    }))
    .catch(handleErrors);
};

/**
 * Retrieves a single form by slug from the specified kapp.
 *
 * @param {Object} options - Options for the request.
 * @param {string} options.formSlug - The slug of the form to retrieve.
 * @param {string} [options.kappSlug] - The slug of the kapp. Defaults to 'datastore'.
 * @returns {Promise<{form: *}>}
 */

export const fetchForm = (options = {}) => {
  const { kappSlug, formSlug } = options;

  if (!formSlug) {
    throw new Error('fetchForm failed! The option "formSlug" is required.');
  }

  const path = getPath(kappSlug, formSlug);

  // Build URL and fetch the space.
  return axios
    .get(path, {
      params: paramBuilder(options),
      headers: headerBuilder(options),
    })
    .then(response => ({ form: response.data.form }))
    .catch(handleErrors);
};

/**
 * Creates a new form in the specified kapp.
 *
 * @param {Object} options - Options for the request.
 * @param {Object} options.form - The form definition to create.
 * @param {string} [options.kappSlug] - The slug of the kapp. Defaults to 'datastore'.
 * @returns {Promise<{form: *}>}
 */

export const createForm = (options = {}) => {
  const { kappSlug, form } = options;
  if (!form) {
    throw new Error('createForm failed! The option "form" is required.');
  }

  const path = getPath(kappSlug);

  return axios
    .post(path, form, {
      params: paramBuilder(options),
      headers: headerBuilder(options),
    })
    .then(response => ({ form: response.data.form }))
    .catch(handleErrors);
};

/**
 * Updates an existing form in the specified kapp.
 *
 * @param {Object} options - Options for the request.
 * @param {string} options.formSlug - The slug of the form to update.
 * @param {Object} options.form - The form object with updated values.
 * @param {string} [options.kappSlug] - The slug of the kapp. Defaults to 'datastore'.
 * @returns {Promise<{form: *}>}
 */

export const updateForm = (options = {}) => {
  const { kappSlug, formSlug, form } = options;
  if (!formSlug) {
    throw new Error('updateForm failed! The option "formSlug" is required.');
  }
  if (!form) {
    throw new Error('updateForm failed! The option "form" is required.');
  }

  const path = getPath(kappSlug, formSlug);

  return axios
    .put(path, form, {
      params: paramBuilder(options),
      headers: headerBuilder(options),
    })
    .then(response => ({ form: response.data.form }))
    .catch(handleErrors);
};

/**
 * Deletes a form by slug from the specified kapp.
 *
 * @param {Object} options - Options for the request.
 * @param {string} options.formSlug - The slug of the form to delete.
 * @param {string} [options.kappSlug] - The slug of the kapp. Defaults to 'datastore'.
 * @returns {Promise<{form: *}>}
 */

export const deleteForm = (options = {}) => {
  const { kappSlug, formSlug } = options;
  if (!formSlug) {
    throw new Error('deleteForm failed! The option "formSlug" is required.');
  }

  const path = getPath(kappSlug, formSlug);

  return axios
    .delete(path, {
      params: paramBuilder(options),
      headers: headerBuilder(options),
    })
    .then(response => ({ form: response.data.form }))
    .catch(handleErrors);
};

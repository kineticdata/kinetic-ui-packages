import axios from 'axios';
import { bundle } from '../../helpers';
import { handleErrors, paramBuilder, headerBuilder } from '../http';

const getPath = (kappSlug, formSlug) => {
  const formSuffix = formSlug ? `/${formSlug}` : '';
  return kappSlug
    ? `${bundle.apiLocation()}/kapps/${kappSlug}/forms${formSuffix}`
    // Default kapp to 'datastore' if not provided to support deprecated datastore functionality
    : `${bundle.apiLocation()}/kapps/datastore/forms${formSuffix}`;
};

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

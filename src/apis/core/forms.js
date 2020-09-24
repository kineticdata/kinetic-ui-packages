import axios from 'axios';
import { bundle } from '../../helpers';
import { handleErrors, paramBuilder, headerBuilder } from '../http';

export const fetchForms = (options = {}) => {
  const { kappSlug } = options;

  const path = kappSlug
    ? `${bundle.apiLocation()}/kapps/${kappSlug}/forms`
    : `${bundle.apiLocation()}/forms`;

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

  const path = kappSlug
    ? `${bundle.apiLocation()}/kapps/${kappSlug}/forms/${formSlug}`
    : `${bundle.apiLocation()}/forms/${formSlug}`;

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
  const { kappSlug = bundle.kappSlug(), form, datastore } = options;
  if (!kappSlug && !datastore) {
    throw new Error('createForm failed! The option "kappSlug" is required.');
  }
  if (!form) {
    throw new Error('createForm failed! The option "form" is required.');
  }

  const path = kappSlug
    ? `${bundle.apiLocation()}/kapps/${kappSlug}/forms`
    : `${bundle.apiLocation()}/datastore/forms`;

  return axios
    .post(path, form, {
      params: paramBuilder(options),
      headers: headerBuilder(options),
    })
    .then(response => ({ form: response.data.form }))
    .catch(handleErrors);
};

export const updateForm = (options = {}) => {
  const { kappSlug = bundle.kappSlug(), formSlug, form, datastore } = options;
  if (!kappSlug && !datastore) {
    throw new Error('updateForm failed! The option "kappSlug" is required.');
  }
  if (!formSlug) {
    throw new Error('updateForm failed! The option "formSlug" is required.');
  }
  if (!form) {
    throw new Error('updateForm failed! The option "form" is required.');
  }

  const path = datastore
    ? `${bundle.apiLocation()}/datastore/forms/${formSlug}`
    : `${bundle.apiLocation()}/kapps/${kappSlug}/forms/${formSlug}`;

  return axios
    .put(path, form, {
      params: paramBuilder(options),
      headers: headerBuilder(options),
    })
    .then(response => ({ form: response.data.form }))
    .catch(handleErrors);
};

export const deleteForm = (options = {}) => {
  const { kappSlug = bundle.kappSlug(), formSlug, datastore } = options;
  if (!kappSlug && !datastore) {
    throw new Error('deleteForm failed! The option "kappSlug" is required.');
  }
  if (!formSlug) {
    throw new Error('deleteForm failed! The option "formSlug" is required.');
  }

  const path = datastore
    ? `${bundle.apiLocation()}/datastore/forms/${formSlug}`
    : `${bundle.apiLocation()}/kapps/${kappSlug}/forms/${formSlug}`;

  return axios
    .delete(path, {
      params: paramBuilder(options),
      headers: headerBuilder(options),
    })
    .then(response => ({ form: response.data.form }))
    .catch(handleErrors);
};

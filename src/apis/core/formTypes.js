import axios from 'axios';
import { bundle } from '../../helpers';
import { handleErrors, headerBuilder, paramBuilder } from '../http';

const buildEndpoint = ({ kappSlug = bundle.kappSlug(), name }) =>
  name
    ? `${bundle.apiLocation()}/kapps/${kappSlug}/formTypes/${encodeURIComponent(
        name,
      )}`
    : `${bundle.apiLocation()}/kapps/${kappSlug}/formTypes`;

export const fetchFormTypes = (options = {}) => {
  // Build URL and fetch the form types.
  return axios
    .get(buildEndpoint(options), {
      params: paramBuilder(options),
      headers: headerBuilder(options),
    })
    .then(response => ({
      formTypes: response.data.formTypes,
    }))
    .catch(handleErrors);
};

export const fetchFormType = (options = {}) => {
  const { name } = options;

  if (!name) {
    throw new Error('fetchFormType failed! The option "name" is required.');
  }

  // Build URL and fetch the form type.
  return axios
    .get(buildEndpoint(options), {
      params: paramBuilder(options),
      headers: headerBuilder(options),
    })
    .then(response => ({ formType: response.data.formType }))
    .catch(handleErrors);
};

export const createFormType = (options = {}) => {
  const { formType } = options;

  if (!formType) {
    throw new Error(
      'createFormType failed! The option "formType" is required.',
    );
  }

  // Build URL and create the form type.
  return axios
    .post(buildEndpoint(options), formType, {
      params: paramBuilder(options),
      headers: headerBuilder(options),
    })
    .then(response => ({ formType: response.data.formType }))
    .catch(handleErrors);
};

export const updateFormType = (options = {}) => {
  const { formType, name } = options;

  if (!formType) {
    throw new Error(
      'updateCategory failed! The option "category" is required.',
    );
  }

  if (!name) {
    throw new Error(
      'updateCategory failed! The option "categorySlug" is required.',
    );
  }

  // Build URL and update the form type.
  return axios
    .put(buildEndpoint(options), formType, {
      params: paramBuilder(options),
      headers: headerBuilder(options),
    })
    .then(response => ({ formType: response.data.formType }))
    .catch(handleErrors);
};

export const deleteFormType = (options = {}) => {
  // Build URL and delete the form type.
  return axios
    .delete(buildEndpoint(options), {
      params: paramBuilder(options),
      headers: headerBuilder(options),
    })
    .then(response => ({ formType: response.data.formType }))
    .catch(handleErrors);
};

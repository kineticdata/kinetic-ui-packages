import axios from 'axios';
import { bundle } from '../../helpers';
import { handleErrors, headerBuilder, paramBuilder } from '../http';

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

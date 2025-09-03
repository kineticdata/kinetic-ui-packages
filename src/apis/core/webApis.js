import { apiGroup, handleErrors, validateOptions } from '../http';
import axios from 'axios';
import { bundle } from '../../helpers';

export const {
  fetchWebApis,
  fetchWebApi,
  createWebApi,
  updateWebApi,
  deleteWebApi,
} = apiGroup({
  name: 'WebApi',
  dataOption: 'webApi',
  plural: {
    requiredOptions: [],
    url: ({ kappSlug }) =>
      kappSlug ? `/kapps/${kappSlug}/webApis` : `/webApis`,
    transform: response => ({
      webApis: response.data.webApis,
    }),
  },
  singular: {
    requiredOptions: ['slug'],
    url: ({ slug, kappSlug }) =>
      kappSlug ? `/kapps/${kappSlug}/webApis/${slug}` : `/webApis/${slug}`,
    transform: response => ({
      webApi: response.data.webApi,
    }),
  },
});

export const exportWebApi = (options = {}) => {
  validateOptions('exportWebApi', ['slug'], options);
  const { slug, kappSlug } = options;

  return axios
    .get(
      `${bundle.apiLocation()}${kappSlug ? `/kapps/${kappSlug}` : ''}/webApis/${slug}/export`,
    )
    .then(response => ({ webApi: response.data }))
    .catch(handleErrors);
};

export const importWebApi = (options = {}) => {
  validateOptions('importWebApi', ['webApi'], options);
  const { webApi, kappSlug, ...params } = options;
  return axios
    .post(
      `${bundle.apiLocation()}${kappSlug ? `/kapps/${kappSlug}` : ''}/webApiImport`,
      webApi,
      { params },
    )
    .then(response => ({ webApi: response.data }))
    .catch(handleErrors);
};

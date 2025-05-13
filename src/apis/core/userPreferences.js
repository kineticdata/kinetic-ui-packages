import axios from 'axios';
import {
  handleErrors,
  headerBuilder,
  paramBuilder,
  validateOptions,
} from '../http';
import { bundle } from '../../helpers';

export const fetchUserPreferences = (options = {}) =>
  axios
    .get(`${bundle.apiLocation()}/userPreferences`, {
      params: options,
    })
    .then(response => response.data)
    .catch(handleErrors);

export const fetchUserPreference = (options = {}) => {
  validateOptions('updateUserPreference', ['key'], options);
  const { key } = options;

  return axios
    .get(`${bundle.apiLocation()}/userPreferences/${key}`, {
      params: options,
    })
    .then(response => response.data)
    .catch(handleErrors);
};

export const upsertUserPreference = (options = {}) => {
  validateOptions('updateUserPreference', ['userPreference'], options);
  const { userPreference } = options;

  return axios
    .post(
      `${bundle.apiLocation()}/userPreferences`,
      { userPreference },
      {
        params: paramBuilder(options),
        headers: headerBuilder(options),
      },
    )
    .then(response => response.data)
    .catch(handleErrors);
};

export const deleteUserPreference = (options = {}) => {
  validateOptions('updateUserPreference', ['key'], options);
  const { key } = options;

  return axios
    .delete(`${bundle.apiLocation()}/userPreferences/${key}`, {
      params: options,
    })
    .then(response => response.data)
    .catch(handleErrors);
};

export const resetUserPreferences = (options = {}) =>
  axios
    .post(`${bundle.apiLocation()}/userPreferences/reset`, null, {
      params: options,
    })
    .then(response => response.data)
    .catch(handleErrors);

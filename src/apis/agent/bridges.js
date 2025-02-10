import axios from 'axios';
import { buildAgentPath } from '../../helpers';
import {
  handleErrors,
  headerBuilder,
  paramBuilder,
  validateOptions,
} from '../http';

export const fetchBridges = (options = {}) => {
  validateOptions('fetchBridges', [], options);
  return axios
    .get(`${buildAgentPath(options)}/app/api/v1/bridges`, {
      params: paramBuilder(options),
      headers: headerBuilder(options),
    })
    .then(response => ({ bridges: response.data.bridges }))
    .catch(handleErrors);
};

export const fetchBridge = (options = {}) => {
  validateOptions('fetchBridge', ['bridgeSlug'], options);
  return axios
    .get(
      `${buildAgentPath(options)}/app/api/v1/bridges/${options.bridgeSlug}`,
      {
        params: paramBuilder(options),
        headers: headerBuilder(options),
      },
    )
    .then(response => ({ bridge: response.data.bridge }))
    .catch(handleErrors);
};

export const createBridge = (options = {}) => {
  validateOptions('createBridge', ['bridge'], options);
  return axios
    .post(`${buildAgentPath(options)}/app/api/v1/bridges/`, options.bridge, {
      params: paramBuilder(options),
      headers: headerBuilder(options),
    })
    .then(response => ({ bridge: response.data.bridge }))
    .catch(handleErrors);
};

export const updateBridge = (options = {}) => {
  validateOptions('updateBridge', ['bridgeSlug', 'bridge'], options);
  return axios
    .put(
      `${buildAgentPath(options)}/app/api/v1/bridges/${options.bridgeSlug}`,
      options.bridge,
      { params: paramBuilder(options), headers: headerBuilder(options) },
    )
    .then(response => ({ bridge: response.data.bridge }))
    .catch(handleErrors);
};

export const deleteBridge = (options = {}) => {
  validateOptions('deleteBridge', ['bridgeSlug'], options);
  return axios
    .delete(
      `${buildAgentPath(options)}/app/api/v1/bridges/${options.bridgeSlug}`,
      {
        params: paramBuilder(options),
        headers: headerBuilder(options),
      },
    )
    .then(response => ({ bridge: response.data.bridge }))
    .catch(handleErrors);
};

export const validateBridge = (options = {}) => {
  validateOptions('validateBridge', ['bridge'], options);
  const endpoint =
    buildAgentPath(options) +
    (options.bridgeSlug
      ? `/app/api/v1/bridges/${options.bridgeSlug}/validate`
      : `/app/api/v1/adapters/validate?type=bridge`);
  return axios
    .post(endpoint, options.bridge, {
      params: paramBuilder(options),
      headers: headerBuilder(options),
    })
    .then(response => ({ successMessage: response.data.message }))
    .catch(handleErrors);
};

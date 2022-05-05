import axios from 'axios';
import { bundle } from '../../helpers';
import {
  handleErrors,
  headerBuilder,
  paramBuilder,
  validateOptions,
} from '../http';

const buildEndpoint = ({ modelName, attributeName }) => {
  const an = encodeURIComponent(attributeName);
  const mn = encodeURIComponent(modelName);
  return attributeName
    ? `${bundle.apiLocation()}/models/${mn}/attributes/${an}`
    : `${bundle.apiLocation()}/models/${mn}/attributes`;
};

export const fetchBridgeModelAttributes = (options = {}) => {
  validateOptions('fetchBridgeModelAttributes', ['modelName'], options);
  return axios
    .get(buildEndpoint(options), {
      params: paramBuilder(options),
      headers: headerBuilder(options),
    })
    .then(response => ({
      bridgeModelAttributes: response.data.attributes,
    }))
    .catch(handleErrors);
};

export const fetchBridgeModelAttribute = (options = {}) => {
  validateOptions(
    'fetchBridgeModelAttribute',
    ['modelName', 'attributeName'],
    options,
  );
  return axios
    .get(buildEndpoint(options), {
      params: paramBuilder(options),
      headers: headerBuilder(options),
    })
    .then(response => ({
      bridgeModelAttribute: response.data.attribute,
    }))
    .catch(handleErrors);
};

export const createBridgeModelAttribute = (options = {}) => {
  validateOptions(
    'createBridgeModelAttribute',
    ['modelName', 'bridgeModelAttribute'],
    options,
  );
  return axios
    .post(buildEndpoint(options), options.bridgeModelAttribute, {
      params: paramBuilder(options),
      headers: headerBuilder(options),
    })
    .then(response => ({
      bridgeModelAttribute: response.data.attribute,
    }))
    .catch(handleErrors);
};

export const updateBridgeModelAttribute = (options = {}) => {
  validateOptions(
    'updateBridgeModelAttribute',
    ['modelName', 'attributeName', 'bridgeModelAttribute'],
    options,
  );

  const { bridgeModelAttribute } = options;
  return axios
    .put(buildEndpoint(options), bridgeModelAttribute, {
      params: paramBuilder(options),
      headers: headerBuilder(options),
    })
    .then(response => ({
      bridgeModelAttribute: response.data.attribute,
    }))
    .catch(handleErrors);
};

export const deleteBridgeModelAttribute = (options = {}) => {
  validateOptions(
    'deleteBridgeModelAttribute',
    ['modelName', 'attributeName'],
    options,
  );
  return axios
    .delete(buildEndpoint(options), {
      params: paramBuilder(options),
      headers: headerBuilder(options),
    })
    .then(response => ({
      bridgeModelAttribute: response.data.attribute,
    }))
    .catch(handleErrors);
};

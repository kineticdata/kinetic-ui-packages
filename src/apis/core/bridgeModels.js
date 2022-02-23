import axios from 'axios';
import { bundle } from '../../helpers';
import {
  handleErrors,
  headerBuilder,
  paramBuilder,
  validateOptions,
} from '../http';

const buildEndpoint = ({ modelName }) => {
  const mn = encodeURIComponent(modelName);

  return modelName
    ? `${bundle.apiLocation()}/models/${mn}`
    : `${bundle.apiLocation()}/models`;
};

export const fetchBridgeModels = (options = {}) => {
  return axios
    .get(buildEndpoint(options), {
      params: paramBuilder(options),
      headers: headerBuilder(options),
    })
    .then(response => ({ bridgeModels: response.data.models }))
    .catch(handleErrors);
};

export const fetchBridgeModel = (options = {}) => {
  validateOptions('fetchBridgeModel', ['modelName'], options);
  return axios
    .get(buildEndpoint(options), {
      params: paramBuilder(options),
      headers: headerBuilder(options),
    })
    .then(response => ({ bridgeModel: response.data.model }))
    .catch(handleErrors);
};

const TEST_METHODS = ['retrieve', 'search', 'count'];
export const testBridgeModel = (options = {}) => {
  validateOptions(
    'testBridgeModel',
    ['modelName', 'qualificationName', 'method'],
    options,
  );

  const { qualificationName, attributes = [] } = options;
  const method = TEST_METHODS.includes(options.method)
    ? options.method
    : 'retrieve';
  const parameters = options.parameters.reduce((params, parameter) => {
    params[`parameters[${parameter.name}]`] = parameter.value;
    return params;
  }, {});
  return axios
    .post(
      `${buildEndpoint(options)}/qualifications/${encodeURIComponent(
        qualificationName,
      )}/${encodeURIComponent(method)}`,
      null,
      {
        params: {
          ...paramBuilder(options),
          attributes: attributes.join(','),
          ...parameters,
        },
        headers: headerBuilder(options),
      },
    )
    .catch(handleErrors);
};

export const createBridgeModel = (options = {}) => {
  validateOptions('createBridgeModel', ['bridgeModel'], options);
  return axios
    .post(buildEndpoint(options), options.bridgeModel, {
      params: paramBuilder(options),
      headers: headerBuilder(options),
    })
    .then(response => ({ bridgeModel: response.data.model }))
    .catch(handleErrors);
};

export const updateBridgeModel = (options = {}) => {
  validateOptions('updateBridgeModel', ['modelName', 'bridgeModel'], options);
  return axios
    .put(buildEndpoint(options), options.bridgeModel, {
      params: paramBuilder(options),
      headers: headerBuilder(options),
    })
    .then(response => ({ bridgeModel: response.data.model }))
    .catch(handleErrors);
};

export const deleteBridgeModel = (options = {}) => {
  validateOptions('deleteBridgeModel', ['modelName'], options);
  return axios
    .delete(buildEndpoint(options), {
      params: paramBuilder(options),
      headers: headerBuilder(options),
    })
    .then(response => ({ bridgeModel: response.data.model }))
    .catch(handleErrors);
};

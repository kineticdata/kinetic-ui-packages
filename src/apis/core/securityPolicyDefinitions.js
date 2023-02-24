import axios from 'axios';
import { bundle } from '../../helpers';
import { handleErrors, headerBuilder, paramBuilder } from '../http';

const validateOptions = (functionName, requiredOptions, options) => {
  const { kappSlug, securityPolicyDefinition = {} } = options;
  const typesRequiringKapp = ['Kapp', 'Form', 'Submission'];
  const kappSlugMissing =
    typesRequiringKapp.includes(securityPolicyDefinition.type) && !kappSlug;

  const missing = requiredOptions.filter(
    requiredOption => !options[requiredOption],
  );

  if (missing.length > 0) {
    throw new Error(
      `${functionName} failed! The following required options are missing: ${missing}`,
    );
  }
  if (kappSlugMissing) {
    throw new Error(
      `${functionName} failed! A kappSlug is required when using type: ${
        securityPolicyDefinition.type
      }`,
    );
  }
};

const buildEndpoint = ({ kappSlug, securityPolicyName }) => {
  const basePath = kappSlug
    ? `${bundle.apiLocation()}/kapps/${kappSlug}/securityPolicyDefinitions`
    : `${bundle.apiLocation()}/securityPolicyDefinitions`;
  return securityPolicyName
    ? `${basePath}/${encodeURIComponent(securityPolicyName)}`
    : basePath;
};

export const fetchSecurityPolicyDefinitions = (options = {}) => {
  validateOptions('fetchSecurityPolicyDefinitions', [], options);
  return axios
    .get(buildEndpoint(options), {
      params: paramBuilder(options),
      headers: headerBuilder(options),
    })
    .then(response => ({
      securityPolicyDefinitions: response.data.securityPolicyDefinitions,
    }))
    .catch(handleErrors);
};

export const fetchSecurityPolicyDefinition = (options = {}) => {
  validateOptions(
    'fetchSecurityPolicyDefinition',
    ['securityPolicyName'],
    options,
  );
  return axios
    .get(buildEndpoint(options), {
      params: paramBuilder(options),
      headers: headerBuilder(options),
    })
    .then(response => ({
      securityPolicyDefinition: response.data.securityPolicyDefinition,
    }))
    .catch(handleErrors);
};

export const createSecurityPolicyDefinition = (options = {}) => {
  const { kappSlug, securityPolicyDefinition } = options;
  validateOptions(
    'createSecurityPolicyDefinition',
    ['securityPolicyDefinition'],
    options,
  );
  // For Creates, we don't append the name to the basePath (it goes in the body)
  // so not using the buildEndpoint function
  const basePath = kappSlug
    ? `${bundle.apiLocation()}/kapps/${kappSlug}/securityPolicyDefinitions`
    : `${bundle.apiLocation()}/securityPolicyDefinitions`;
  return axios
    .post(basePath, securityPolicyDefinition, {
      params: paramBuilder(options),
      headers: headerBuilder(options),
    })
    .then(response => ({
      securityPolicyDefinition: response.data.securityPolicyDefinition,
    }))
    .catch(handleErrors);
};

export const updateSecurityPolicyDefinition = (options = {}) => {
  const { securityPolicyDefinition } = options;
  validateOptions(
    'updateSecurityPolicyDefinition',
    ['securityPolicyName', 'securityPolicyDefinition'],
    options,
  );
  return axios
    .put(buildEndpoint(options), securityPolicyDefinition, {
      params: paramBuilder(options),
      headers: headerBuilder(options),
    })
    .then(response => ({
      securityPolicyDefinition: response.data.securityPolicyDefinition,
    }))
    .catch(handleErrors);
};

export const deleteSecurityPolicyDefinition = (options = {}) => {
  validateOptions(
    'deleteSecurityPolicyDefinition',
    ['securityPolicyName'],
    options,
  );
  return axios
    .delete(buildEndpoint(options), {
      params: paramBuilder(options),
      headers: headerBuilder(options),
    })
    .then(response => ({
      securityPolicyDefinition: response.data.securityPolicyDefinition,
    }))
    .catch(handleErrors);
};

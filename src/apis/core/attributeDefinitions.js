import axios from 'axios';
import { bundle } from '../../helpers';
import { handleErrors, headerBuilder, paramBuilder } from '../http';

// The API returns the singular name of the attribute type, so we remove the "s",
// except for userProfileAttributeDefinitions and datastoreFormAttributeDefinitions
// TODO: KCORE-2982
// TODO: Remove datastoreFormAttributeDefinitions when fully deprecated. See b4a24c6
const responseEnvelope = attributeType =>
  [
    'userProfileAttributeDefinitions',
    'datastoreFormAttributeDefinitions',
  ].includes(attributeType)
    ? attributeType
    : attributeType.replace(/s$/, '');

const validateOptions = (functionName, requiredOptions, options) => {
  const validAttributes = [
    'spaceAttributeDefinitions',
    'teamAttributeDefinitions',
    'userAttributeDefinitions',
    'userProfileAttributeDefinitions',
    'categoryAttributeDefinitions',
    'kappAttributeDefinitions',
    'formAttributeDefinitions',
  ];

  const attributesRequiringKappSlug = [
    'categoryAttributeDefinitions',
    'kappAttributeDefinitions',
  ];

  const kappSlugMissing =
    attributesRequiringKappSlug.includes(options.attributeType) &&
    !options.kappSlug;

  const invalidType = !validAttributes.includes(options.attributeType);

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
      `${functionName} failed! A kappSlug is required when using ${
        options.attributeType
      }`,
    );
  }
  if (invalidType) {
    throw new Error(
      `${functionName} failed! The provided attributeType (${
        options.attributeType
      }) is not valid`,
    );
  }
};

const buildEndpoint = ({ kappSlug, attributeType: at, attributeName: an }) => {
  const attributeType = encodeURIComponent(at);
  const attributeName = encodeURIComponent(an);

  const basePath = kappSlug
    ? `${bundle.apiLocation()}/kapps/${kappSlug}/${attributeType}`
    : `${bundle.apiLocation()}/${attributeType}`;
  return an ? `${basePath}/${attributeName}` : basePath;
};

export const fetchAttributeDefinitions = (options = {}) => {
  const { attributeType } = options;
  validateOptions('fetchAttributeDefinitions', ['attributeType'], options);
  return axios
    .get(buildEndpoint(options), {
      params: paramBuilder(options),
      headers: headerBuilder(options),
    })
    .then(response => ({ attributeDefinitions: response.data[attributeType] }))
    .catch(handleErrors);
};

export const fetchAttributeDefinition = (options = {}) => {
  const { attributeType } = options;
  validateOptions(
    'fetchAttributeDefinition',
    ['attributeType', 'attributeName'],
    options,
  );

  return axios
    .get(buildEndpoint(options), {
      params: paramBuilder(options),
      headers: headerBuilder(options),
    })
    .then(response => ({
      attributeDefinition: response.data[responseEnvelope(attributeType)],
    }))
    .catch(handleErrors);
};

export const createAttributeDefinition = (options = {}) => {
  const { kappSlug, attributeType, attributeDefinition } = options;
  validateOptions(
    'createAttributeDefinition',
    ['attributeType', 'attributeDefinition'],
    options,
  );

  // The API returns the singular name of the attribute type, so we remove the "s"
  return axios
    .post(buildEndpoint({ kappSlug, attributeType }), attributeDefinition, {
      params: paramBuilder(options),
      headers: headerBuilder(options),
    })
    .then(response => ({
      attributeDefinition: response.data[responseEnvelope(attributeType)],
    }))
    .catch(handleErrors);
};

export const updateAttributeDefinition = (options = {}) => {
  const { attributeType, attributeDefinition } = options;
  validateOptions(
    'updateAttributeDefinition',
    ['attributeType', 'attributeName'],
    options,
  );
  // The API returns the singular name of the attribute type, so we remove the "s"
  return axios
    .put(buildEndpoint(options), attributeDefinition, {
      params: paramBuilder(options),
      headers: headerBuilder(options),
    })
    .then(response => ({
      attributeDefinition: response.data[responseEnvelope(attributeType)],
    }))
    .catch(handleErrors);
};

export const deleteAttributeDefinition = (options = {}) => {
  const { attributeType } = options;
  validateOptions(
    'deleteAttributeDefinition',
    ['attributeType', 'attributeName'],
    options,
  );

  // Build URL and fetch the space.
  return axios
    .delete(buildEndpoint(options), {
      params: paramBuilder(options),
      headers: headerBuilder(options),
    })
    .then(response => ({
      attributeDefinition: response.data[responseEnvelope(attributeType)],
    }))
    .catch(handleErrors);
};

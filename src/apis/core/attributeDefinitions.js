import axios from 'axios';
import { bundle } from '../../helpers';
import { handleErrors, headerBuilder, paramBuilder } from '../http';

// The API returns the singular name of the attribute type, so we remove the "s"
const responseEnvelope = attributeType => attributeType.replace(/s$/, '');

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

/**
 * Fetches all attribute definitions of a given type.
 *
 * @param {Object} options - Options for fetching attribute definitions.
 * @param {string} options.attributeType - The type of attribute definitions to fetch.
 * @param {string} [options.kappSlug] - The slug of the kapp.
 * @returns {Promise<{attributeDefinitions: Object[]}>}
 */

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

/**
 * Fetches a single attribute definition by name.
 *
 * @param {Object} options - Options for fetching the attribute definition.
 * @param {string} options.attributeType - The type of attribute definition.
 * @param {string} options.attributeName - The name of the attribute definition to fetch.
 * @param {string} [options.kappSlug] - The slug of the kapp.
 * @returns {Promise<{attributeDefinition: Object}>}
 */

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
      // The userProfileAttributeDefinition fetch returns a pluralized name
      // instead of the singular name as it should, so we want to check both
      // the singular and plural versions in that case to be backwards
      // compatible when this gets fixed on the server.
      // TODO Remove this check and only keep the responseEvelope once the
      //  server side code is fixed.
      attributeDefinition:
        attributeType !== 'userProfileAttributeDefinitions'
          ? response.data[responseEnvelope(attributeType)]
          : response.data[responseEnvelope(attributeType)] ||
            response.data[attributeType],
    }))
    .catch(handleErrors);
};

/**
 * Creates a new attribute definition.
 *
 * @param {Object} options - Options for creating the attribute definition.
 * @param {string} options.attributeType - The type of attribute definition.
 * @param {Object} options.attributeDefinition - The attribute definition object to create.
 * @param {string} [options.kappSlug] - The slug of the kapp.
 * @returns {Promise<{attributeDefinition: Object}>}
 */

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

/**
 * Updates an existing attribute definition.
 *
 * @param {Object} options - Options for updating the attribute definition.
 * @param {string} options.attributeType - The type of attribute definition.
 * @param {string} options.attributeName - The name of the attribute definition to update.
 * @param {Object} options.attributeDefinition - The updated attribute definition object.
 * @param {string} [options.kappSlug] - The slug of the kapp.
 * @returns {Promise<{attributeDefinition: Object}>}
 */

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

/**
 * Deletes an attribute definition.
 *
 * @param {Object} options - Options for deleting the attribute definition.
 * @param {string} options.attributeType - The type of attribute definition.
 * @param {string} options.attributeName - The name of the attribute definition to delete.
 * @param {string} [options.kappSlug] - The slug of the kapp.
 * @returns {Promise<{attributeDefinition: Object}>}
 */

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

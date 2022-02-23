import axios from 'axios';
import qs from 'qs';
import { bundle } from '../../helpers';
import { handleErrors, headerBuilder } from '../http';

/**
 * Returns the URL to a bridged resource.
 *
 * Note: custom sorting is currently not available in this function because the BridgedResource
 * API doesn't support it.
 *
 * @param {*} options - properties to build the bridged resource url
 * @param {string} options.bridgedResourceName - name of the bridged resource
 * @param {string} options.formSlug - form slug where the bridged resource is defined
 * @param {string} options.kappSlug - kapp slug where the bridged resource is defined
 * @param {string} options.datastore - flag if the bridged resource is defined on a datastore form
 * @returns {string}
 */
export const bridgedResourceUrl = (options, counting = false) => {
  const {
    kappSlug = bundle.kappSlug(),
    datastore,
    formSlug,
    bridgedResourceName,
  } = options;

  if (!formSlug) {
    throw new Error('Property "formSlug" is required.');
  }
  if (!bridgedResourceName) {
    throw new Error('Property "bridgedResourceName" is required.');
  }

  const brn = encodeURIComponent(options.bridgedResourceName);

  // build the url
  let url = datastore
    ? `${bundle.spaceLocation()}/app/datastore/forms/${formSlug}/bridgedResources/${brn}`
    : `${bundle.spaceLocation()}/${kappSlug}/${formSlug}/bridgedResources/${brn}`;
  // append any attributes if they were specified
  if (counting) {
    url += '/count';
  }
  return url;
};

/**
 * Returns the url encoded data to a bridged resource.
 *
 * @param {*} options - properties to build the bridged resource url
 * @param {string[]=} options.attributes - array of attributes (fields) to return
 * @param {number=} options.limit - maximum number of records to retrieve
 * @param {number=} options.offset - offset to retrieve as first record
 * @param {object=} options.values - hash of value names to values
 * @param {object=} options.metadata - hash of metadata names to values
 * @returns {string}
 */
export const bridgedResourceData = options => {
  let data = {};
  // append any attributes if they were specified
  if (options.attributes) {
    if (!Array.isArray(options.attributes)) {
      throw new Error('Property "attributes" expected as array of strings.');
    }
    if (options.attributes.length > 0) {
      data.attributes = options.attributes.join(',');
    }
  }
  // append any parameter values if they were specified
  if (options.values && Object.keys(options.values).length > 0) {
    data.values = options.values;
  }
  // append any metadata if it was specified
  if (options.metadata && Object.keys(options.metadata).length > 0) {
    data.metadata = options.metadata;
  }
  // append the limit if it was specified
  if (options.limit) {
    let limit = options.limit;
    if (!Number.isInteger(limit)) {
      try {
        limit = parseInt(limit, 10);
      } catch (e) {
        throw new Error('Property "limit" expected as a number.');
      }
    }
    data.limit = limit;
  }
  // append the offset if it was specified
  if (options.offset) {
    let offset = options.offset;
    if (!Number.isInteger(offset)) {
      try {
        offset = parseInt(offset, 10);
      } catch (e) {
        throw new Error('Property "offset" expected as a number.');
      }
    }
    data.offset = offset;
  }
  return qs.stringify(data);
};

/**
 * Combines the field names array with the records array to produce an array of objects
 * linking the field name to the field value for each record.
 *
 * @param {String[]} keys - Array of field names to use as object keys
 * @param {Array[]} values - Array of records, which are themselves an array of string values
 * @returns {Object[]} Array of objects linking the field name to the field value of each record.
 */
export const arraysToObject = (keys, values) =>
  values.map(value =>
    keys.reduce((object, key, keyIndex) => {
      const o = object;
      o[key] = value[keyIndex];
      return o;
    }, {}),
  );

/**
 * Converts the results from a Bridged Resource response that contains multiple records.
 *
 * A bridged resource that is configured to return multiple results separates the field names
 * from the record data.  This is done to reduce the amount of bandwidth the response uses, but
 * it is not the ideal format to work with.
 *
 * This function combines the field names array with the records array to produce an array of
 * objects linking the field name to the field value for each record.
 *
 * @param {Object} responseJsonRecords - Kinetic Core bridge response parsed from JSON
 * @returns {Object[]} Array of objects linking the field name to the field value of each record.
 */
export const convertMultipleBridgeRecords = responseJsonRecords =>
  arraysToObject(responseJsonRecords.fields, responseJsonRecords.records);

export const fetchBridgedResource = (options = {}) => {
  const { formSlug, bridgedResourceName } = options;

  if (!formSlug) {
    throw new Error('Property "formSlug" is required.');
  }
  if (!bridgedResourceName) {
    throw new Error('Property "bridgedResourceName" is required.');
  }

  return axios
    .post(bridgedResourceUrl(options), bridgedResourceData(options), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        ...headerBuilder(options),
      },
    })
    .then(({ data }) => {
      const { record, records } = data;

      if (record) {
        return { record: record.attributes };
      } else if (records) {
        return {
          records: convertMultipleBridgeRecords(records),
          metadata: {
            count: records.metadata && records.metadata.size,
            nextPageToken: records.metadata && records.metadata.nextPageToken,
          },
        };
      }

      return {
        error: { statusCode: '500', message: 'Invalid server response.' },
      };
    })
    .catch(handleErrors);
};

export const countBridgedResource = (options = {}) => {
  const { formSlug, bridgedResourceName } = options;

  if (!formSlug) {
    throw new Error('Property "formSlug" is required.');
  }
  if (!bridgedResourceName) {
    throw new Error('Property "bridgedResourceName" is required.');
  }

  const counting = true;

  return axios
    .post(bridgedResourceUrl(options, counting), bridgedResourceData(options), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        ...headerBuilder(options),
      },
    })
    .then(({ data }) => ({ count: data.count }))
    .catch(handleErrors);
};

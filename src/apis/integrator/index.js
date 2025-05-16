import axios from 'axios';
import { handleErrors, validateOptions } from '../http';
import { bundle } from '../../helpers';

/******************************************************************************
 * CONNECTIONS
 ******************************************************************************/

export const fetchConnections = (options = {}) =>
  axios
    .get(`${bundle.spaceLocation()}/app/integrator/api/connections`, {
      params: options,
    })
    .then(response => ({ connections: response.data }))
    .catch(rawError => {
      const errorResponse = handleErrors(rawError);
      // If response statusCode is 404, then integrator isn't installed so we
      // should return a better message.
      if (errorResponse.error?.statusCode === 404) {
        return {
          error: {
            ...errorResponse.error,
            message: 'Integrator is unavailable.',
          },
        };
      }
      return errorResponse;
    });

export const fetchConnection = (options = {}) => {
  validateOptions('fetchConnection', ['id'], options);
  const { id, ...params } = options;
  return axios
    .get(`${bundle.spaceLocation()}/app/integrator/api/connections/${id}`, {
      params,
    })
    .then(response => ({ connection: response.data }))
    .catch(handleErrors);
};

export const updateConnection = (options = {}) => {
  validateOptions('updateConnection', ['id', 'connection'], options);
  const { id, connection, ...params } = options;
  return axios
    .put(
      `${bundle.spaceLocation()}/app/integrator/api/connections/${id}`,
      connection,
      { params },
    )
    .then(response => ({ connection: response.data }))
    .catch(handleErrors);
};

export const createConnection = (options = {}) => {
  validateOptions('createConnection', ['connection'], options);
  const { connection, ...params } = options;
  return axios
    .post(
      `${bundle.spaceLocation()}/app/integrator/api/connections`,
      connection,
      { params },
    )
    .then(response => ({ connection: response.data }))
    .catch(handleErrors);
};

export const deleteConnection = (options = {}) => {
  validateOptions('deleteConnection', ['id'], options);
  const { id, ...params } = options;
  return axios
    .delete(`${bundle.spaceLocation()}/app/integrator/api/connections/${id}`, {
      params,
    })
    .then(response => ({ connection: response.data }))
    .catch(handleErrors);
};

export const testConnection = (options = {}) => {
  validateOptions('testConnection', ['connection'], options);
  const { connection, id, ...params } = options;
  return axios
    .post(
      `${bundle.spaceLocation()}/app/integrator/api${
        id ? `/connections/${id}` : ''
      }/test`,
      connection,
      { params },
    )
    .then(response => ({ data: response.data }))
    .catch(handleErrors);
};

export const restartConnection = (options = {}) => {
  validateOptions('restartConnection', ['id'], options);
  const { id, ...params } = options;
  return axios
    .post(
      `${bundle.spaceLocation()}/app/integrator/api/connections/${id}/restart`,
      null,
      { params },
    )
    .then(response => ({ data: response.data }))
    .catch(handleErrors);
};

/******************************************************************************
 * OPERATIONS
 ******************************************************************************/

export const fetchOperations = (options = {}) => {
  validateOptions('fetchOperation', ['connectionId'], options);
  const { connectionId, ...params } = options;
  return axios
    .get(
      `${bundle.spaceLocation()}/app/integrator/api/connections/${connectionId}/operations`,
      { params },
    )
    .then(response => ({ operations: response.data }))
    .catch(handleErrors);
};

export const fetchOperation = (options = {}) => {
  validateOptions('fetchOperation', ['connectionId', 'id'], options);
  const { connectionId, id, ...params } = options;
  return axios
    .get(
      `${bundle.spaceLocation()}/app/integrator/api/connections/${connectionId}/operations/${id}`,
      {
        params,
      },
    )
    .then(response => ({ operation: response.data }))
    .catch(handleErrors);
};

export const updateOperation = (options = {}) => {
  validateOptions(
    'updateOperation',
    ['connectionId', 'id', 'operation'],
    options,
  );
  const { connectionId, id, operation, ...params } = options;
  return axios
    .put(
      `${bundle.spaceLocation()}/app/integrator/api/connections/${connectionId}/operations/${id}`,
      operation,
      { params },
    )
    .then(response => ({ operation: response.data }))
    .catch(handleErrors);
};

export const createOperation = (options = {}) => {
  validateOptions('createOperation', ['connectionId', 'operation'], options);
  const { connectionId, operation, ...params } = options;
  return axios
    .post(
      `${bundle.spaceLocation()}/app/integrator/api/connections/${connectionId}/operations`,
      operation,
      { params },
    )
    .then(response => ({ operation: response.data }))
    .catch(handleErrors);
};

export const deleteOperation = (options = {}) => {
  validateOptions('deleteOperation', ['connectionId', 'id'], options);
  const { connectionId, id, ...params } = options;
  return axios
    .delete(
      `${bundle.spaceLocation()}/app/integrator/api/connections/${connectionId}/operations/${id}`,
      {
        params,
      },
    )
    .then(response => ({ operation: response.data }))
    .catch(handleErrors);
};

export const fetchBulkOperations = (options = {}) => {
  validateOptions('fetchBulkOperations', ['ids'], options);
  const { ids, ...params } = options;
  return axios
    .post(
      `${bundle.spaceLocation()}/app/integrator/api/operations-search`,
      { ids },
      { params },
    )
    .then(response => ({ operations: response.data }))
    .catch(handleErrors);
};

export const inspectOperation = (options = {}) => {
  validateOptions('inspectOperation', [['operation', 'operationId']], options);
  const { operation, operationId, ...params } = options;
  return axios
    .post(
      `${bundle.spaceLocation()}/app/integrator/api/inspect`,
      { operation, operationId },
      { params },
    )
    .then(response => ({ detectedInputs: response.data.detectedInputs }))
    .catch(handleErrors);
};

export const executeOperation = (options = {}) => {
  validateOptions(
    'executeOperation',
    [
      ['connection', 'connectionId'],
      ['operation', 'operationId'],
    ],
    options,
  );
  const {
    connection,
    connectionId,
    operation,
    operationId,
    parameters = {},
    ...params
  } = options;
  return axios
    .post(
      `${bundle.spaceLocation()}/app/integrator/api/execute`,
      { connection, connectionId, operation, operationId, parameters },
      { params },
    )
    .then(response => ({ data: response.data }))
    .catch(handleErrors);
};

/******************************************************************************
 * METADATA
 ******************************************************************************/

export const fetchIntegratorVersion = () => {
  return axios
    .get(`${bundle.spaceLocation()}/app/integrator/api/version`)
    .then(response => ({
      version: response.data.version,
    }))
    .catch(handleErrors);
};

export const transformOutputs = (options = {}) => {
  validateOptions('transformOutputs', ['outputs', 'raw'], options);
  const { outputs, raw, ...params } = options;
  return axios
    .post(
      `${bundle.spaceLocation()}/app/integrator/api/transform`,
      { outputs, raw },
      { params },
    )
    .then(response => ({ data: response.data }))
    .catch(handleErrors);
};

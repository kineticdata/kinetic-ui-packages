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
    .catch(handleErrors);

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
  validateOptions('inspectOperation', ['operation'], options);
  const { operation, ...params } = options;
  return axios
    .post(
      `${bundle.spaceLocation()}/app/integrator/api/inspect`,
      { operation },
      { params },
    )
    .then(response => ({ detectedInputs: response.data.detectedInputs }))
    .catch(handleErrors);
};

export const executeOperation = (options = {}) => {
  validateOptions('executeOperation', ['connection', 'operation'], options);
  const { connection, operation, parameters = {}, ...params } = options;
  return axios
    .post(
      `${bundle.spaceLocation()}/app/integrator/api/execute`,
      { connection, operation, parameters },
      { params },
    )
    .then(response => ({ execution: response.data }))
    .catch(handleErrors);
};

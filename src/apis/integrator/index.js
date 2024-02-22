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

export const fetchOperations = (options = {}) =>
  axios
    .get(`${bundle.spaceLocation()}/app/integrator/api/operations`, {
      params: options,
    })
    .then(response => ({ operations: response.data }))
    .catch(handleErrors);

export const fetchOperation = (options = {}) => {
  validateOptions('fetchOperation', ['id'], options);
  const { id, ...params } = options;
  return axios
    .get(`${bundle.spaceLocation()}/app/integrator/api/operations/${id}`, {
      params,
    })
    .then(response => ({ operation: response.data }))
    .catch(handleErrors);
};

export const updateOperation = (options = {}) => {
  validateOptions('updateOperation', ['id', 'operation'], options);
  const { id, operation, ...params } = options;
  return axios
    .put(
      `${bundle.spaceLocation()}/app/integrator/api/operations/${id}`,
      operation,
      { params },
    )
    .then(response => ({ operation: response.data }))
    .catch(handleErrors);
};

export const createOperation = (options = {}) => {
  validateOptions('createOperation', ['operation'], options);
  const { operation, ...params } = options;
  return axios
    .post(
      `${bundle.spaceLocation()}/app/integrator/api/operations`,
      operation,
      { params },
    )
    .then(response => ({ operation: response.data }))
    .catch(handleErrors);
};

export const deleteOperation = (options = {}) => {
  validateOptions('deleteOperation', ['id'], options);
  const { id, ...params } = options;
  return axios
    .delete(`${bundle.spaceLocation()}/app/integrator/api/operations/${id}`, {
      params,
    })
    .then(response => ({ operation: response.data }))
    .catch(handleErrors);
};

export const inspectOperation = (options = {}) => {
  validateOptions('inspectOperation', ['operation'], options);
  const { operation, ...params } = options;
  return axios
    .post(`${bundle.spaceLocation()}/app/integrator/api/inspect`, operation, {
      params,
    })
    .then(response => ({ detectedInputs: response.data.detectedInputs }))
    .catch(handleErrors);
};

/******************************************************************************
 * EXECUTIONS
 ******************************************************************************/

export const runExecution = (options = {}) => {
  validateOptions('runExecution', ['connection', 'operation', 'type'], options);
  const { connection, operation, type, parameters = {}, ...params } = options;
  return axios
    .post(
      `${bundle.spaceLocation()}/app/integrator/api/executions`,
      { connection, operation, type, parameters },
      { params },
    )
    .then(response => ({ execution: response.data }))
    .catch(handleErrors);
};

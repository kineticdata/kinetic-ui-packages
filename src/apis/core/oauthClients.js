import axios from 'axios';
import { bundle } from '../../helpers';
import { handleErrors, paramBuilder, headerBuilder } from '../http';

const buildEndpoint = ({ clientId }) =>
  clientId
    ? `${bundle.apiLocation()}/oauthClients/${encodeURIComponent(clientId)}`
    : `${bundle.apiLocation()}/oauthClients`;

export const fetchOAuthClients = (options = {}) =>
  axios
    .get(buildEndpoint(options), {
      params: { ...paramBuilder(options) },
      headers: headerBuilder(options),
    })
    .then(response => ({
      oauthClients: response.data.oauthClients,
    }))
    .catch(handleErrors);

export const fetchOAuthClient = (options = {}) => {
  const { clientId } = options;
  if (!clientId) {
    throw new Error(
      'fetchOAuthClient failed! The option "clientId" is required.',
    );
  }

  return axios
    .get(buildEndpoint(options), {
      params: { ...paramBuilder(options) },
      headers: headerBuilder(options),
    })
    .then(response => ({
      client: response.data.client,
    }))
    .catch(handleErrors);
};

export const updateOAuthClient = (options = {}) => {
  const { clientId, client } = options;

  if (!clientId) {
    throw new Error(
      'updateOAuthClient failed! The option "clientId" is required.',
    );
  }

  if (!client) {
    throw new Error(
      'updateOAuthClient failed! The option "client" is required.',
    );
  }

  // Build URL and fetch the space.
  return axios
    .put(buildEndpoint(options), client, {
      params: paramBuilder(options),
      headers: headerBuilder(options),
    })
    .then(response => ({ client: response.data.client }))
    .catch(handleErrors);
};

export const createOAuthClient = (options = {}) => {
  const { client } = options;

  if (!client) {
    throw new Error(
      'updateOAuthClient failed! The option "client" is required.',
    );
  }

  // Build URL and fetch the space.
  return axios
    .post(buildEndpoint(options), client, {
      params: paramBuilder(options),
      headers: headerBuilder(options),
    })
    .then(response => ({ client: response.data.client }))
    .catch(handleErrors);
};

export const deleteOAuthClient = (options = {}) => {
  const { clientId } = options;

  if (!clientId) {
    throw new Error(
      'deleteOAuthClient failed! The option "clientId" is required.',
    );
  }

  // Build URL and fetch the space.
  return axios
    .delete(buildEndpoint(options), {
      params: paramBuilder(options),
      headers: headerBuilder(options),
    })
    .then(response => ({ client: response.data.client }))
    .catch(handleErrors);
};

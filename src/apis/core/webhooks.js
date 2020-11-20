import axios from 'axios';
import { bundle } from '../../helpers';
import { handleErrors, headerBuilder, paramBuilder } from '../http';

const validateOptions = (functionName, requiredOptions, options) => {
  const { kappSlug, webhook = {} } = options;

  const kappSlugMissing = webhook.type === 'Kapp' && !kappSlug;

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
        webhook.type
      }`,
    );
  }
};

const buildEndpoint = ({ kappSlug, webhookName }) => {
  const basePath = kappSlug
    ? `${bundle.apiLocation()}/kapps/${kappSlug}/webhooks`
    : `${bundle.apiLocation()}/webhooks`;
  return webhookName ? `${basePath}/${webhookName}` : basePath;
};

export const fetchWebhooks = (options = {}) => {
  validateOptions('fetchWebhooks', [], options);
  return axios
    .get(buildEndpoint(options), {
      params: paramBuilder(options),
      headers: headerBuilder(options),
    })
    .then(response => ({
      webhooks: response.data.webhooks,
    }))
    .catch(handleErrors);
};

export const fetchWebhook = (options = {}) => {
  validateOptions('fetchWebhook', ['webhookName'], options);
  return axios
    .get(buildEndpoint(options), {
      params: paramBuilder(options),
      headers: headerBuilder(options),
    })
    .then(response => ({
      webhook: response.data.webhook,
    }))
    .catch(handleErrors);
};

export const createWebhook = (options = {}) => {
  const { webhook, kappSlug } = options;
  validateOptions('createWebhook', ['webhook'], options);
  // For Creates, we don't append the name to the basePath (it goes in the body)
  // so not using the buildEndpoint function
  const basePath = kappSlug
    ? `${bundle.apiLocation()}/kapps/${kappSlug}/webhooks`
    : `${bundle.apiLocation()}/webhooks`;
  return axios
    .post(basePath, webhook, {
      params: paramBuilder(options),
      headers: headerBuilder(options),
    })
    .then(response => ({
      webhook: response.data.webhook,
    }))
    .catch(handleErrors);
};

export const updateWebhook = (options = {}) => {
  const { webhook } = options;
  validateOptions('updateWebhook', ['webhookName', 'webhook'], options);
  return axios
    .put(buildEndpoint(options), webhook, {
      params: paramBuilder(options),
      headers: headerBuilder(options),
    })
    .then(response => ({
      webhook: response.data.webhook,
    }))
    .catch(handleErrors);
};

export const deleteWebhook = (options = {}) => {
  validateOptions('deleteWebhook', ['webhookName'], options);
  return axios
    .delete(buildEndpoint(options), {
      params: paramBuilder(options),
      headers: headerBuilder(options),
    })
    .then(response => ({
      webhook: response.data.webhook,
    }))
    .catch(handleErrors);
};

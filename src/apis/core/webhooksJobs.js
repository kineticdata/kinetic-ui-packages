import axios from 'axios';
import { bundle } from '../../helpers';
import { handleErrors, headerBuilder, paramBuilder } from '../http';

const buildEndpoint = (scope, kappSlug) =>
  scope === 'kapp'
    ? `${bundle.apiLocation()}/kapps/${kappSlug}/webhookJobs`
    : `${bundle.apiLocation()}/webhookJobs`;

export const fetchWebhookJobs = (options = {}) => {
  const { scope, kappSlug, status, webhook } = options;

  return axios
    .get(buildEndpoint(scope, kappSlug), {
      params: {
        ...paramBuilder(options),
        status,
        limit: options.limit,
        pageToken: options.pageToken,
        webhook,
      },
      headers: headerBuilder(options),
    })
    .then(response => ({
      webhookJobs: response.data.webhookJobs,
      nextPageToken: response.data.nextPageToken,
    }))
    .catch(handleErrors);
};

export const updateWebhookJob = (options = {}) => {
  const { id, kappSlug, scope, webhookJob } = options;

  if (!id) {
    throw new Error('updateWebhookJob failed! The option "id" is required.');
  }

  if (!webhookJob) {
    throw new Error(
      'updateWebhookJob failed! The option "webhookJob" is required.',
    );
  }

  return axios
    .put(`${buildEndpoint(scope, kappSlug)}/${id}`, webhookJob, {
      params: paramBuilder(options),
      headers: headerBuilder(options),
    })
    .then(response => ({ webhookJob: response.data.webhookJob }))
    .catch(handleErrors);
};

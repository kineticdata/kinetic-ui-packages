import axios from 'axios';
import { bundle } from '../../helpers';
import { handleErrors, paramBuilder, headerBuilder } from '../http';

const backgroundJobPath = ({ formSlug, kappSlug, job } = {}) => {
  const basePath =
    !formSlug && !kappSlug
      ? `${bundle.apiLocation()}/backgroundJobs`
      : !formSlug && kappSlug
        ? `${bundle.apiLocation()}/kapps/${kappSlug}/backgroundJobs`
        : formSlug && !kappSlug
          ? `${bundle.apiLocation()}/forms/${formSlug}/backgroundJobs`
          : `${bundle.apiLocation()}/kapps/${kappSlug}/forms/${formSlug}/backgroundJobs`;

  return basePath + (job ? `/${job}` : '');
};

export const fetchBackgroundJobs = (options = {}) =>
  axios
    .get(backgroundJobPath(options), {
      params: { ...paramBuilder(options), complete: options.complete },
      headers: headerBuilder(options),
    })
    .then(response => ({
      backgroundJobs: response.data.backgroundJobs,
    }))
    .catch(handleErrors);

export const createBackgroundJob = (options = {}) => {
  const { type, content } = options;
  const path = backgroundJobPath(options);

  return axios
    .post(path, { type, content })
    .then(response => ({
      backgroundJob: response.data.backgroundJob,
    }))
    .catch(handleErrors);
};

export const updateBackgroundJob = (options = {}) => {
  const { status } = options;

  const path = backgroundJobPath(options);

  return axios
    .put(
      path,
      { status },
      {
        params: paramBuilder(options),
        headers: headerBuilder(options),
      },
    )
    .then(response => ({
      backgroundJob: response.data.backgroundJob,
    }))
    .catch(handleErrors);
};

export const deleteBackgroundJob = (options = {}) => {
  const path = backgroundJobPath(options);

  return axios
    .delete(path, {
      params: paramBuilder(options),
      headers: headerBuilder(options),
    })
    .then(response => ({
      backgroundJob: response.data.backgroundJob,
    }))
    .catch(handleErrors);
};

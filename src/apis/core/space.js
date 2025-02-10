import axios from 'axios';
import { bundle } from '../../helpers';
import { handleErrors, paramBuilder, headerBuilder } from '../http';

export const fetchSpace = (options = {}) => {
  // Build URL and fetch the space.
  return axios
    .get(
      options.slug
        ? `/app/system-coordinator/components/core/app/api/v1/spaces/${
            options.slug
          }`
        : `${bundle.apiLocation()}/space`,
      {
        params: paramBuilder(options),
        headers: headerBuilder(options),
      },
    )
    .then(response => ({ space: response.data.space }))
    .catch(handleErrors);
};

export const updateSpace = (options = {}) => {
  const { space } = options;
  if (!space) {
    throw new Error('updateSpace failed! The option "space" is required.');
  }

  return axios
    .put(
      options.slug
        ? `/app/system-coordinator/components/core/app/api/v1/spaces/${
            options.slug
          }`
        : `${bundle.apiLocation()}/space`,
      space,
      {
        params: paramBuilder(options),
        headers: headerBuilder(options),
      },
    )
    .then(response => ({ space: response.data.space }))
    .catch(handleErrors);
};

import axios from 'axios';
import { bundle } from '../../helpers';
import { handleErrors, paramBuilder, headerBuilder } from '../http';

/**
 * Fetch submission activity within the system.
 * @param {object} options fetch parameters
 * @param {string} options.kappSlug slug of the kapp to scope activity to
 */
export const fetchActivity = (options = {}) => {
  const { kappSlug } = options;

  const path = kappSlug
    ? `${bundle.apiLocation()}/kapps/${kappSlug}/activity`
    : `${bundle.apiLocation()}/activity`;

  // Build URL and fetch the space.
  return axios
    .get(path, {
      params: paramBuilder(options),
      headers: headerBuilder(options),
    })
    .then(response => ({
      submissionBreakdown: response.data.submissionBreakdown,
      submissionVolume: response.data.submissionVolume,
    }))
    .catch(handleErrors);
};

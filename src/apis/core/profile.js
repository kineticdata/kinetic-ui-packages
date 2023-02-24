import axios from 'axios';
import { bundle } from '../../helpers';
import { handleErrors, paramBuilder, headerBuilder } from '../http';

const getProfileEndpoint = () => `${bundle.apiLocation()}/me`;

// Extract the profile from the data and return it.
// If there are any errors clean them up and return them instead.
export const fetchProfile = (options = {}) => {
  // Build URL and fetch the space.
  return axios
    .get(getProfileEndpoint(), {
      params: paramBuilder(options),
      headers: headerBuilder(options),
    })
    .then(response => ({ profile: response.data }))
    .catch(handleErrors);
};

export const updateProfile = (options = {}) => {
  const { profile } = options;

  if (!profile) {
    throw new Error('updateProfile failed! The option "profile" is required.');
  }

  // Build URL and fetch the space.
  return axios
    .put(getProfileEndpoint(), profile, {
      params: paramBuilder(options),
      headers: headerBuilder(options),
    })
    .then(response => ({ profile: response.data.user }))
    .catch(handleErrors);
};

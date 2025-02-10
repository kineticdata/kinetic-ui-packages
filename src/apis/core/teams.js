import axios from 'axios';
import { bundle } from '../../helpers';
import { handleErrors, paramBuilder, headerBuilder } from '../http';

export const fetchTeams = (options = {}) => {
  // Build URL and fetch the space.
  return axios
    .get(`${bundle.apiLocation()}/teams`, {
      params: { ...paramBuilder(options), archived: options.archived },
      headers: headerBuilder(options),
    })
    .then(response => ({
      teams: response.data.teams,
      count: response.data.count,
      nextPageToken: response.data.nextPageToken,
    }))
    .catch(handleErrors);
};

export const fetchTeam = (options = {}) => {
  const { teamSlug } = options;

  if (!teamSlug) {
    throw new Error('fetchTeam failed! The option "teamSlug" is required.');
  }

  // Build URL and fetch the space.
  return axios
    .get(`${bundle.apiLocation()}/teams/${teamSlug}`, {
      params: paramBuilder(options),
      headers: headerBuilder(options),
    })
    .then(response => ({ team: response.data.team }))
    .catch(handleErrors);
};

export const updateTeam = (options = {}) => {
  const { teamSlug, team } = options;

  if (!teamSlug) {
    throw new Error('updateTeam failed! The option "teamSlug" is required.');
  }

  if (!team) {
    throw new Error('updateTeam failed! The option "team" is required.');
  }

  // Build URL and fetch the space.
  return axios
    .put(`${bundle.apiLocation()}/teams/${teamSlug}`, team, {
      params: paramBuilder(options),
      headers: headerBuilder(options),
    })
    .then(response => ({ team: response.data.team }))
    .catch(handleErrors);
};

export const createTeam = (options = {}) => {
  const { team } = options;

  if (!team) {
    throw new Error('createTeam failed! The option "team" is required.');
  }

  // Build URL and fetch the space.
  return axios
    .post(`${bundle.apiLocation()}/teams`, team, {
      params: paramBuilder(options),
      headers: headerBuilder(options),
    })
    .then(response => ({ team: response.data.team }))
    .catch(handleErrors);
};

export const deleteTeam = (options = {}) => {
  const { teamSlug } = options;

  if (!teamSlug) {
    throw new Error('deleteTeam failed! The option "teamSlug" is required.');
  }

  // Build URL and fetch the space.
  return axios
    .delete(`${bundle.apiLocation()}/teams/${teamSlug}`, {
      params: paramBuilder(options),
      headers: headerBuilder(options),
    })
    .then(response => ({ team: response.data.team }))
    .catch(handleErrors);
};

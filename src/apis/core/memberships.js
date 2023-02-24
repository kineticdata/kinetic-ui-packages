import axios from 'axios';
import { bundle } from '../../helpers';
import { handleErrors, paramBuilder } from '../http';

export const createMembership = (options = {}) => {
  const { team, user } = options;

  if (!team) {
    throw new Error('createMembership failed! The option "team" is required.');
  }
  if (!user) {
    throw new Error('createMembership failed! The option "user" is required.');
  }

  return axios
    .post(
      `${bundle.apiLocation()}/memberships`,
      { team, user },
      {
        params: paramBuilder(options),
      },
    )
    .then(response => ({
      membership: response.data.membership,
    }))
    .catch(handleErrors);
};

export const deleteMembership = (options = {}) => {
  const { teamSlug, username } = options;

  if (!teamSlug) {
    throw new Error(
      'deleteMembership failed! The option "teamSlug" is required.',
    );
  }
  if (!username) {
    throw new Error(
      'deleteMembership failed! The option "username" is required.',
    );
  }

  return axios
    .delete(`${bundle.apiLocation()}/memberships/${teamSlug}_${username}`, {
      params: paramBuilder(options),
    })
    .catch(handleErrors);
};

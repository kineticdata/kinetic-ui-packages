import { Record } from 'immutable';
import { Utils } from '@kineticdata/bundle-common';
const { withPayload } = Utils;
const ns = Utils.namespaceBuilder('survey/users');

export const State = Record({
  fetchingUsers: false,
  users: [],
  fetchingTeams: false,
  teams: [],
});

export const types = {
  FETCH_USERS: ns('FETCH_USERS'),
  SET_USERS: ns('SET_USERS'),
  FETCH_TEAMS: ns('FETCH_TEAMS'),
  SET_TEAMS: ns('SET_TEAMS'),
};

export const actions = {
  fetchUsers: withPayload(types.FETCH_USERS),
  setUsers: withPayload(types.SET_USERS),
  fetchTeams: withPayload(types.FETCH_TEAMS),
  setTeams: withPayload(types.SET_TEAMS),
};

export const reducer = (state = State(), { type, payload }) => {
  switch (type) {
    case types.FETCH_USERS:
      return state.set('fetchingUsers', true).set('users', []);
    case types.SET_USERS:
      return state
        .update(
          'users',
          users => (payload.error ? [] : users.concat(payload.data)),
        )
        .set('fetchingUsers', !payload.completed && !payload.error);
    case types.FETCH_TEAMS:
      return state.set('fetchingTeams', true).set('teams', []);
    case types.SET_TEAMS:
      return state
        .update(
          'teams',
          teams => (payload.error ? [] : teams.concat(payload.data)),
        )
        .set('fetchingTeams', !payload.completed && !payload.error);

    default:
      return state;
  }
};

export default reducer;

import { takeEvery, call, put } from 'redux-saga/effects';
import { fetchUsers, fetchTeams } from '@kineticdata/react';
import { types, actions } from '../modules/users';
import { addToastAlert } from '@kineticdata/bundle-common';

export function* fetchUsersSaga({ payload = {} }) {
  const { users, error, nextPageToken } = yield call(fetchUsers, {
    include: 'attributesMap,memberships,profileAttributesMap',
    limit: 1000,
    pageToken: payload.pageToken,
  });

  if (error) {
    addToastAlert({ message: 'An error ocurred when fetching users.' });
    yield put(actions.setUsers({ error }));
  } else {
    yield put(actions.setUsers({ data: users, completed: !nextPageToken }));
    if (nextPageToken) {
      yield call(fetchUsersSaga, { payload: { pageToken: nextPageToken } });
    }
  }
}

export function* fetchTeamsSaga({ payload = {} }) {
  const { teams, error, nextPageToken } = yield call(fetchTeams, {
    include: 'teams',
    limit: 1000,
    pageToken: payload.pageToken,
  });

  if (error) {
    addToastAlert({ message: 'An error ocurred when fetching teams.' });
    yield put(actions.setTeams({ error }));
  } else {
    yield put(actions.setTeams({ data: teams, completed: !nextPageToken }));
    if (nextPageToken) {
      yield call(fetchTeamsSaga, { payload: { pageToken: nextPageToken } });
    }
  }
}

export function* watchUsers() {
  yield takeEvery(types.FETCH_USERS, fetchUsersSaga);
  yield takeEvery(types.FETCH_TEAMS, fetchTeamsSaga);
}

import { takeEvery, all, call, put } from 'redux-saga/effects';
import {
  createUser,
  updateUser,
  deleteUser,
  fetchUser,
  fetchUsers,
} from '@kineticdata/react';
import { types, actions } from '../modules/settingsUsers';
import { Utils, addToastAlert } from '@kineticdata/bundle-common';

export function* cloneUserSaga({ payload }) {
  const { user, error: fetchError } = yield call(fetchUser, {
    include: 'attributesMap,memberships',
    username: payload.clonedUsername,
  });

  if (fetchError) {
    Utils.callBack({ payload, error: fetchError });
  } else {
    const { user: response, error } = yield call(updateUser, {
      username: payload.user.username,
      user: {
        ...payload.user,
        preferredLocale: user.preferredLocale,
        timezone: user.timezone,
        attributesMap: user.attributesMap,
        memberships: user.memberships,
      },
    });

    Utils.callBack({ payload, response, error });
  }
}

export function* deleteUserSaga({ payload }) {
  const { error } = yield call(deleteUser, { username: payload.username });

  Utils.callBack({ payload, response: !error, error });
}

export function* fetchAllUsersSaga({ payload = {} }) {
  const { users, error, nextPageToken } = yield call(fetchUsers, {
    include: 'attributesMap,memberships,profileAttributesMap',
    limit: 1000,
    pageToken: payload.pageToken,
  });

  if (error) {
    addToastAlert({ message: 'An error ocurred when exporting users.' });
    yield put(actions.setExportUsers({ error }));
  } else {
    yield put(
      actions.setExportUsers({ data: users, completed: !nextPageToken }),
    );
    if (nextPageToken) {
      yield call(fetchAllUsersSaga, { payload: { pageToken: nextPageToken } });
    }
  }
}

export function* importUsersSaga({ payload }) {
  const { importUsers, error } = yield call(checkExistingUsers, {
    importUsers: payload,
  });

  if (error) {
    addToastAlert({ message: 'An error ocorred when importing users.' });
    yield put(actions.importUsersReset());
  } else {
    const results = yield all(
      importUsers.map(
        ({ _update, ...user }) =>
          _update
            ? call(updateUser, { username: user.username, user })
            : call(createUser, { user }),
      ),
    );

    const failedImports = results
      .map(({ error }, index) => {
        if (error) {
          const { _update, ...user } = importUsers[index];
          return { ...user, _originalIndex: index, _error: error.message };
        } else {
          return false;
        }
      })
      .filter(e => e);

    const counts = results.reduce(
      (counts, { error }, index) => {
        const propToIncrement = importUsers[index]['_update']
          ? error
            ? 'updateFailure'
            : 'updateSuccess'
          : error
            ? 'createFailure'
            : 'createSuccess';
        return { ...counts, [propToIncrement]: counts[propToIncrement] + 1 };
      },
      {
        createSuccess: 0,
        createFailure: 0,
        updateSuccess: 0,
        updateFailure: 0,
      },
    );

    yield put(actions.importUsersComplete({ errors: failedImports, counts }));
  }
}

function* checkExistingUsers({ importUsers, pageToken } = {}) {
  const { users, error, nextPageToken } = yield call(fetchUsers, {
    limit: 1000,
    pageToken: pageToken,
  });

  if (error) {
    return { error };
  } else {
    const userMap = users.reduce(
      (map, user) => ({ ...map, [user.username]: true }),
      {},
    );
    const updatedImportUsers = importUsers.map(
      user => (userMap[user.username] ? { ...user, _update: true } : user),
    );
    if (nextPageToken) {
      return yield call(
        checkExistingUsers, {
          importUsers: updatedImportUsers,
          pageToken: nextPageToken,
        },
      );
    } else {
      return { importUsers: updatedImportUsers };
    }
  }
}

export function* watchSettingsUsers() {
  yield takeEvery(types.DELETE_USER_REQUEST, deleteUserSaga);
  yield takeEvery(types.CLONE_USER_REQUEST, cloneUserSaga);
  yield takeEvery(types.FETCH_ALL_USERS, fetchAllUsersSaga);
  yield takeEvery(types.IMPORT_USERS_REQUEST, importUsersSaga);
}

import { call, put, takeEvery, select } from 'redux-saga/effects';
import { fetchForms } from '@kineticdata/react';
import { actions, types } from '../modules/settingsApp';

// Fetch all datastore forms to be used for checking for access to settings consoles
export function* fetchAppDataSaga() {
  let formList = [];
  let pageToken = null;

  do {
    const { forms, error, nextPageToken } = yield call(fetchForms, {
      datastore: true,
    });

    if (error) {
      yield put(actions.fetchAppDataFailure(error));
    } else {
      formList = formList.concat(forms);
      pageToken = nextPageToken;
    }
  } while (!!pageToken);

  const me = yield select(state => state.app.profile);

  yield put(actions.fetchAppDataSuccess({ forms: formList, me }));
}

export function* watchSettingsApp() {
  yield takeEvery(types.FETCH_APP_DATA_REQUEST, fetchAppDataSaga);
}

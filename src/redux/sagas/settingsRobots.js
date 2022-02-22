import { call, put, takeEvery } from 'redux-saga/effects';
import {
  searchSubmissions,
  fetchSubmission,
  deleteSubmission,
  SubmissionSearch,
  createSubmission,
} from '@kineticdata/react';
import { Utils } from '@kineticdata/bundle-common';
import {
  actions,
  types,
  ROBOT_NEXT_EXECUTION_FORM_SLUG,
} from '../modules/settingsRobots';
import { Seq, Map } from 'immutable';

export function* fetchNextExecutionsSaga() {
  const query = new SubmissionSearch(true);
  query.include('details,values');
  query.limit('1000');

  const { submissions, error } = yield call(searchSubmissions, {
    search: query.build(),
    datastore: true,
    form: ROBOT_NEXT_EXECUTION_FORM_SLUG,
  });

  if (error) {
    yield put(actions.fetchNextExecutionsFailure(error));
  } else {
    yield put(actions.fetchNextExecutionsSuccess(submissions));
  }
}

export function* fetchRobotSaga({ payload }) {
  const { submission, error } = yield call(fetchSubmission, {
    id: payload.id,
    include: 'details,values,form',
    datastore: true,
  });

  if (error) {
    yield put(actions.fetchRobotFailure(error));
  } else {
    yield put(actions.fetchRobotSuccess(submission));
  }
}

export function* cloneRobotSaga({ payload }) {
  const { submission, error: fetchError } = yield call(fetchSubmission, {
    id: payload.id,
    include: 'details,values,form,form.fields.details',
    datastore: true,
  });

  if (fetchError) {
    Utils.callBack({ payload, error: fetchError });
  } else {
    // Some values on the original submission should be reset.
    const overrideFields = Map({
      'Robot Name': `Copy of ${submission.values['Robot Name']}`,
      Status: 'Inactive',
    });

    // Copy the values from the original submission with the transformations
    // described above.
    const values = Seq(submission.values)
      .map((value, fieldName) => overrideFields.get(fieldName) || value)
      .toJS();

    // Make the call to create the clone.
    const { submission: response, error } = yield call(createSubmission, {
      datastore: true,
      formSlug: submission.form.slug,
      values,
      completed: false,
    });

    Utils.callBack({ payload, response, error });
  }
}

export function* deleteRobotSaga({ payload }) {
  const { error } = yield call(deleteSubmission, {
    id: payload.id,
    datastore: true,
  });

  Utils.callBack({ payload, response: !error, error });
}

export function* watchSettingsRobots() {
  yield takeEvery(types.FETCH_NEXT_EXECUTIONS_REQUEST, fetchNextExecutionsSaga);
  yield takeEvery(types.FETCH_ROBOT_REQUEST, fetchRobotSaga);
  yield takeEvery(types.CLONE_ROBOT_REQUEST, cloneRobotSaga);
  yield takeEvery(types.DELETE_ROBOT_REQUEST, deleteRobotSaga);
}

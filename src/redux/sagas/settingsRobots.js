import { call, put, select, takeEvery } from 'redux-saga/effects';
import {
  searchSubmissions,
  fetchSubmission,
  deleteSubmission,
  SubmissionSearch,
  createSubmission,
} from '@kineticdata/react';

import { actions as systemErrorActions } from '../modules/errors';
import {
  actions,
  types,
  ROBOT_FORM_SLUG,
  ROBOT_EXECUTIONS_FORM_SLUG,
  ROBOT_EXECUTIONS_PAGE_SIZE,
} from '../modules/settingsRobots';
import { addToast } from '@kineticdata/bundle-common';
import { Seq, Map } from 'immutable';
import { push } from 'redux-first-history';

export function* fetchRobotsSaga(action) {
  const query = new SubmissionSearch(true);
  query.include('details,values');
  query.limit('1000');

  const { submissions, errors, serverError } = yield call(searchSubmissions, {
    search: query.build(),
    datastore: true,
    form: ROBOT_FORM_SLUG,
  });

  if (serverError) {
    yield put(systemErrorActions.setSystemError(serverError));
  } else if (errors) {
    yield put(actions.setFetchRobotsError(errors));
  } else {
    yield put(actions.setRobots(submissions));
  }
}

export function* fetchRobotSaga(action) {
  const include = 'details,values';
  const { submission, errors, serverError } = yield call(fetchSubmission, {
    id: action.payload,
    include,
    datastore: true,
  });

  if (serverError) {
    yield put(systemErrorActions.setSystemError(serverError));
  } else if (errors) {
    yield put(actions.setRobotError(errors));
  } else {
    yield put(actions.setRobot(submission));
  }
}

export function* deleteRobotSaga(action) {
  const { errors, serverError } = yield call(deleteSubmission, {
    id: action.payload.id,
    datastore: true,
  });

  if (serverError) {
    yield put(systemErrorActions.setSystemError(serverError));
  } else if (errors) {
    yield put(actions.setDeleteError(errors));
  } else {
    yield put(actions.setDeleteSuccess());
    addToast('Robot Deleted');
    if (typeof action.payload.callback === 'function') {
      action.payload.callback();
    }
  }
}

export function* fetchRobotExecutionsSaga({ payload: { scheduleId } }) {
  const pageToken = yield select(
    state => state.settingsRobots.robotExecutionsCurrentPageToken,
  );
  const query = new SubmissionSearch(true);
  if (pageToken) {
    query.pageToken(pageToken);
  }
  query.include('details,values');
  query.limit(ROBOT_EXECUTIONS_PAGE_SIZE);
  query.sortDirection('DESC');
  query.eq('values[Robot ID]', scheduleId);
  query.index('values[Robot ID],values[Start]');

  const { submissions, nextPageToken, errors, serverError } = yield call(
    searchSubmissions,
    {
      search: query.build(),
      datastore: true,
      form: ROBOT_EXECUTIONS_FORM_SLUG,
    },
  );

  if (serverError) {
    yield put(systemErrorActions.setSystemError(serverError));
  } else if (errors) {
    yield put(actions.setFetchRobotExecutionsError(errors));
  } else {
    yield put(actions.setRobotExecutions({ submissions, nextPageToken }));
  }
}

export function* fetchRobotExecutionSaga(action) {
  const include = 'details,values';
  const { submission, errors, serverError } = yield call(fetchSubmission, {
    id: action.payload,
    include,
    datastore: true,
  });

  if (serverError) {
    yield put(systemErrorActions.setSystemError(serverError));
  } else if (errors) {
    yield put(actions.setRobotExecutionError(errors));
  } else {
    yield put(actions.setRobotExecution(submission));
  }
}

export function* fetchNextExecutionsSaga(action) {
  const query = new SubmissionSearch(true);

  query.include('details,values');
  query.limit('1000');

  const { submissions, errors, serverError } = yield call(searchSubmissions, {
    search: query.build(),
    datastore: true,
    form: 'robot-next-execution',
  });

  if (serverError) {
  } else if (errors) {
  } else {
    yield put(actions.setNextExecutions(submissions));
  }
}

export function* cloneRobotSaga(action) {
  const include = 'details,values,form,form.fields.details';
  const { submission, errors, serverError } = yield call(fetchSubmission, {
    id: action.payload.id,
    include,
    datastore: true,
  });

  if (serverError) {
    yield put(systemErrorActions.setSystemError(serverError));
  } else if (errors) {
    yield put(actions.cloneRobotErrors(errors));
  } else {
    const formSlug = submission.form.slug;
    const robotName = submission.values['Robot Name'];

    // Some values on the original submission should be reset.
    const overrideFields = Map({
      Status: 'Inactive',
      'Robot Name': `Copy of ${robotName}`,
    });

    // Copy the values from the original submission with the transformations
    // described above.
    const values = Seq(submission.values)
      .map((value, fieldName) => overrideFields.get(fieldName) || value)
      .toJS();

    // Make the call to create the clone.
    const {
      submission: cloneSubmission,
      postErrors,
      postServerError,
    } = yield call(createSubmission, {
      datastore: true,
      formSlug,
      values,
      completed: false,
    });

    if (postServerError) {
      yield put(systemErrorActions.setSystemError(serverError));
    } else if (postErrors) {
      yield put(actions.cloneRobotErrors(postErrors));
    } else {
      yield put(actions.cloneRobotSuccess());
      addToast('Robot Cloned');
      if (typeof action.payload.callback === 'function') {
        action.payload.callback();
      }
      yield put(push(`/settings/robots/${cloneSubmission.id}`));
    }
  }
}

export function* watchSettingsRobots() {
  yield takeEvery(types.FETCH_ROBOTS, fetchRobotsSaga);
  yield takeEvery(types.FETCH_ROBOT, fetchRobotSaga);
  yield takeEvery(types.DELETE_ROBOT, deleteRobotSaga);
  yield takeEvery(
    [
      types.FETCH_ROBOT_EXECUTIONS,
      types.FETCH_ROBOT_EXECUTIONS_NEXT_PAGE,
      types.FETCH_ROBOT_EXECUTIONS_PREVIOUS_PAGE,
    ],
    fetchRobotExecutionsSaga,
  );
  yield takeEvery(types.FETCH_ROBOT_EXECUTION, fetchRobotExecutionSaga);
  yield takeEvery(types.FETCH_NEXT_EXECUTIONS, fetchNextExecutionsSaga);
  yield takeEvery(types.CLONE_ROBOT, cloneRobotSaga);
}

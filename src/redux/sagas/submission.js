import { delay } from 'redux-saga';
import {
  call,
  put,
  cancel,
  take,
  fork,
  takeEvery,
  select,
} from 'redux-saga/effects';
import {
  fetchSubmission,
  createSubmission,
  deleteSubmission,
} from '@kineticdata/react';
import { addToast, addToastAlert } from '@kineticdata/bundle-common';
import { Map, Seq } from 'immutable';

import { actions, types } from '../modules/submission';
import { getCancelFormConfig, getCommentFormConfig } from '../../utils';

export function* fetchSubmissionRequestSaga(action) {
  const include =
    'details,values,form,form.attributes,form.kapp.attributes,' +
    'form.kapp.space.attributes,activities,activities.details';
  const { submission, error } = yield call(fetchSubmission, {
    id: action.payload,
    include,
  });

  if (error) {
    yield put(actions.fetchSubmissionFailure(error));
  } else {
    yield put(actions.fetchSubmissionSuccess(submission));
  }
}

export function* cloneSubmissionRequestSaga(action) {
  const include = 'details,values,form,form.fields.details,form.kapp';
  const { submission, error } = yield call(fetchSubmission, {
    id: action.payload.id,
    include,
  });

  if (error) {
    addToastAlert({
      title: 'Failed to clone submission',
      message: error.message,
    });
  } else {
    // The values of attachment fields cannot be cloned so we will filter them out
    // of the values POSTed to the new submission.
    const attachmentFields = Seq(submission.form.fields)
      .filter(field => field.dataType === 'file')
      .map(field => field.name)
      .toSet();

    // Some values on the original submission should be reset.
    const overrideFields = Map({
      Status: 'Draft',
      Observers: [],
    });

    // Copy the values from the original submission with the transformations
    // described above.
    const values = Seq(submission.values)
      .filter((value, fieldName) => !attachmentFields.contains(fieldName))
      .map((value, fieldName) => overrideFields.get(fieldName) || value)
      .toJS();

    // Make the call to create the clone.
    const { submission: cloneSubmission, error: cloneError } = yield call(
      createSubmission,
      {
        kappSlug: submission.form.kapp.slug,
        formSlug: submission.form.slug,
        values,
        completed: false,
      },
    );

    if (cloneError) {
      addToastAlert({
        title: 'Failed to clone submission',
        message: cloneError.message,
      });
    } else {
      addToast('Submission cloned successfully');
      if (typeof action.payload.success === 'function') {
        action.payload.success(cloneSubmission);
      }
    }
  }
}

export function* deleteSubmissionRequestSaga(action) {
  const { error } = yield call(deleteSubmission, {
    id: action.payload.id,
  });

  if (error) {
    addToastAlert({
      title: 'Failed to delete submission',
      message: error.message,
    });
  } else {
    addToast('Submission deleted successfully');
    if (typeof action.payload.callback === 'function') {
      action.payload.callback();
    }
  }
}

export function* sendMessageRequestSaga(action) {
  const kappSlug = yield select(state => state.app.kappSlug);
  const submission = yield select(state => state.submission.data);
  const sendMessageType = yield select(
    state => state.submission.sendMessageType,
  );

  const formConfig =
    sendMessageType === 'comment'
      ? getCommentFormConfig(kappSlug, submission.id, action.payload)
      : getCancelFormConfig(kappSlug, submission.id, action.payload);

  yield call(createSubmission, formConfig);
  yield put(actions.setSendMessageModalOpen({ isOpen: false }));
}

export function* pollerTask(id) {
  const include =
    'details,values,form,form.attributes,form.kapp.attributes,' +
    'form.kapp.space.attributes,activities,activities.details';
  let pollDelay = 5000;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    // Wait
    yield delay(pollDelay);
    // Query
    const { submission, error } = yield call(fetchSubmission, {
      id,
      include,
    });
    // If there is a server error dispatch the appropriate action and break out
    // of the while loop to stop polling.
    if (error) {
      addToast({ severity: 'danger', message: 'Failed to refresh submission' });
      yield put(actions.stopSubmissionPoller());
      break;
    } else {
      yield put(actions.fetchSubmissionSuccess(submission));
      pollDelay = Math.min(pollDelay + 5000, 30000);
    }
  }
}

export function* watchSubmissionPoller() {
  let action;
  // eslint-disable-next-line no-cond-assign
  while ((action = yield take(types.START_SUBMISSION_POLLER))) {
    // start the poller in the background
    const poller = yield fork(pollerTask, action.payload);
    // wait for the message to stop the poller
    yield take(types.STOP_SUBMISSION_POLLER);
    // stop the poller by cancelling the background task
    yield cancel(poller);
  }
}

export function* watchSubmission() {
  yield takeEvery(types.FETCH_SUBMISSION_REQUEST, fetchSubmissionRequestSaga);
  yield takeEvery(types.CLONE_SUBMISSION_REQUEST, cloneSubmissionRequestSaga);
  yield takeEvery(types.DELETE_SUBMISSION_REQUEST, deleteSubmissionRequestSaga);
  yield takeEvery(types.SEND_MESSAGE_REQUEST, sendMessageRequestSaga);
}

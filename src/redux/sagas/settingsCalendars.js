import { call, put, takeEvery } from 'redux-saga/effects';
import {
  searchSubmissions,
  fetchSubmission,
  SubmissionSearch,
  deleteSubmission,
  createSubmission,
} from '@kineticdata/react';
import { Utils } from '@kineticdata/bundle-common';
import { Seq } from 'immutable';
import {
  actions,
  types,
  CALENDAR_FORM_SLUG,
} from '../modules/settingsCalendars';

export function* fetchCalendarsSaga() {
  const query = new SubmissionSearch(true);
  query.include('details,values[Status]');
  query.limit('1000');

  const { submissions, error } = yield call(searchSubmissions, {
    search: query.build(),
    datastore: true,
    form: CALENDAR_FORM_SLUG,
  });

  if (error) {
    yield put(actions.fetchCalendarsFailure(error));
  } else {
    yield put(actions.fetchCalendarsSuccess(submissions));
  }
}

export function* cloneCalendarSaga({ payload }) {
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
      'Calendar Name': `Copy of ${submission.values['Calendar Name']}`,
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

export function* deleteCalendarSaga({ payload }) {
  const { error } = yield call(deleteSubmission, {
    id: payload.id,
    datastore: true,
  });

  Utils.callBack({ payload, response: !error, error });
}

export function* watchSettingsCalendars() {
  yield takeEvery(types.FETCH_CALENDARS_REQUEST, fetchCalendarsSaga);
  yield takeEvery(types.DELETE_CALENDAR_REQUEST, deleteCalendarSaga);
}

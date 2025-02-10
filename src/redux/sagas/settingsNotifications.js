import { call, put, takeEvery } from 'redux-saga/effects';
import {
  fetchSubmission,
  createSubmission,
  deleteSubmission,
  updateSubmission,
  fetchForms,
  searchSubmissions,
  SubmissionSearch,
} from '@kineticdata/react';
import { Utils } from '@kineticdata/bundle-common';
import { Seq, Map } from 'immutable';
import {
  actions,
  types,
  NOTIFICATIONS_FORM_SLUG,
  NOTIFICATIONS_DATE_FORMAT_FORM_SLUG,
} from '../modules/settingsNotifications';

export function* fetchSnippetsSaga() {
  const query = new SubmissionSearch(true);
  query.include('details,values');
  query.limit('1000');
  query.index('values[Type],values[Name]');
  query.eq('values[Type]', 'Snippet');

  const { submissions, error } = yield call(searchSubmissions, {
    search: query.build(),
    datastore: true,
    form: NOTIFICATIONS_FORM_SLUG,
  });

  if (error) {
    yield put(actions.fetchSnippetsFailure(error));
  } else {
    yield put(actions.fetchSnippetsSuccess(submissions));
  }
}

export function* fetchNotificationSaga(action) {
  if (action.payload === 'new') {
    yield put(actions.fetchNotificationSuccess(null));
  } else {
    const { submission, error } = yield call(fetchSubmission, {
      id: action.payload,
      include: 'details,values',
      datastore: true,
    });

    if (error) {
      yield put(actions.fetchNotificationFailure(error));
    } else {
      yield put(actions.fetchNotificationSuccess(submission));
    }
  }
}

export function* cloneNotificationSaga({ payload }) {
  const { submission, error: fetchError } = yield call(fetchSubmission, {
    id: payload.id,
    include: 'details,values,form,form.fields.details',
    datastore: true,
  });

  if (fetchError) {
    Utils.callBack({ payload, error: fetchError });
  } else {
    // The values of attachment fields cannot be cloned so we will filter them out
    // of the values POSTed to the new submission.
    const attachmentFields = Seq(submission.form.fields)
      .filter(field => field.dataType === 'file')
      .map(field => field.name)
      .toSet();

    // Some values on the original submission should be reset.
    const overrideFields = Map({
      Name: `Copy of ${submission.values['Name']}`,
      Status: 'Inactive',
      Observers: [],
    });

    // Copy the values from the original submission with the transformations
    // described above.
    const values = Seq(submission.values)
      .filter((value, fieldName) => !attachmentFields.contains(fieldName))
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

export function* deleteNotificationSaga({ payload }) {
  const { error } = yield call(deleteSubmission, {
    id: payload.id,
    datastore: true,
  });

  Utils.callBack({ payload, response: !error, error });
}

export function* saveNotificationSaga({ payload }) {
  const { submission, error } = yield payload.id
    ? call(updateSubmission, {
        datastore: true,
        id: payload.id,
        values: payload.values,
      })
    : call(createSubmission, {
        datastore: true,
        formSlug: NOTIFICATIONS_FORM_SLUG,
        completed: true,
        values: payload.values,
      });

  Utils.callBack({ payload, response: submission, error });
}

export function* fetchVariablesSaga(action) {
  if (action.payload.kappSlug) {
    // When Datastore is selected, we're passing the string 'app/datastore' as the kapp-slug
    const isDatastore = action.payload.kappSlug === 'app/datastore';
    const { forms, error } = yield call(fetchForms, {
      include: 'attributes,fields',
      datastore: isDatastore,
      ...(!isDatastore && { kappSlug: action.payload.kappSlug }),
    });

    if (error) {
      yield put(actions.fetchVariablesFailure(error));
    } else {
      yield put(actions.fetchVariablesSuccess(forms));
    }
  }
}

export function* fetchDateFormatsSaga() {
  const { submissions, error } = yield call(searchSubmissions, {
    datastore: true,
    form: NOTIFICATIONS_DATE_FORMAT_FORM_SLUG,
    search: new SubmissionSearch(true).includes(['values']).build(),
  });

  if (error) {
    yield put(actions.fetchDateFormatsFailure(error));
  } else {
    yield put(actions.fetchDateFormatsSuccess(submissions));
  }
}

export function* watchSettingsNotifications() {
  yield takeEvery(types.FETCH_SNIPPETS_REQUEST, fetchSnippetsSaga);
  yield takeEvery(types.FETCH_NOTIFICATION_REQUEST, fetchNotificationSaga);
  yield takeEvery(types.CLONE_NOTIFICATION_REQUEST, cloneNotificationSaga);
  yield takeEvery(types.DELETE_NOTIFICATION_REQUEST, deleteNotificationSaga);
  yield takeEvery(types.SAVE_NOTIFICATION_REQUEST, saveNotificationSaga);
  yield takeEvery(types.FETCH_VARIABLES_REQUEST, fetchVariablesSaga);
  yield takeEvery(types.FETCH_DATE_FORMATS_REQUEST, fetchDateFormatsSaga);
}

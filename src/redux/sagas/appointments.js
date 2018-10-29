import { takeEvery, put, all, call, select } from 'redux-saga/effects';
import { CoreAPI } from 'react-kinetic-core';
import { List } from 'immutable';
import { actions, types, APPOINTMENT_FORM_SLUG } from '../modules/appointments';
import moment from 'moment';

export function* fetchAppointmentSaga({ payload }) {
  const { submission, errors, serverError } = yield call(
    CoreAPI.fetchSubmission,
    {
      id: payload,
      include: 'details,values',
    },
  );

  if (serverError) {
    yield put(
      actions.setAppointmentErrors([
        serverError.error || serverError.statusText,
      ]),
    );
  } else if (errors) {
    yield put(actions.setAppointmentErrors(errors));
  } else {
    yield put(actions.setAppointment(submission));
  }
}

export function* fetchUpcomingAppointmentsSaga() {
  const kappSlug = yield select(state => state.app.config.kappSlug);
  const username = yield select(state => state.app.profile.username);
  const searchBuilder = new CoreAPI.SubmissionSearch()
    .limit(1000)
    .include('details,values')
    .coreState('Submitted')
    .eq('values[Requested For]', username);

  const { submissions, errors, serverError } = yield call(
    CoreAPI.searchSubmissions,
    {
      search: searchBuilder.build(),
      form: APPOINTMENT_FORM_SLUG,
      kapp: kappSlug,
    },
  );

  if (serverError) {
    yield put(
      actions.setUpcomingAppointmentErrors([
        serverError.error || serverError.statusText,
      ]),
    );
  } else if (errors) {
    yield put(actions.setUpcomingAppointmentErrors(errors));
  } else {
    yield put(actions.setUpcomingAppointments(submissions));
  }
}

export function* fetchPastAppointmentsSaga() {
  const kappSlug = yield select(state => state.app.config.kappSlug);
  const username = yield select(state => state.app.profile.username);
  const searchBuilder = new CoreAPI.SubmissionSearch()
    .limit(1000)
    .include('details,values')
    .coreState('Closed')
    .eq('values[Requested For]', username);

  const { submissions, errors, serverError } = yield call(
    CoreAPI.searchSubmissions,
    {
      search: searchBuilder.build(),
      form: APPOINTMENT_FORM_SLUG,
      kapp: kappSlug,
    },
  );

  if (serverError) {
    yield put(
      actions.setPastAppointmentErrors([
        serverError.error || serverError.statusText,
      ]),
    );
  } else if (errors) {
    yield put(actions.setPastAppointmentErrors(errors));
  } else {
    yield put(actions.setPastAppointments(submissions));
  }
}

export function* fetchTodayAppointmentsSaga({ payload: schedulerId }) {
  const kappSlug = yield select(state => state.app.config.kappSlug);
  const searchBuilder = new CoreAPI.SubmissionSearch()
    .limit(1000)
    .include('details,values')
    .coreState('Submitted')
    .eq('values[Scheduler Id]', schedulerId)
    .eq('values[Event Date]', moment().format('YYYY-MM-DD'));

  const { submissions, errors, serverError } = yield call(
    CoreAPI.searchSubmissions,
    {
      search: searchBuilder.build(),
      form: APPOINTMENT_FORM_SLUG,
      kapp: kappSlug,
    },
  );

  if (serverError) {
    yield put(
      actions.setTodayAppointmentErrors([
        serverError.error || serverError.statusText,
      ]),
    );
  } else if (errors) {
    yield put(actions.setTodayAppointmentErrors(errors));
  } else {
    yield put(actions.setTodayAppointments(submissions));
  }
}

export function* watchAppointments() {
  yield takeEvery(types.FETCH_APPOINTMENT, fetchAppointmentSaga);
  yield takeEvery(
    types.FETCH_UPCOMING_APPOINTMENTS,
    fetchUpcomingAppointmentsSaga,
  );
  yield takeEvery(types.FETCH_PAST_APPOINTMENTS, fetchPastAppointmentsSaga);
  yield takeEvery(types.FETCH_TODAY_APPOINTMENTS, fetchTodayAppointmentsSaga);
}

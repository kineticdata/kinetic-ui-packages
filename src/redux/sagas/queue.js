import { delay } from 'redux-saga';
import {
  all,
  select,
  call,
  put,
  takeEvery,
  takeLatest,
} from 'redux-saga/effects';
import moment from 'moment';
import {
  defineKqlQuery,
  searchSubmissions,
  fetchSubmission,
  updateSubmission,
  submitSubmission,
} from '@kineticdata/react';
import isFunction from 'is-function';
import { addToastAlert } from '@kineticdata/bundle-common';
import { types, actions } from '../modules/queue';

export const ERROR_STATUS_STRING = 'There was a problem retrieving items.';

export const SUBMISSION_INCLUDES =
  'details,values,attributes,form,form.kapp,children,children.details,children.form,children.form.kapp,children.values,form.attributes,parent,parent.details,parent.values,parent.form,parent.form.kapp';
export const SUBMISSION_LIST_INCLUDES = [
  'details',
  'form',
  'form.kapp',
  'values',
];

const calculateTeams = (myTeams, teams) =>
  teams.isEmpty()
    ? myTeams.map(t => t.name)
    : teams.toSet().intersect(myTeams.map(t => t.name));

export const buildSearch = (filter, appSettings, profile) => {
  const searcher = defineKqlQuery();
  const searcherParams = {};

  // Make sure there is a valid assignment in the searcher
  let invalidAssignment = true;

  if (filter.createdByMe) {
    searcher.equals('createdBy', 'username');
    searcherParams.username = profile.username;
    invalidAssignment = false;
  }

  if (filter.assignments === 'mine') {
    searcher.equals('values[Assigned Individual]', 'username');
    searcherParams.username = profile.username;
    invalidAssignment = false;
  } else if (
    filter.assignments === 'unassigned' &&
    (appSettings.myTeams.size > 0 || filter.createdByMe)
  ) {
    searcher.equals('values[Assigned Individual]', 'null', true);
    searcherParams.null = null;
  }

  if (
    appSettings.myTeams.size > 0 &&
    (filter.teams.size > 0 ||
      (filter.assignments !== 'mine' && !filter.createdByMe))
  ) {
    searcher.in('values[Assigned Team]', 'teams');
    searcherParams.teams = calculateTeams(
      appSettings.myTeams,
      filter.teams,
    ).toJS();
    invalidAssignment = false;
  }

  if (filter.status.size > 0) {
    if (filter.status.size === 1) {
      searcher.equals('values[Status]', 'status');
      searcherParams.status = filter.status.first();
    } else {
      searcher.in('values[Status]', 'status');
      searcherParams.status = filter.status.toJS();
    }
  }

  if (filter.dateRange.custom) {
    searcher.between(
      filter.dateRange.timeline === 'completedAt'
        ? 'closedAt'
        : filter.dateRange.timeline,
      'start',
      'end',
    );
    searcherParams.start = moment(filter.dateRange.start).toISOString();
    searcherParams.end = moment(filter.dateRange.end)
      .add(1, 'day')
      .toISOString();
  } else if (filter.dateRange.preset !== '') {
    // Compute the number of days specified in the preset date range, just use
    // regex to get the number. If the string does not match the pattern log a
    // warning and default to 7.
    const match = filter.dateRange.preset.match(/^(\d+)days$/);
    const numberOfDays = match ? parseInt(match[1], 10) : 7;
    if (!match) {
      window.console.warn(
        `Invalid date range filter preset: ${filter.dateRange.preset}`,
      );
    }
    searcher.greaterThan(
      filter.dateRange.timeline === 'completedAt'
        ? 'closedAt'
        : filter.dateRange.timeline,
      'start',
    );
    searcherParams.start = moment()
      .startOf('day')
      .subtract(numberOfDays, 'days')
      .toISOString();
  }

  return {
    search: {
      q: searcher.end()(searcherParams),
      orderBy: filter.sortBy,
      direction: filter.sortDirection,
      include: SUBMISSION_LIST_INCLUDES,
    },
    invalidAssignment,
  };
};

export function* fetchListTask(action) {
  try {
    const filter = yield select(state => state.queue.currentFilter);
    if (filter) {
      const appSettings = yield select(state => state.queueApp);
      const profile = yield select(state => state.app.profile);
      const kappSlug = yield select(state => state.app.kappSlug);
      const { search, invalidAssignment } = yield call(
        buildSearch,
        filter,
        appSettings,
        profile,
      );
      const pageToken = yield select(state => state.queue.pageToken);
      const limit = yield select(state => state.queue.limit);
      const hasPreviousPage = yield select(
        state => state.queue.hasPreviousPage,
      );

      // If invalidAssignment is true, then there is a problem with the query
      // and we should immediately yield an empty list.
      if (invalidAssignment) {
        yield put(actions.setListItems(filter, []));
        yield put(
          actions.fetchListSuccess({ submissions: [], nextPageToken: null }),
        );
      } else {
        const {
          submissions,
          nextPageToken,
          error,
          count,
          countPageToken,
        } = yield call(searchSubmissions, {
          kapp: kappSlug,
          search,
          limit,
          pageToken,
          count: !pageToken,
        });

        if (error) {
          yield put(actions.fetchListFailure(error));
        } else if (
          (!submissions || submissions.length === 0) &&
          hasPreviousPage
        ) {
          // If there are no submissions but there are previous pages, fetch the
          // previous page. This can occur if the last item on a page was updated
          // to no longer match the current filter criteria.
          yield put(actions.fetchListPrevious());
        } else {
          yield put(actions.fetchListSuccess({ submissions, nextPageToken }));

          // Update count if it was fetched
          if (typeof count !== 'undefined') {
            yield put(
              actions.fetchListCountSuccess({
                filter,
                count: countPageToken ? `${count}+` : count,
              }),
            );
          }

          // Call the callback if provided
          if (typeof action.payload === 'function') {
            console.log('fetch completed -  calling callback', submissions);
            action.payload(submissions);
          }
        }
      }
    }
  } catch (e) {
    console.error('There was a problem fetching queue list items:', e);
  }
}

export function* fetchListCountTask(action) {
  try {
    const filter = action.payload;
    if (filter) {
      const appSettings = yield select(state => state.queueApp);
      const profile = yield select(state => state.app.profile);
      const kappSlug = yield select(state => state.app.kappSlug);
      const { search, invalidAssignment } = yield call(
        buildSearch,
        filter,
        appSettings,
        profile,
      );

      // If invalidAssignment is true, then there is a problem with the query
      // and we should immediately yield an empty list.
      if (invalidAssignment) {
        yield put(actions.fetchListSuccess([], null));
      } else {
        const { error, count, countPageToken } = yield call(searchSubmissions, {
          kapp: kappSlug,
          search,
          count: true,
          limit: 0,
        });

        if (!error && typeof count !== 'undefined') {
          yield put(
            actions.fetchListCountSuccess({
              filter,
              count: countPageToken ? `${count}+` : count,
            }),
          );
        }
      }
    }
  } catch (e) {
    console.error('There was a problem fetching queue list counts:', e);
  }
}

export function* fetchCurrentItemTask(action) {
  const { submission, error } = yield call(fetchSubmission, {
    id: action.payload,
    include: SUBMISSION_INCLUDES,
  });

  if (!error) {
    yield put(actions.setCurrentItem(submission));
  } else {
    yield put(addToastAlert('Failed to retrieve item!'));
  }
}

export function* updateQueueItemTask(action) {
  const { submission } = yield call(updateSubmission, {
    id: action.payload.id,
    values: action.payload.values,
    include: SUBMISSION_INCLUDES,
  });

  if (submission) {
    if (isFunction(action.payload.onSuccess)) {
      action.payload.onSuccess(submission);
    }
  } else {
    yield put(addToastAlert('Failed to update item!'));
  }
}

export function* bulkAssignTask(action) {
  const submissions = yield select(state => state.queue.selectedList);
  const assignment = action.payload.assignment;

  if (!submissions || !assignment) {
    return;
  }

  yield all(
    submissions
      .toList()
      .map((submission, i) =>
        call(updateBulkSubmission, {
          id: submission.id,
          values: { ...submission.values, ...assignment },
          include: SUBMISSION_LIST_INCLUDES.join(','),
        }),
      )
      .toJS(),
  );

  // Delay to make the UI less jumpy
  yield delay(500);
  yield put(actions.bulkAssignComplete());
}

function* updateBulkSubmission(params) {
  const { submission, error } = yield call(updateSubmission, params);

  if (error) {
    yield put(
      actions.bulkStatusUpdate({
        status: 'error',
        data: { ...error, submissionId: params.id },
      }),
    );
  } else {
    yield put(
      actions.bulkStatusUpdate({ status: 'success', data: submission }),
    );
  }
}

export function* bulkWorkTask(action) {
  const submissions = yield select(state => state.queue.selectedList);
  const profile = yield select(state => state.app.profile);
  // Override the assigned individual to be the current user in case someone
  // grabbed this ticket while the bulk action was being taken
  const assignment = {
    'Assigned Individual': profile.username,
    'Assigned Individual Display Name': profile.displayName || profile.username,
  };
  const values = action.payload.values;

  if (!submissions || !values) {
    return;
  }

  yield all(
    submissions
      .toList()
      .map((submission, i) =>
        call(submitBulkSubmission, {
          id: submission.id,
          page: submission.currentPage,
          values: { ...submission.values, ...assignment, ...values },
          include: SUBMISSION_LIST_INCLUDES.join(','),
        }),
      )
      .toJS(),
  );

  // Delay to make the UI less jumpy
  yield delay(500);
  yield put(actions.bulkWorkComplete());
}

function* submitBulkSubmission(params) {
  const { submission, error } = yield call(submitSubmission, params);

  if (error) {
    yield put(
      actions.bulkStatusUpdate({
        status: 'error',
        data: { ...error, submissionId: params.id },
      }),
    );
  } else {
    yield put(
      actions.bulkStatusUpdate({ status: 'success', data: submission }),
    );
  }
}

export function* watchQueue() {
  yield takeLatest(
    [
      types.FETCH_LIST_REQUEST,
      types.FETCH_LIST_PREVIOUS,
      types.FETCH_LIST_NEXT,
      types.FETCH_LIST_RESET,
      types.UPDATE_LIST_LIMIT,
    ],
    fetchListTask,
  );
  yield takeEvery(types.FETCH_LIST_COUNT_REQUEST, fetchListCountTask);
  yield takeEvery(types.FETCH_CURRENT_ITEM, fetchCurrentItemTask);
  yield takeEvery(types.UPDATE_QUEUE_ITEM, updateQueueItemTask);
  yield takeEvery(types.BULK_ASSIGN_REQUEST, bulkAssignTask);
  yield takeEvery(types.BULK_WORK_REQUEST, bulkWorkTask);
}

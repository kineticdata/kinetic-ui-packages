import {
  all,
  call,
  put,
  select,
  takeLatest,
  takeEvery,
} from 'redux-saga/effects';
import { List } from 'immutable';
import { fetchForms, fetchTeams, updateProfile } from '@kineticdata/react';
import { Utils, addToast } from '@kineticdata/bundle-common';
import { actions, types } from '../modules/queueApp';
import { filterReviver } from '../../records';

// We'll implicitly believe teams to be assignable.
export const isAssignable = team => {
  if (!team.attributes) {
    return true;
  }

  // Fetch the assignable attribute and determine if it is false.
  if (team.attributes instanceof Array) {
    // When we're dealing with sub-elements they're not "translated" for us.
    const assignable = team.attributes.find(a => a.name === 'Assignable');
    if (assignable && assignable.values[0].toUpperCase() === 'FALSE') {
      return false;
    }
  } else if (
    team.attributes.Assignable &&
    team.attributes.Assignable[0].toUpperCase() === 'FALSE'
  ) {
    return false;
  }

  return true;
};

export function* fetchAppSettingsTask() {
  const kappSlug = yield select(state => state.app.kappSlug);
  const profile = yield select(state => state.app.profile);

  const {
    forms: { forms, error: formsError },
    teams: { teams, error: teamsError },
  } = yield all({
    forms: call(fetchForms, {
      kappSlug,
      include: 'details,attributes,fields,fields.details,kapp',
    }),
    teams: call(fetchTeams, {
      include:
        'details,attributes,memberships,memberships.user,memberships.user.details',
    }),
  });

  if (formsError || teamsError) {
    yield put(
      actions.fetchAppDataFailure(
        List([formsError, teamsError]).filter(e => e),
      ),
    );
  } else {
    const allTeams = teams.filter(isAssignable);
    const myTeams = List(
      profile.memberships
        .map(membership => membership.team)
        .filter(isAssignable),
    ).sortBy(team => team.name);

    const myFilters = Utils.getProfileAttributeValues(
      profile,
      'Queue Personal Filters',
    )
      .map(filterReviver)
      .filter(f => f);

    const appSettings = {
      myTeams,
      myFilters,
      forms,
      allTeams,
    };

    yield put(actions.fetchAppDataSuccess(appSettings));
  }
}

export function* updatePersonalFilterTask(action) {
  const myFilters = yield select(state => state.queueApp.myFilters);

  const { error } = yield call(updateProfile, {
    profile: {
      profileAttributesMap: {
        'Queue Personal Filters': myFilters
          .toJS()
          .map(filter => JSON.stringify(filter)),
      },
    },
  });

  if (error) {
    const actionText =
      action.type === types.REMOVE_PERSONAL_FILTER ? 'deleting' : 'saving';
    addToast({ severity: 'danger', message: `Error ${actionText} filter.` });
  } else {
    const actionText =
      action.type === types.REMOVE_PERSONAL_FILTER ? 'deleted' : 'saved';
    addToast(`Filter ${actionText} successfully.`);
  }
}

export function* watchApp() {
  yield takeEvery(types.FETCH_APP_DATA_REQUEST, fetchAppSettingsTask);
  yield takeLatest(
    [
      types.ADD_PERSONAL_FILTER,
      types.REMOVE_PERSONAL_FILTER,
      types.UPDATE_PERSONAL_FILTER,
    ],
    updatePersonalFilterTask,
  );
}

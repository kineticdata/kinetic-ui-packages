import { Map, Record } from 'immutable';
import {
  Utils,
  selectHasRoleSchedulerAdmin,
  selectHasRoleSchedulerManager,
} from '@kineticdata/bundle-common';
import { NOTIFICATIONS_FORM_SLUG } from '../../redux/modules/settingsNotifications';
import { ROBOT_FORM_SLUG } from '../../redux/modules/settingsRobots';
import { CALENDAR_FORM_SLUG } from '../../redux/modules/settingsCalendars';
const { noPayload, withPayload } = Utils;
const ns = Utils.namespaceBuilder('settings/settingsApp');

export const types = {
  FETCH_APP_DATA_REQUEST: ns('FETCH_APP_DATA_REQUEST'),
  FETCH_APP_DATA_SUCCESS: ns('FETCH_APP_DATA_SUCCESS'),
  FETCH_APP_DATA_FAILURE: ns('FETCH_APP_DATA_FAILURE'),
};

export const actions = {
  fetchAppDataRequest: noPayload(types.FETCH_APP_DATA_REQUEST),
  fetchAppDataSuccess: withPayload(types.FETCH_APP_DATA_SUCCESS),
  fetchAppDataFailure: withPayload(types.FETCH_APP_DATA_FAILURE),
};

export const State = Record({
  loading: true,
  error: null,
  hasDatastoreAccess: true,
  hasNotificationAccess: false,
  hasRobotAccess: false,
  hasCalendarAccess: false,
  hasSchedulerAccess: false,
  hasTeamAccess: false,
  hasUserAccess: false,
});

export const reducer = (state = State(), { type, payload }) => {
  switch (type) {
    case types.FETCH_APP_DATA_REQUEST:
      return state.set('error', null);
    case types.FETCH_APP_DATA_SUCCESS:
      const formMap = payload.forms.reduce(
        (map, form) => map.set(form.slug, true),
        Map(),
      );
      return (
        state
          .set('loading', false)
          // All users have access to datastores - individual access limited by form security policies
          .set('hasDatastoreAccess', true)
          // Notifications available to users who have access to notification form
          .set('hasNotificationAccess', formMap.has(NOTIFICATIONS_FORM_SLUG))
          // Robots available to users who have access to robot form
          .set('hasRobotAccess', formMap.has(ROBOT_FORM_SLUG))
          // Calendar available to users who have access to the calendar configuration form
          .set('hasCalendarAccess', formMap.has(CALENDAR_FORM_SLUG))
          // Schedulers available to scheduler admins or scheduler managers
          .set(
            'hasSchedulerAccess',
            selectHasRoleSchedulerAdmin(payload.me) ||
              selectHasRoleSchedulerManager(payload.me),
          )
          // Teams available to space admins
          .set('hasTeamAccess', !!payload.me.spaceAdmin)
          // Users available to space admins
          .set('hasUserAccess', !!payload.me.spaceAdmin)
      );
    case types.FETCH_APP_DATA_FAILURE:
      return state.set('loading', false).set('error', payload);
    default:
      return state;
  }
};

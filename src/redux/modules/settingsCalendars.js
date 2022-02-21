import { Record } from 'immutable';
import { Utils } from '@kineticdata/bundle-common';
const { noPayload, withPayload } = Utils;
const ns = Utils.namespaceBuilder('settings/robots');

export const CALENDAR_FORM_SLUG = 'calendar-configurations';

export const types = {
  FETCH_CALENDARS_REQUEST: ns('FETCH_CALENDARS_REQUEST'),
  FETCH_CALENDARS_SUCCESS: ns('FETCH_CALENDARS_SUCCESS'),
  FETCH_CALENDARS_FAILURE: ns('FETCH_CALENDARS_FAILURE'),

  CLONE_CALENDAR_REQUEST: ns('CLONE_CALENDAR_REQUEST'),
  DELETE_CALENDAR_REQUEST: ns('DELETE_CALENDAR_REQUEST'),
  CLEAR_CALENDAR: ns('CLEAR_CALENDAR'),
};

export const actions = {
  fetchCalendarsRequest: noPayload(types.FETCH_CALENDARS_REQUEST),
  fetchCalendarsSuccess: withPayload(types.FETCH_CALENDARS_SUCCESS),
  fetchCalendarsFailure: withPayload(types.FETCH_CALENDARS_FAILURE),

  cloneCalendarRequest: withPayload(types.CLONE_CALENDAR_REQUEST),
  deleteCalendarRequest: withPayload(types.DELETE_CALENDAR_REQUEST),
  clearCalendar: noPayload(types.CLEAR_CALENDAR),
};

export const State = Record({
  calendars: null,
  calendarsError: null,
});

export const reducer = (state = State(), { type, payload }) => {
  switch (type) {
    case types.FETCH_CALENDARS_REQUEST:
      return state.set('calendarsError', null);
    case types.FETCH_CALENDARS_SUCCESS:
      return state.set('calendars', payload);
    case types.FETCH_CALENDARS_FAILURE:
      return state.set('calendarsError', payload);

    case types.CLEAR_CALENDAR:
      return state.set('calendar', null);

    default:
      return state;
  }
};

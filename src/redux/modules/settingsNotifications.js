import { Record } from 'immutable';
import { Utils } from '@kineticdata/bundle-common';
const { noPayload, withPayload } = Utils;
const ns = Utils.namespaceBuilder('settings/notifications');

export const NOTIFICATIONS_FORM_SLUG = 'notification-data';
export const NOTIFICATIONS_DATE_FORMAT_FORM_SLUG =
  'notification-template-dates';

export const types = {
  FETCH_SNIPPETS_REQUEST: ns('FETCH_SNIPPETS_REQUEST'),
  FETCH_SNIPPETS_SUCCESS: ns('FETCH_SNIPPETS_SUCCESS'),
  FETCH_SNIPPETS_FAILURE: ns('FETCH_SNIPPETS_FAILURE'),

  FETCH_NOTIFICATION_REQUEST: ns('FETCH_NOTIFICATION_REQUEST'),
  FETCH_NOTIFICATION_SUCCESS: ns('FETCH_NOTIFICATION_SUCCESS'),
  FETCH_NOTIFICATION_FAILURE: ns('FETCH_NOTIFICATION_FAILURE'),

  CLONE_NOTIFICATION_REQUEST: ns('CLONE_NOTIFICATION_REQUEST'),
  DELETE_NOTIFICATION_REQUEST: ns('DELETE_NOTIFICATION_REQUEST'),
  SAVE_NOTIFICATION_REQUEST: ns('SAVE_NOTIFICATION_REQUEST'),

  FETCH_VARIABLES_REQUEST: ns('FETCH_VARIABLES_REQUEST'),
  FETCH_VARIABLES_SUCCESS: ns('FETCH_VARIABLES_SUCCESS'),
  FETCH_VARIABLES_FAILURE: ns('FETCH_VARIABLES_FAILURE'),

  FETCH_DATE_FORMATS_REQUEST: ns('FETCH_DATE_FORMATS_REQUEST'),
  FETCH_DATE_FORMATS_SUCCESS: ns('FETCH_DATE_FORMATS_SUCCESS'),
  FETCH_DATE_FORMATS_FAILURE: ns('FETCH_DATE_FORMATS_FAILURE'),
};

export const actions = {
  fetchSnippetsRequest: noPayload(types.FETCH_SNIPPETS_REQUEST),
  fetchSnippetsSuccess: withPayload(types.FETCH_SNIPPETS_SUCCESS),
  fetchSnippetsFailure: withPayload(types.FETCH_SNIPPETS_FAILURE),

  fetchNotificationRequest: withPayload(types.FETCH_NOTIFICATION_REQUEST),
  fetchNotificationSuccess: withPayload(types.FETCH_NOTIFICATION_SUCCESS),
  fetchNotificationFailure: withPayload(types.FETCH_NOTIFICATION_FAILURE),

  cloneNotificationRequest: withPayload(types.CLONE_NOTIFICATION_REQUEST),
  deleteNotificationRequest: withPayload(types.DELETE_NOTIFICATION_REQUEST),
  saveNotificationRequest: withPayload(types.SAVE_NOTIFICATION_REQUEST),

  fetchVariablesRequest: withPayload(types.FETCH_VARIABLES_REQUEST),
  fetchVariablesSuccess: withPayload(types.FETCH_VARIABLES_SUCCESS),
  fetchVariablesFailure: withPayload(types.FETCH_VARIABLES_FAILURE),

  fetchDateFormatsRequest: withPayload(types.FETCH_DATE_FORMATS_REQUEST),
  fetchDateFormatsSuccess: withPayload(types.FETCH_DATE_FORMATS_SUCCESS),
  fetchDateFormatsFailure: withPayload(types.FETCH_DATE_FORMATS_FAILURE),
};

export const State = Record({
  notification: null,
  notificationError: null,
  snippets: [],
  snippetsError: null,
  dateFormats: [],
  dateFormatsError: null,
  variables: null,
  variablesError: null,
});

export const reducer = (state = State(), { type, payload }) => {
  switch (type) {
    case types.FETCH_SNIPPETS_REQUEST:
      return state.set('snippetsError', null);
    case types.FETCH_SNIPPETS_SUCCESS:
      return state.set('snippets', payload);
    case types.FETCH_SNIPPETS_FAILURE:
      return state.set('snippetsError', payload);

    case types.FETCH_NOTIFICATION_REQUEST:
      return state.set('notificationError', null).set('notification', null);
    case types.FETCH_NOTIFICATION_SUCCESS:
      return state.set('notification', payload);
    case types.FETCH_NOTIFICATION_FAILURE:
      return state.set('notificationError', payload);

    case types.FETCH_VARIABLES_REQUEST:
      return state.set('variablesError', null).set('variables', null);
    case types.FETCH_VARIABLES_SUCCESS:
      return state.set('variables', payload);
    case types.FETCH_VARIABLES_FAILURE:
      return state.set('variablesErrors', payload);

    case types.FETCH_DATE_FORMATS_REQUEST:
      return state.set('dateFormatsError', null);
    case types.FETCH_DATE_FORMATS_SUCCESS:
      return state.set('dateFormats', payload);
    case types.FETCH_DATE_FORMATS_FAILURE:
      return state.set('dateFormatsError', payload);
    default:
      return state;
  }
};

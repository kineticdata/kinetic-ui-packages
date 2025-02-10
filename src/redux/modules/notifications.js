import { Record } from 'immutable';
import { Utils } from '@kineticdata/bundle-common';
const ns = Utils.namespaceBuilder('survey/notifications');

const { noPayload, withPayload } = Utils;

export const NOTIFICATIONS_FORM_SLUG = 'notification-data';

export const types = {
  FETCH_NOTIFICATIONS: ns('FETCH_NOTIFICATIONS'),
  SET_NOTIFICATIONS: ns('SET_NOTIFICATIONS'),
  SET_FETCH_NOTIFICATIONS_ERROR: ns('SET_FETCH_NOTIFICATIONS_ERROR'),
  FETCH_NOTIFICATION: ns('FETCH_NOTIFICATION'),
  SET_NOTIFICATION: ns('SET_NOTIFICATION'),
  RESET_NOTIFICATION: ns('RESET_NOTIFICATION'),
  CLONE_NOTIFICATION: ns('CLONE_NOTIFICATION'),
  SET_CLONE_SUCCESS: ns('SET_CLONE_SUCCESS'),
  SET_CLONE_ERROR: ns('SET_CLONE_ERROR'),
};

export const actions = {
  fetchNotifications: noPayload(types.FETCH_NOTIFICATIONS),
  setNotifications: withPayload(types.SET_NOTIFICATIONS),
  setFetchNotificationsError: withPayload(types.SET_FETCH_NOTIFICATIONS_ERROR),
  fetchNotification: withPayload(types.FETCH_NOTIFICATION),
  setNotification: withPayload(types.SET_NOTIFICATION),
  resetNotification: noPayload(types.RESET_NOTIFICATION),
  cloneNotification: withPayload(types.CLONE_NOTIFICATION),
  setCloneSuccess: noPayload(types.SET_CLONE_SUCCESS),
  setCloneError: withPayload(types.SET_CLONE_ERROR),
};

export const State = Record({
  // Notification List
  loading: true,
  errors: [],
  notificationTemplates: [],
  // Notification List Actions
  cloning: false,
  deleting: false,
  saving: false,
  submissionActionErrors: [],
  // Single Notification
  notification: null,
  notificationLoading: true,
});

export const notificationsReducer = (state = State(), { type, payload }) => {
  switch (type) {
    case types.FETCH_NOTIFICATIONS:
      return state.set('loading', true).set('errors', []);
    case types.SET_NOTIFICATIONS:
      return state
        .set('loading', false)
        .set('errors', [])
        .set('notificationTemplates', payload);
    case types.SET_FETCH_NOTIFICATIONS_ERROR:
      return state.set('loading', false).set('errors', payload);
    case types.FETCH_NOTIFICATION:
      return state.set('notificationLoading', true);
    case types.SET_NOTIFICATION:
      return state
        .set('notificationLoading', false)
        .set('notification', payload);
    case types.CLONE_NOTIFICATION:
      return state.set('cloning', true);
    case types.SET_CLONE_SUCCESS:
      return state.set('cloning', false);
    case types.SET_CLONE_ERROR:
      return state.set('cloning', false).set('submissionActionErrors', payload);
    case types.RESET_NOTIFICATION:
      return state
        .delete('notification')
        .delete('notificationLoading')
        .delete('submissionActionErrors');
    default:
      return state;
  }
};

export default notificationsReducer;

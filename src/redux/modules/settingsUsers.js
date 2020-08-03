import { Record, List } from 'immutable';
import { Utils } from '@kineticdata/bundle-common';
const { noPayload, withPayload } = Utils;
const ns = Utils.namespaceBuilder('settings/users');

export const State = Record({
  fetchingAll: false,
  exportUsers: List(),
  modalIsOpen: false,
  modalName: '',
  importing: false,
  importCounts: {},
  importErrors: List(),
});

export const types = {
  CLONE_USER_REQUEST: ns('CLONE_USER_REQUEST'),
  DELETE_USER_REQUEST: ns('DELETE_USER_REQUEST'),

  OPEN_MODAL: ns('OPEN_MODAL'),
  CLOSE_MODAL: ns('CLOSE_MODAL'),

  IMPORT_USERS_REQUEST: ns('IMPORT_USERS_REQUEST'),
  IMPORT_USERS_COMPLETE: ns('IMPORT_USERS_COMPLETE'),
  IMPORT_USERS_RESET: ns('IMPORT_USERS_RESET'),

  FETCH_ALL_USERS: ns('FETCH_ALL_USERS'),
  SET_EXPORT_USERS: ns('SET_EXPORT_USERS'),
};

export const actions = {
  cloneUserRequest: withPayload(types.CLONE_USER_REQUEST),
  deleteUserRequest: withPayload(types.DELETE_USER_REQUEST),

  openModal: withPayload(types.OPEN_MODAL),
  closeModal: noPayload(types.CLOSE_MODAL),

  importUsersRequest: withPayload(types.IMPORT_USERS_REQUEST),
  importUsersComplete: withPayload(types.IMPORT_USERS_COMPLETE),
  importUsersReset: withPayload(types.IMPORT_USERS_RESET),

  fetchAllUsers: withPayload(types.FETCH_ALL_USERS),
  setExportUsers: withPayload(types.SET_EXPORT_USERS),
};

export const reducer = (state = State(), { type, payload }) => {
  switch (type) {
    case types.OPEN_MODAL:
      return state.set('modalIsOpen', true).set('modalName', payload);
    case types.CLOSE_MODAL:
      return state.set('modalIsOpen', false).set('modalName', '');

    case types.IMPORT_USERS_REQUEST:
      return state
        .set('importing', 'STARTED')
        .set('importErrors', List())
        .set('importCounts', { total: payload.length });
    case types.IMPORT_USERS_COMPLETE:
      return state
        .set('importing', 'COMPLETED')
        .set('importErrors', payload.errors ? List(payload.errors) : List())
        .update(
          'importCounts',
          counts =>
            payload.counts ? { ...counts, ...payload.counts } : counts,
        );
    case types.IMPORT_USERS_RESET:
      return state
        .set('importErrors', List())
        .set('importCounts', {})
        .set('importing', null);

    case types.FETCH_ALL_USERS:
      return state.set('fetchingAll', true).set('exportUsers', List());
    case types.SET_EXPORT_USERS:
      return state
        .update(
          'exportUsers',
          users => (payload.error ? List() : users.concat(List(payload.data))),
        )
        .set('fetchingAll', !payload.completed && !payload.error);

    default:
      return state;
  }
};

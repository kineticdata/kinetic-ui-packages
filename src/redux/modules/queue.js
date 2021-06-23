import { Record, Map, List, is } from 'immutable';
import { Utils } from '@kineticdata/bundle-common';
import { Filter } from '../../records';
const { withPayload, noPayload } = Utils;
const ns = Utils.namespaceBuilder('queue/list');

export const types = {
  FETCH_LIST_REQUEST: ns('FETCH_LIST_REQUEST'),
  FETCH_LIST_SUCCESS: ns('FETCH_LIST_SUCCESS'),
  FETCH_LIST_FAILURE: ns('FETCH_LIST_FAILURE'),
  FETCH_LIST_PREVIOUS: ns('FETCH_LIST_PREVIOUS'),
  FETCH_LIST_NEXT: ns('FETCH_LIST_NEXT'),
  FETCH_LIST_RESET: ns('FETCH_LIST_RESET'),

  FETCH_LIST_COUNT_REQUEST: ns('FETCH_LIST_COUNT_REQUEST'),
  FETCH_LIST_COUNT_SUCCESS: ns('FETCH_LIST_COUNT_SUCCESS'),

  FETCH_CURRENT_ITEM: ns('FETCH_CURRENT_ITEM'),
  SET_CURRENT_ITEM: ns('SET_CURRENT_ITEM'),
  UPDATE_QUEUE_ITEM: ns('UPDATE_QUEUE_ITEM'),

  SET_ADHOC_FILTER: ns('SET_ADHOC_FILTER'),

  OPEN_NEW_MENU: ns('OPEN_NEW_MENU'),
  CLOSE_NEW_MENU: ns('CLOSE_NEW_MENU'),
};

export const actions = {
  fetchListRequest: withPayload(types.FETCH_LIST_REQUEST),
  fetchListSuccess: withPayload(types.FETCH_LIST_SUCCESS),
  fetchListFailure: withPayload(types.FETCH_LIST_FAILURE),
  fetchListPrevious: withPayload(types.FETCH_LIST_PREVIOUS),
  fetchListNext: withPayload(types.FETCH_LIST_NEXT),
  fetchListReset: withPayload(types.FETCH_LIST_RESET),

  fetchListCountRequest: withPayload(types.FETCH_LIST_COUNT_REQUEST),
  fetchListCountSuccess: withPayload(types.FETCH_LIST_COUNT_SUCCESS),

  fetchCurrentItem: withPayload(types.FETCH_CURRENT_ITEM),
  setCurrentItem: withPayload(types.SET_CURRENT_ITEM),
  updateQueueItem: withPayload(types.UPDATE_QUEUE_ITEM),

  setAdhocFilter: withPayload(types.SET_ADHOC_FILTER),

  openNewItemMenu: withPayload(types.OPEN_NEW_MENU),
  closeNewItemMenu: noPayload(types.CLOSE_NEW_MENU),
};

export const selectPrevAndNext = (state, filter) => {
  // TODO
  const queueItems = state.queue.data || List();
  const currentItemIndex = queueItems.findIndex(
    item => item.id === state.queue.currentItem.id,
  );
  const prev =
    currentItemIndex > 0 ? queueItems.get(currentItemIndex - 1).id : null;
  const next =
    currentItemIndex < queueItems.size - 1
      ? queueItems.get(currentItemIndex + 1).id
      : null;
  return { prev, next };
};

export const State = Record({
  currentFilter: null,
  loading: true,
  paging: false,
  data: null,
  error: null,
  pageToken: null,
  nextPageToken: null,
  previousPageTokens: List(),
  hasPreviousPage: false,
  hasNextPage: false,
  pageIndexStart: 0,
  pageIndexEnd: 0,
  limit: 10,
  counts: Map(),

  currentItem: null,
  currentItemLoading: false,

  adhocFilter: Filter({
    type: 'adhoc',
    assignments: 'mine',
  }),

  newItemMenuOpen: false,
  newItemMenuOptions: Map(),
});

const updatePageMetadata = state =>
  state
    .set('hasPreviousPage', state.previousPageTokens.size > 0)
    .set('hasNextPage', !!state.nextPageToken)
    .set(
      'pageIndexStart',
      state.previousPageTokens.size * state.limit +
        (state.data && state.data.size > 0 ? 1 : 0),
    )
    .set(
      'pageIndexEnd',
      state.previousPageTokens.size * state.limit +
        (state.data ? state.data.size : 0),
    );

export const reducer = (state = State(), { type, payload }) => {
  switch (type) {
    case types.FETCH_LIST_REQUEST:
      return (!payload && state.currentFilter) ||
        is(payload, state.currentFilter)
        ? // If a payload isn't provided while a currentFilter is set or
          // currentFilter doesn't change, don't change state and just refresh
          // the current page data.
          state
        : state
            .set('currentFilter', payload)
            .set('loading', true)
            .set('paging', false)
            .set('data', null)
            .set('error', null)
            .set('pageToken', null)
            .set('nextPageToken', null)
            .set('previousPageTokens', List())
            .update(updatePageMetadata);
    case types.FETCH_LIST_SUCCESS:
      return state
        .set('loading', false)
        .set('paging', false)
        .set('data', List(payload.submissions))
        .set('nextPageToken', payload.nextPageToken)
        .update(updatePageMetadata);
    case types.FETCH_LIST_FAILURE:
      return state
        .set('loading', false)
        .set('paging', false)
        .set('error', payload);
    case types.FETCH_LIST_PREVIOUS:
      return state
        .set('nextPageToken', null)
        .set('pageToken', state.previousPageTokens.last())
        .update('previousPageTokens', t => t.pop())
        .set('paging', true);
    case types.FETCH_LIST_NEXT:
      return state
        .update('previousPageTokens', t => t.push(state.pageToken))
        .set('pageToken', state.nextPageToken)
        .set('nextPageToken', null)
        .set('paging', true);
    case types.FETCH_LIST_RESET:
      return state
        .set('currentFilter', payload || null)
        .set('loading', true)
        .set('paging', false)
        .set('data', null)
        .set('error', null)
        .set('pageToken', null)
        .set('nextPageToken', null)
        .set('previousPageTokens', List())
        .update(updatePageMetadata);

    case types.FETCH_LIST_COUNT_SUCCESS:
      return payload.filter
        ? state.setIn(['counts', payload.filter], payload.count)
        : state;

    case types.SET_ADHOC_FILTER:
      return state.set(
        'adhocFilter',
        payload
          .set(
            'name',
            payload.name &&
            (payload.type === 'custom' ||
              is(
                payload.delete('sortDirection'),
                state.currentFilter.delete('sortDirection'),
              ))
              ? payload.name
              : '',
          )
          .set('type', 'adhoc'),
      );

    case types.FETCH_CURRENT_ITEM:
      return state.set('currentItemLoading', true);
    case types.SET_CURRENT_ITEM:
      return state.set('currentItemLoading', false).set('currentItem', payload);

    case types.OPEN_NEW_MENU:
      return state
        .set('newItemMenuOpen', true)
        .set('newItemMenuOptions', Map(payload));
    case types.CLOSE_NEW_MENU:
      return state.set('newItemMenuOpen', false).remove('newItemMenuOptions');

    default:
      return state;
  }
};

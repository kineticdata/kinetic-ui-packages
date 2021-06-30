import { Record, Map, List, OrderedMap, is } from 'immutable';
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
  UPDATE_LIST_LIMIT: ns('UPDATE_LIST_LIMIT'),

  FETCH_LIST_COUNT_REQUEST: ns('FETCH_LIST_COUNT_REQUEST'),
  FETCH_LIST_COUNT_SUCCESS: ns('FETCH_LIST_COUNT_SUCCESS'),

  FETCH_CURRENT_ITEM: ns('FETCH_CURRENT_ITEM'),
  SET_CURRENT_ITEM: ns('SET_CURRENT_ITEM'),
  UPDATE_QUEUE_ITEM: ns('UPDATE_QUEUE_ITEM'),

  SET_ADHOC_FILTER: ns('SET_ADHOC_FILTER'),

  OPEN_NEW_MENU: ns('OPEN_NEW_MENU'),
  CLOSE_NEW_MENU: ns('CLOSE_NEW_MENU'),

  TOGGLE_SELECTION_MODE: ns('TOGGLE_SELECTION_MODE'),
  TOGGLE_SELECTED_ITEM: ns('TOGGLE_SELECTED_ITEM'),
  BULK_ASSIGN_REQUEST: ns('BULK_ASSIGN_REQUEST'),
  BULK_ASSIGN_COMPLETE: ns('BULK_ASSIGN_COMPLETE'),
  BULK_WORK_REQUEST: ns('BULK_WORK_REQUEST'),
  BULK_WORK_COMPLETE: ns('BULK_WORK_COMPLETE'),
  BULK_STATUS_UPDATE: ns('BULK_STATUS_UPDATE'),
  BULK_STATUS_RESET: ns('BULK_STATUS_RESET'),
};

export const actions = {
  fetchListRequest: withPayload(types.FETCH_LIST_REQUEST),
  fetchListSuccess: withPayload(types.FETCH_LIST_SUCCESS),
  fetchListFailure: withPayload(types.FETCH_LIST_FAILURE),
  fetchListPrevious: withPayload(types.FETCH_LIST_PREVIOUS),
  fetchListNext: withPayload(types.FETCH_LIST_NEXT),
  fetchListReset: withPayload(types.FETCH_LIST_RESET),
  updateListLimit: withPayload(types.UPDATE_LIST_LIMIT),

  fetchListCountRequest: withPayload(types.FETCH_LIST_COUNT_REQUEST),
  fetchListCountSuccess: withPayload(types.FETCH_LIST_COUNT_SUCCESS),

  fetchCurrentItem: withPayload(types.FETCH_CURRENT_ITEM),
  setCurrentItem: withPayload(types.SET_CURRENT_ITEM),
  updateQueueItem: withPayload(types.UPDATE_QUEUE_ITEM),

  setAdhocFilter: withPayload(types.SET_ADHOC_FILTER),

  openNewItemMenu: withPayload(types.OPEN_NEW_MENU),
  closeNewItemMenu: noPayload(types.CLOSE_NEW_MENU),

  toggleSelectionMode: withPayload(
    types.TOGGLE_SELECTION_MODE,
    'open',
    'items',
  ),
  toggleSelectedItem: withPayload(types.TOGGLE_SELECTED_ITEM, 'item', 'shift'),
  bulkAssignRequest: withPayload(types.BULK_ASSIGN_REQUEST),
  bulkAssignComplete: noPayload(types.BULK_ASSIGN_COMPLETE),
  bulkWorkRequest: withPayload(types.BULK_WORK_REQUEST),
  bulkWorkComplete: noPayload(types.BULK_WORK_COMPLETE),
  bulkStatusUpdate: withPayload(types.BULK_STATUS_UPDATE),
  bulkStatusReset: noPayload(types.BULK_STATUS_RESET),
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

  selectedList: null,
  bulkStatus: {},
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
            .update(updatePageMetadata)
            // Clear selection mode when filter changes
            .set('selectedList', null);
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
      return (
        state
          .set('currentFilter', payload || null)
          .set('loading', true)
          .set('paging', false)
          .set('data', null)
          .set('error', null)
          .set('pageToken', null)
          .set('nextPageToken', null)
          .set('previousPageTokens', List())
          .update(updatePageMetadata)
          // Clear selection mode when filter changes
          .update(
            'selectedList',
            selectedList =>
              !payload || !is(payload, state.currentFilter)
                ? null
                : selectedList,
          )
      );
    case types.UPDATE_LIST_LIMIT:
      return typeof payload === 'number'
        ? state
            .set('limit', payload)
            .set('loading', true)
            .set('paging', false)
            .set('data', null)
            .set('error', null)
            .set('pageToken', null)
            .set('nextPageToken', null)
            .set('previousPageTokens', List())
            .update(updatePageMetadata)
        : state;

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

    case types.TOGGLE_SELECTION_MODE:
      return state.update(
        'selectedList',
        selectedList =>
          typeof payload.open === 'boolean'
            ? payload.open
              ? Array.isArray(payload.items)
                ? payload.items.reduce(
                    (map, item) => map.set(item.id, item),
                    OrderedMap(),
                  )
                : OrderedMap()
              : null
            : selectedList === null
              ? OrderedMap()
              : null,
      );
    case types.TOGGLE_SELECTED_ITEM:
      return (
        state
          .update('selectedList', updateSelectedItems(payload, state.data))
          // Set the last item clicked as an extra property on the OrderedMap
          // for use when an item is shift clicked
          .update('selectedList', selectedList => {
            selectedList._lastSelectedItem = payload.item;
            return selectedList;
          })
      );
    case types.BULK_ASSIGN_REQUEST:
    case types.BULK_WORK_REQUEST:
      return state.set('bulkStatus', {
        type: type === types.BULK_ASSIGN_REQUEST ? 'assign' : 'work',
        open: true,
        completed: false,
        count: state.selectedList.size,
        items: state.selectedList.toList().toJS(),
        success: [],
        error: [],
      });
    case types.BULK_ASSIGN_COMPLETE:
    case types.BULK_WORK_COMPLETE:
      return state.setIn(['bulkStatus', 'completed'], true);
    case types.BULK_STATUS_UPDATE:
      return state.updateIn(['bulkStatus', payload.status], list => [
        ...list,
        payload.data,
      ]);
    case types.BULK_STATUS_RESET:
      return state.set('bulkStatus', {});

    default:
      return state;
  }
};

const updateSelectedItems = ({ item, shift }, data) => selectedList => {
  if (selectedList) {
    // If shift key is pressed when an item is clicked, select or deselect all
    // items between the current one and the last one clicked
    if (shift) {
      // Get last item and index of last item in current data set
      const lastItem = selectedList._lastSelectedItem;
      const lastIndex = lastItem
        ? data.findIndex(d => d.id === lastItem.id)
        : -1;
      // Get index of the current clicked item
      const currentIndex = data.findIndex(d => d.id === item.id);
      // Check is the currently clicked item is being added or removed, and
      // replicate the same action for all items in the range
      const isAdd = !selectedList.has(item.id);

      if (currentIndex >= 0 && lastIndex >= 0 && currentIndex !== lastIndex) {
        // Create a range between the two items and fill it with the indexes of
        // all the items in that range
        return Array(Math.abs(currentIndex - lastIndex) + 1)
          .fill()
          .map((v, i) => i + Math.min(currentIndex, lastIndex))
          .reduce((list, index) => {
            // Reduce the list of indexes and update the selected list by adding
            //or removing the relevant items
            const dataItem = data.get(index);
            if (isAdd && !list.has(dataItem.id)) {
              return list.set(dataItem.id, dataItem);
            } else if (!isAdd && list.has(dataItem.id)) {
              return list.delete(dataItem.id);
            }
            return list;
          }, selectedList);
      }
    }

    // If only a single item was clicked (without shift), add or remove it
    if (selectedList.has(item.id)) {
      return selectedList.delete(item.id);
    } else {
      return selectedList.set(item.id, item);
    }
  }

  // Return the initial list if none of the above cases apply
  return selectedList;
};

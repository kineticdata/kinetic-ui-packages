import { Map } from 'immutable';

export const types = {
  OPEN: '@kd/queue/filterMenu/OPEN',
  CLOSE: '@kd/queue/filterMenu/CLOSE',
  RESET: '@kd/queue/filterMenu/RESET',
  SET_FILTER_NAME: '@kd/queue/filterMenu/SET_FILTER_NAME',
  SHOW_SECTION: '@kd/queue/filterMenu/SHOW_SECTION',
  TOGGLE_ASSIGNMENT: '@kd/queue/filterMenu/TOGGLE_ASSIGNMENT',
  TOGGLE_CREATED_BY_ME: '@kd/queue/filterMenu/TOGGLE_CREATED_BY_ME',
  TOGGLE_TEAM: '@kd/queue/filterMenu/TOGGLE_TEAM',
  TOGGLE_STATUS: '@kd/queue/filterMenu/TOGGLE_STATUS',
  SET_DATE_RANGE_TIMELINE: '@kd/queue/filterMenu/SET_DATE_RANGE_TIMELINE',
  SET_DATE_RANGE: '@kd/queue/filterMenu/SET_DATE_RANGE',
  SET_SORTED_BY: '@kd/queue/filterMenu/SET_SORTED_BY',
  SET_DIRECTION: '@kd/queue/filterMenu/SET_DIRECTION',
};

export const actions = {
  open: initialFilter => ({ type: types.OPEN, payload: initialFilter }),
  close: () => ({ type: types.CLOSE }),

  reset: () => ({ type: types.RESET }),
  setFilterName: filterName => ({
    type: types.SET_FILTER_NAME,
    payload: filterName,
  }),
  showSection: section => ({ type: types.SHOW_SECTION, payload: section }),
  toggleAssignment: payload => ({ type: types.TOGGLE_ASSIGNMENT, payload }),
  toggleCreatedByMe: payload => ({ type: types.TOGGLE_CREATED_BY_ME, payload }),
  toggleTeam: payload => ({ type: types.TOGGLE_TEAM, payload }),
  toggleStatus: payload => ({ type: types.TOGGLE_STATUS, payload }),
  setDateRangeTimeline: payload => ({
    type: types.SET_DATE_RANGE_TIMELINE,
    payload,
  }),
  setDateRange: payload => ({ type: types.SET_DATE_RANGE, payload }),
  setSortedBy: payload => ({ type: types.SET_SORTED_BY, payload }),
  setDirection: payload => ({ type: types.SET_DIRECTION, payload }),
};

export const defaultState = Map({
  isOpen: false,
  initialFilter: null,
  currentFilter: null,
  activeSection: null,
  filterName: '',
});

export const reducer = (state = defaultState, { type, payload }) => {
  switch (type) {
    case types.OPEN:
      return Map({
        isOpen: true,
        initialFilter: payload,
        currentFilter: payload,
        activeSection: null,
        filterName: payload.type === 'custom' ? payload.name : '',
      });
    case types.CLOSE:
      return defaultState;
    case types.RESET:
      return state.set('currentFilter', state.get('initialFilter'));
    case types.SET_FILTER_NAME:
      return state
        .set('filterName', payload)
        .setIn(['currentFilter', 'name'], payload);
    case types.SHOW_SECTION:
      return state.set('activeSection', payload);
    case types.TOGGLE_ASSIGNMENT:
      return state.setIn(['currentFilter', 'assignments'], payload);
    case types.TOGGLE_CREATED_BY_ME:
      return state.setIn(['currentFilter', 'createdByMe'], payload);
    case types.TOGGLE_TEAM:
      return state.updateIn(['currentFilter', 'teams'], teams => {
        const i = teams.indexOf(payload);
        return i > -1 ? teams.delete(i) : teams.push(payload);
      });
    case types.TOGGLE_STATUS:
      return state.updateIn(
        ['currentFilter', 'status'],
        statuses =>
          statuses.includes(payload)
            ? statuses.delete(statuses.indexOf(payload))
            : statuses.push(payload),
      );
    case types.SET_DATE_RANGE_TIMELINE:
      return (
        state
          .setIn(['currentFilter', 'dateRange', 'timeline'], payload)
          // If dateRange timeline is changed and dateRange filter has a value,
          // set sortBy to the dateRange timeline
          .updateIn(
            ['currentFilter', 'sortBy'],
            sortBy =>
              !!state.getIn(['currentFilter', 'dateRange', 'preset']) ||
              !!state.getIn(['currentFilter', 'dateRange', 'custom'])
                ? payload
                : sortBy,
          )
      );
    case types.SET_DATE_RANGE:
      const custom = typeof payload === 'object';
      return (
        state
          .mergeIn(['currentFilter', 'dateRange'], {
            preset: !custom ? payload : '',
            custom,
            start: custom ? payload.start : '',
            end: custom ? payload.end : '',
          })
          // If dataRange filter has a value, set sortBy to dateRange timeline
          .updateIn(
            ['currentFilter', 'sortBy'],
            sortBy =>
              !!payload
                ? state.getIn(['currentFilter', 'dateRange', 'timeline'])
                : sortBy,
          )
      );
    case types.SET_SORTED_BY:
      return state.setIn(['currentFilter', 'sortBy'], payload);
    case types.SET_DIRECTION:
      return state.setIn(['currentFilter', 'sortDirection'], payload);
    default:
      return state;
  }
};

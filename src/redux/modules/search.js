import { LOCATION_CHANGE } from 'redux-first-history';
import { Utils } from '@kineticdata/bundle-common';
const ns = Utils.namespaceBuilder('services/search');

export const types = {
  SEACH_INPUT_CHANGE: ns('SEACH_INPUT_CHANGE'),
};

export const actions = {
  searchInputChange: value => ({
    type: types.SEACH_INPUT_CHANGE,
    payload: value,
  }),
};

export const defaultState = {
  inputValue: '',
};

const reducer = (state = defaultState, action) => {
  switch (action.type) {
    case types.SEACH_INPUT_CHANGE:
      return { ...state, inputValue: action.payload };
    case LOCATION_CHANGE:
      return { ...state, ...defaultState };
    default:
      return state;
  }
};

export default reducer;

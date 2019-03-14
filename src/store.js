import { applyMiddleware, compose, createStore } from 'redux';
import { create as createAxiosInstance } from 'axios';
import { connect } from 'react-redux';
import { Map } from 'immutable';
import { reducer, regHandlers } from './reducer';
import { commitSagas, regSaga, runSaga, sagaMiddleware } from './saga';

export const config = {};

export const configure = (socket, getAuthToken) => {
  config.socket = socket;
  config.getAuthToken = getAuthToken;
};

export const axios = createAxiosInstance();
axios.interceptors.request.use(request => {
  if (config.getAuthToken) {
    request.headers.Authorization = `Bearer ${config.getAuthToken()}`;
  }
  return request;
});

const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__
  ? window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__({ name: 'react-kinetic-lib' })
  : compose;

const store = createStore(
  reducer,
  Map(),
  composeEnhancers(applyMiddleware(sagaMiddleware)),
);

const dispatch = (type, payload) => store.dispatch({ type, payload });
const dispatcher = type => payload => store.dispatch({ type, payload });

const commitStore = () => {
  commitSagas();
};

export {
  commitStore,
  connect,
  dispatch,
  dispatcher,
  reducer,
  regHandlers,
  regSaga,
  runSaga,
  store,
};
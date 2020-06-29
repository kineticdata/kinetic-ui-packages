import { Component } from 'react';
import {
  takeEvery,
  select,
  call,
  put,
  take,
  delay,
  race,
} from 'redux-saga/effects';
import { isFunction } from 'lodash-es';
import moment from 'moment';
import {
  action,
  regHandlers,
  connect,
  dispatch,
  regSaga,
  store,
} from '../../../store';
import {
  login,
  logoutDirect,
  retrieveJwt,
  singleSignOn,
  fetchSpaMeta,
  systemLogin,
} from '../../../apis';
import { socketIdentify } from '../../../apis/socket';
import { refreshSystemToken } from '../../../apis/system';

const defaultLoginProps = {
  error: null,
  password: '',
  pending: false,
  username: '',
};

regHandlers({
  INITIALIZE: state => state.set('login', defaultLoginProps),
  LOGIN: state => state.mergeIn(['login'], { error: null, pending: true }),
  LOGOUT: state =>
    state
      .mergeIn(['session'], {
        loggedIn: false,
        token: null,
      })
      .set('login', defaultLoginProps),
  SET_AUTHENTICATED: (state, action) =>
    state
      .mergeIn(['session'], {
        loggedIn: true,
        token: action.payload.token,
      })
      .set('login', defaultLoginProps),
  SET_INITIALIZED: (state, action) =>
    state
      .mergeIn(['session'], {
        csrfToken: action.payload.csrfToken,
        initialized: true,
        loggedIn: !!action.payload.token,
        securityStrategies: action.payload.securityStrategies,
        socket: action.payload.socket,
        spaceSlug: action.payload.spaceSlug,
        token: action.payload.token,
        system: action.payload.system,
      })
      .set('login', defaultLoginProps),

  SET_ERROR: (state, action) =>
    state.mergeIn(['login'], {
      error: action.payload,
      password: '',
      pending: false,
    }),
  SET_PASSWORD: (state, action) =>
    state.setIn(['login', 'password'], action.payload),
  SET_USERNAME: (state, action) =>
    state.setIn(['login', 'username'], action.payload),
  SINGLE_SIGN_ON: state =>
    state.mergeIn(['login'], { error: null, pending: true }),
  TIMEOUT: state => state.setIn(['session', 'token'], null),
});

regSaga('WATCH_SYSTEM_AUTHENTICATION', function*() {
  yield take('LOGIN');
  const system = yield select(state => state.getIn(['session', 'system'], false))

  let pollingActive = false;
  while (system) {
    try {
      const { authenticated, refresh, isLoggingOut, isTimingOut } = yield race({
        authenticated: take('SET_AUTHENTICATED'),
        refresh: delay(180000), // 3 minutes.
        isLoggingOut: take('LOGOUT'),
        isTimingOut: take('TIMEOUT'),
      });

      if (authenticated) {
        // The authentication event occurred, so now we want to periodically
        // refresh the token.
        pollingActive = true;
      } else if (refresh && pollingActive) {
        // The refresh event occurred, refresh the token.
        const { error, token } = yield call(refreshSystemToken);
        if (error) {
          yield put(action('TIMEOUT'));
        } else {
          yield put(action('SET_AUTHENTICATED', { token }));
          localStorage.setItem(SYSTEM_TOKEN, token);
        }
      } else {
        // Logging out or timing out happened to stop refreshing.
        pollingActive = false;
      }
    } catch (e) {
      console.error(e);
    }
  }
});

regSaga(
  takeEvery('LOGIN', function*({ payload }) {
    try {
      const system = yield select(state => state.getIn(['session', 'system']));
      const { username, password } = yield select(state => state.get('login'));
      const { error, token: systemToken } = yield call(
        system ? systemLogin : login,
        {
          username,
          password,
        },
      );
      if (error) {
        yield put({ type: 'SET_ERROR', payload: error.message });
      } else {
        const token = system ? systemToken : yield call(retrieveJwt);
        if (system) {
          localStorage.setItem(SYSTEM_TOKEN, token);
        }

        yield put({
          type: 'SET_AUTHENTICATED',
          payload: { token, callback: payload },
        });
      }
    } catch (e) {
      console.error(e);
    }
  }),
);

regSaga(
  takeEvery('SINGLE_SIGN_ON', function*({ payload: { callback, spaceSlug } }) {
    try {
      const { error } = yield call(singleSignOn, spaceSlug, {
        width: 770,
        height: 750,
      });
      if (error) {
        yield put({ type: 'SET_ERROR', payload: error });
      } else {
        const token = yield call(retrieveJwt);
        yield put({
          type: 'SET_AUTHENTICATED',
          payload: { token, callback },
        });
      }
    } catch (e) {
      console.error(e);
    }
  }),
);

const SYSTEM_TOKEN = 'kd-system';

regSaga(
  takeEvery('INITIALIZE', function*({ payload: { system, socket } }) {
    try {
      if (system) {
        let token;
        let localToken = localStorage
          ? localStorage.getItem(SYSTEM_TOKEN)
          : null;

        if (localToken) {
          const parsedToken = JSON.parse(atob(localToken.split('.')[1]));
          const isValid = moment.unix(parsedToken.exp).isAfter(new Date());
          token = isValid ? localToken : null;
        }

        yield put(
          action('SET_INITIALIZED', {
            socket,
            system,
            token,
          }),
        );
      } else {
        const {
          securityStrategies,
          session: { csrfToken, isAuthenticated },
          spaceSlug,
        } = yield call(fetchSpaMeta);
        const token = isAuthenticated ? yield call(retrieveJwt) : null;
        if (socket && token) {
          yield call(socketIdentify, token);
        }
        yield put(
          action('SET_INITIALIZED', {
            csrfToken,
            securityStrategies,
            socket,
            spaceSlug,
            token,
          }),
        );
      }
    } catch (e) {
      console.error(e);
    }
  }),
);

regSaga(
  takeEvery('LOGOUT_START', function*({ payload }) {
    try {
      const system = yield select(state => state.getIn(['session', 'system']));
      const loggedIn = yield select(state => state.getIn(['session', 'token']));

      if (!system && loggedIn) {
        yield call(logoutDirect);
      }
      yield put(action('LOGOUT'));
      if (isFunction(payload)) {
        yield call(payload);
      }
    } catch (e) {
      console.error(e);
    }
  }),
);

regSaga(
  takeEvery('SET_AUTHENTICATED', function*({ payload }) {
    const socket = yield select(state => state.getIn(['session', 'socket']));
    if (socket) {
      yield call(socketIdentify, payload.token);
    }
    if (isFunction(payload.callback)) {
      yield call(payload.callback);
    }
  }),
);

const onChangeUsername = e => {
  dispatch('SET_USERNAME', e.target.value);
};

const onChangePassword = e => {
  dispatch('SET_PASSWORD', e.target.value);
};

const onLogin = (e, callback) => {
  e.preventDefault();
  dispatch('LOGIN', callback);
};

const logout = callback => {
  dispatch('LOGOUT_START', callback);
};

const timedOut = () => {
  dispatch('TIMEOUT');
};

const getToken = () => store.getState().getIn(['session', 'token']);

export class AuthenticationComponent extends Component {
  componentDidMount() {
    if (this.props.system) {
      dispatch('INITIALIZE', { system: true, socket: false });
    } else {
      dispatch('INITIALIZE', {
        socket: !this.props.noSocket,
      });
    }
  }

  render() {
    const {
      initialized,
      loggedIn,
      login,
      securityStrategies,
      spaceSlug,
      token,
    } = this.props;
    return this.props.children({
      initialized: initialized,
      timedOut: loggedIn && !token,
      loggedIn: loggedIn,
      loginProps: {
        onChangeUsername,
        onChangePassword,
        onLogin,
        onSso:
          securityStrategies && securityStrategies.length > 0
            ? callback => dispatch('SINGLE_SIGN_ON', { callback, spaceSlug })
            : null,
        ...login,
      },
    });
  }
}

const mapStateToProps = state => ({
  initialized: state.getIn(['session', 'initialized'], false),
  loggedIn: state.getIn(['session', 'loggedIn'], false),
  token: state.getIn(['session', 'token'], null),
  login: state.get('login', defaultLoginProps),
  spaceSlug: state.getIn(['session', 'spaceSlug'], ''),
  securityStrategies: state.getIn(['session', 'securityStrategies'], []),
});

const AuthenticationContainer = connect(mapStateToProps)(
  AuthenticationComponent,
);

export { AuthenticationContainer, getToken, logout, timedOut };

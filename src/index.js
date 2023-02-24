import React from 'react';
import { Provider } from 'react-redux';
import { createHashHistory } from 'history';
import { remove } from 'immutable';
import axios from 'axios';
import { action, context, commitStore, store } from './store';
import { I18nProvider } from './components';
import { GlobalsProvider } from './components/core/core_form/globals';
import { DefaultFieldConfig } from './components/form/defaults';
import { DefaultTableConfig } from './components/table/defaults';
import { ComponentConfigContext } from './components/common/ComponentConfigContext';
import { AuthenticationContainer } from './components/common/authentication/AuthenticationContainer';
import AuthInterceptor from './components/common/authentication/AuthInterceptor';
import RequestInterceptor from './components/common/authentication/RequestInterceptor';

export * from './apis';
export * from './components';
export * from './helpers';

const requestInterceptor = new RequestInterceptor(store);
export const authInterceptor = new AuthInterceptor(
  store,
  // callback to invoke when we get a 401 response
  () => action('TIMEOUT'),
  // how to detect if the user has re-authenticated
  state => !!state.getIn(['session', 'token']),
  // how to detect if the user has cancelled the re-authentication process
  state => !state.getIn(['session', 'loggedIn']),
);

axios.defaults.withCredentials = true;
axios.interceptors.request.use(requestInterceptor.handleFulfilled);
axios.interceptors.response.use(null, authInterceptor.handleRejected);

commitStore();

export const KineticLib = props => (
  <Provider store={store} context={context}>
    <I18nProvider locale={props.locale}>
      <GlobalsProvider globals={props.globals}>
        <ComponentConfigContext.Provider
          value={DefaultFieldConfig.merge(DefaultTableConfig)
            .merge(remove(props.components || {}, 'fields'))
            .merge(props.components && props.components.fields)}
        >
          {typeof props.children === 'function' ? (
            <AuthenticationContainer
              skipInit={props.skipInit}
              system={props.system}
            >
              {props.children}
            </AuthenticationContainer>
          ) : (
            props.children
          )}
        </ComponentConfigContext.Provider>
      </GlobalsProvider>
    </I18nProvider>
  </Provider>
);

export const history =
  typeof window !== 'undefined' && window.bundle ? createHashHistory() : null;

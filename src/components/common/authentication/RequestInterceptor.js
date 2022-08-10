const tokenEndpointPattern = /\/app\/(loghub|system-coordinator)\/(refresh|components|api\/v\d)/;

export default class RequestInterceptor {
  constructor(store) {
    this.store = store;
    this.initPromise = new Promise(resolve => {
      const unsub = store.subscribe(() => {
        if (store.getState().getIn(['session', 'initialized'])) {
          unsub();
          resolve();
        }
      });
    });
    this.handleFulfilled = this.handleFulfilled.bind(this);
  }

  handleFulfilled(config) {
    return config.__bypassInitInterceptor
      ? config
      : this.initPromise.then(() => {
          const { csrfToken, loggedIn, token } = this.store
            .getState()
            .get('session')
            .toObject();
          if (!loggedIn) {
            config.__bypassAuthInterceptor = true;
          }
          if (token && config.url.match(tokenEndpointPattern)) {
            config.headers.Authorization = 'Bearer ' + token;
          }
          if (csrfToken) {
            // we need to set xsrfCookieName otherwise axios will override the
            // xsrf header that we set manually
            config.xsrfCookieName = 'DONT_USE_COOKIES_FOR_XSRF_TOKEN';
            config.headers['X-XSRF-TOKEN'] = csrfToken;
          }
          return config;
        });
  }
}

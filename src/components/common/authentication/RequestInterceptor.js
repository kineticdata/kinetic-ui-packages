const tokenEndpointPattern = /\/app\/(discussions|loghub)\/api\/v\d/;

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
    return this.initPromise.then(() => {
      const { loggedIn, token } = this.store
        .getState()
        .get('session')
        .toObject();
      if (!loggedIn) {
        config.__bypassAuthInterceptor = true;
      }
      if (token && config.url.match(tokenEndpointPattern)) {
        config.headers.Authorization = 'Bearer ' + token;
      }
      return config;
    });
  }
}

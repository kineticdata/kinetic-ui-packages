import React from 'react';
import ReactDOM from 'react-dom';
import { Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ConnectedRouter } from 'connected-react-router';
import { createHashHistory } from 'history';
import { bundle } from 'react-kinetic-core';
import { parse } from 'query-string';
import { LayoutModule } from 'react-kinops-common';

import { AppContainer } from './components/AppContainer';
import { configureStore } from './redux/store';

// This src/index.js file is the main entry into the React application.  It does
// not contain much application code, instead it is mostly boilerplate code that
// wires up some of the features we want to add to our React application.
//
// When getting started, the most important piece is the line that contains:
//   <Route path="/" component={AppContainer}/>
// which specifies that the root of the application is to be AppContainer which
// can be found in containers/AppContainer.js.  The rest of the application gets
// included as descendants of that component.
//
// The rest of the code below is doing things like setting up a client-side
// router that allows us to define multiple routes and pages all on the
// client-side.  We also setup a redux store, which is a strategy we use for
// storing and organizing the state of the application.  Finally we configure
// the application to support hot module reloading (hmr), which means we can
// update code in our editor and see changes in the browser without refreshing
// the page.

// Handle JSP bundle page= param
if (window.location.search.includes('?page=')) {
  const params = parse(window.location.search);
  const hashes = parse(window.location.hash);
  if (params.page === 'submission') {
    window.location = `${bundle.kappLocation()}/#/requests/request/${
      params.id
    }/activity`;
  } else if (params.page === 'requests') {
    const mode =
      Object.keys(hashes).length > 0 ? `/${Object.keys(hashes)[0]}` : '';
    window.location = `${bundle.kappLocation()}/#/requests${mode}`;
  } else if (params.page === 'categories') {
    const category = params.category ? `/${params.category}` : '';
    window.location = `${bundle.kappLocation()}/#/categories${category}`;
  }
} else {
  // Create the history instance that enables client-side application routing.
  const history = createHashHistory();

  // Create the redux store with the configureStore helper found in redux/store.js
  const store = configureStore(history);

  ReactDOM.render(
    <Provider store={store}>
      <ConnectedRouter history={history}>
        <Route path="/" component={AppContainer} />
      </ConnectedRouter>
    </Provider>,
    document.getElementById('root'),
  );

  // Add global listeners
  LayoutModule.createLayoutListeners(store);
}

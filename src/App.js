import React from 'react';
import { Router } from '@reach/router';
import {
  compose,
  lifecycle,
  withHandlers,
  withProps,
  withState,
} from 'recompose';
import { Redirect } from '@reach/router';
import {
  ActivityFeed,
  ErrorUnexpected,
  Loading,
} from '@kineticdata/bundle-common';
import { connect } from './redux/store';

import { actions as categoriesActions } from './redux/modules/servicesApp';
import { actions as submissionCountActions } from './redux/modules/submissionCounts';

import { PageTitle } from './components/shared/PageTitle';
import { Catalog } from './components/home/Catalog';
import { CategoryListContainer } from './components/category_list/CategoryListContainer';
import { CategoryContainer } from './components/category/CategoryContainer';
import { CatalogSearchResultsContainer } from './components/search_results/CatalogSearchResultsContainer';
import { Sidebar } from './components/Sidebar';
import { Sidebar as SettingsSidebar } from './components/settings/Sidebar';
import { FormContainer } from './components/form/FormContainer';
import { FormListContainer } from './components/form_list/FormListContainer';
import { RequestList } from './components/request_list/RequestList';
import { RequestShowContainer } from './components/request/RequestShowContainer';
import { Settings } from './components/settings/Settings';
import { I18n } from '@kineticdata/react';

/*****************************************************************************
 *** PRIVATE APP
 *****************************************************************************/

export const requestFeedKey = 'request-activity-feed';

const SubmissionRedirect = props => (
  <Redirect
    to={`${props.appLocation}/requests/request/${props.id}/${
      props.location.search.includes('review') ? 'review' : 'activity'
    }`}
    noThrow
  />
);

const AppComponent = props => {
  if (props.error) {
    return <ErrorUnexpected />;
  } else if (props.loading) {
    return <Loading text="App is loading ..." />;
  } else {
    return props.render({
      sidebar: (
        <Router>
          <SettingsSidebar
            path="settings/*"
            settingsBackPath={props.settingsBackPath}
          />
          <Sidebar
            path="*"
            counts={props.submissionCounts}
            homePageMode={props.homePageMode}
            homePageItems={props.homePageItems}
            openSettings={props.openSettings}
          />
        </Router>
      ),
      main: (
        <I18n>
          <main className="package-layout package-layout--services">
            <PageTitle parts={['Loading...']} />
            <Router>
              <Settings path="settings/*" />
              <SubmissionRedirect
                path="submissions/:id"
                appLocation={props.appLocation}
              />
              <SubmissionRedirect
                path="forms/:formSlug/submissions/:id"
                appLocation={props.appLocation}
              />

              <Catalog
                path="/"
                homePageMode={props.homePageMode}
                homePageItems={props.homePageItems}
              />
              <CategoryListContainer path="categories" />
              <CategoryContainer path="categories/:categorySlug" />
              <FormContainer path="categories/:categorySlug/:formSlug" />
              <FormContainer path="categories/:categorySlug/:formSlug/:submissionId" />
              <FormListContainer path="forms" />
              <FormContainer path="forms/:formSlug" />
              <FormContainer path="forms/:formSlug/:submissionId" />
              <CatalogSearchResultsContainer path="search" />
              <CatalogSearchResultsContainer path="search/:query" />
              <ActivityFeed.MountWrapper
                feedKey={requestFeedKey}
                path="requests"
              >
                <RequestList feedKey={requestFeedKey} default />
                <RequestList feedKey={requestFeedKey} path=":type" />
                <FormContainer path="request/:submissionId" />
                <FormContainer path=":type/request/:submissionId" />
                <RequestShowContainer path="request/:submissionId/:mode" />
                <RequestShowContainer path=":type/request/:submissionId/:mode" />
              </ActivityFeed.MountWrapper>
            </Router>
          </main>
        </I18n>
      ),
    });
  }
};

const mapStateToProps = state => {
  return {
    loading: state.servicesApp.loading,
    error: state.servicesApp.error,
    categories: state.servicesApp.categories,
    forms: state.servicesApp.homeForms,
    submissionCounts: state.submissionCounts.data,
    pathname: state.router.location.pathname,
    appLocation: state.app.location,
  };
};

const mapDispatchToProps = {
  fetchAppDataRequest: categoriesActions.fetchAppDataRequest,
  fetchSubmissionCountsRequest:
    submissionCountActions.fetchSubmissionCountsRequest,
};

export const App = compose(
  connect(
    mapStateToProps,
    mapDispatchToProps,
  ),
  withProps(props => {
    return !props.categories || props.categories.isEmpty()
      ? {
          homePageMode: 'Forms',
          homePageItems: props.forms,
        }
      : {
          homePageMode: 'Categories',
          homePageItems: props.categories,
        };
  }),
  withState(
    'settingsBackPath',
    'setSettingsBackPath',
    props => props.appLocation,
  ),
  withHandlers({
    openSettings: props => () => props.setSettingsBackPath(props.pathname),
  }),
  lifecycle({
    componentDidMount() {
      this.props.fetchAppDataRequest();
      this.props.fetchSubmissionCountsRequest();
    },
  }),
)(AppComponent);

/*****************************************************************************
 *** PUBLIC APP
 *****************************************************************************/

export const PublicAppComponent = props => {
  return props.render({
    main: (
      <I18n>
        <main className="package-layout package-layout--services">
          <PageTitle parts={['Loading...']} />
          <Router>
            <FormContainer path="forms/:formSlug" />
            <FormContainer path="forms/:formSlug/:submissionId" />
            <FormContainer path="submissions/:submissionId" />
            <Redirect from="*" to={props.authRoute} noThrow />
          </Router>
        </main>
      </I18n>
    ),
  });
};

const mapStateToPropsPublic = state => ({
  authRoute: state.app.authRoute,
});

export const PublicApp = compose(connect(mapStateToPropsPublic))(
  PublicAppComponent,
);

import React from 'react';
import { Redirect, Router } from '@reach/router';
import { compose, lifecycle, withHandlers } from 'recompose';
import { connect } from './redux/store';
import { ErrorMessage, LoadingMessage } from '@kineticdata/bundle-common';
import { is } from 'immutable';
import { I18n } from '@kineticdata/react';
import matchPath from 'rudy-match-path';

import { actions, selectMyTeamForms } from './redux/modules/queueApp';
import { actions as queueActions } from './redux/modules/queue';
import { actions as formsActions } from './redux/modules/forms';

import { PageTitle } from './components/shared/PageTitle';
import { QueueItemContainer } from './components/queue_item/QueueItem';
import { QueueListContainer } from './components/queue_list/QueueListContainer';
import { NewItemMenuContainer } from './components/new_item_menu/NewItemMenuContainer';
import { WorkMenuContainer } from './components/work_menu/WorkMenu';
import { Settings } from './components/settings/Settings';
import { FormPreview } from './components/FormPreview';

const CustomRedirect = props => (
  <Redirect to={`${props.appLocation}/item/${props.id}`} noThrow />
);

const AppComponent = props => {
  return props.render({
    classNames: {
      header: matchPath(props.pathname, {
        path: `${props.appLocation}/(list|team|custom|adhoc)/:name?`,
        exact: true,
      })
        ? 'app-header--sticky'
        : '',
    },
    main: props.error ? (
      <ErrorMessage
        title="Unexpected Error"
        message="Sorry, an unexpected error has occurred!"
      />
    ) : props.loading ? (
      <LoadingMessage />
    ) : (
      <I18n>
        <main className="package-layout package-layout--queue">
          <PageTitle parts={['Loading...']} />
          <Router>
            <Settings path="settings/*" />
            <QueueListContainer path="list/:filter" />
            <QueueListContainer path="team/:filter" />
            <QueueListContainer path="custom/:filter" />
            <QueueListContainer path="adhoc" />
            <QueueItemContainer path="list/:filter/item/:id" />
            <QueueItemContainer path="team/:filter/item/:id" />
            <QueueItemContainer path="custom/:filter/item/:id" />
            <QueueItemContainer path="adhoc/item/:id" />
            <QueueItemContainer path="item/:id" />
            <Redirect from="/" to={`${props.appLocation}/list/Mine`} noThrow />
            <Redirect
              from="submissions/:id"
              to={`${props.appLocation}/item/:id`}
              noThrow
            />
            <CustomRedirect
              path="forms/:formSlug/submissions/:id"
              appLocation={props.appLocation}
            />
            <Redirect
              from="queue/filter/__show__/details/:id/summary"
              to={`${props.appLocation}/item/:id`}
              noThrow
            />
            <FormPreview path="forms/:formSlug/:id" />
            <FormPreview path="forms/:formSlug" />
          </Router>
          <NewItemMenuContainer />
          <WorkMenuContainer />
        </main>
      </I18n>
    ),
  });
};

const mapStateToProps = (state, props) => ({
  loading: state.queueApp.loading,
  error: state.queueApp.error,
  defaultFilters: state.queueApp.filters,
  teamFilters: state.queueApp.teamFilters,
  myFilters: state.queueApp.myFilters,
  counts: state.queueApp.filters
    .toMap()
    .mapEntries(([_, filter]) => [filter.name, state.queue.counts.get(filter)]),
  hasTeams: state.queueApp.myTeams.size > 0,
  hasForms:
    selectMyTeamForms(state).filter(form => form.type === 'Task').length > 0,
  appLocation: state.app.location,
  pathname: state.router.location.pathname,
});

const mapDispatchToProps = {
  setFilter: actions.setFilter,
  fetchAppDataRequest: actions.fetchAppDataRequest,
  resetList: queueActions.fetchListReset,
  openNewItemMenu: queueActions.openNewItemMenu,
  fetchListCountRequest: queueActions.fetchListCountRequest,
  fetchFormsRequest: formsActions.fetchFormsRequest,
};

const enhance = compose(
  connect(
    mapStateToProps,
    mapDispatchToProps,
  ),
  withHandlers({
    handleOpenNewItemMenu: ({ openNewItemMenu }) => () => openNewItemMenu(),
  }),
  lifecycle({
    componentDidMount() {
      this.props.fetchAppDataRequest();
      this.props.fetchFormsRequest();
    },
    componentDidUpdate(prevProps) {
      if (!this.props.loading && prevProps.loading) {
        // Fetch counts for default lists
        this.props.defaultFilters
          .filter(
            filter => !this.props.filter || !is(filter, this.props.filter),
          )
          .forEach(this.props.fetchListCountRequest);
      }
    },
    componentWillUnmount() {
      this.props.resetList();
    },
  }),
);

export const App = enhance(AppComponent);

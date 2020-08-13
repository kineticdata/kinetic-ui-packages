import React from 'react';
import { Router } from '@reach/router';
import { compose, lifecycle } from 'recompose';
import { connect } from './redux/store';
import { ErrorUnexpected, Loading } from '@kineticdata/bundle-common';
import { I18n } from '@kineticdata/react';
import { PageTitle } from './components/shared/PageTitle';
import { Sidebar } from './components/Sidebar';
import { Settings } from './components/Settings';
import { Notifications } from './components/notifications/Notifications';
import { Datastore } from './components/datastore/Datastore';
import { Robots } from './components/robots/Robots';
import { Users } from './components/users/Users';
import { Teams } from './components/teams/Teams';
import { Translations } from './components/translations/Translations';
import { SchedulerSettings } from './components/SchedulerSettings';
import { SpaceSettings } from './components/space_settings/SpaceSettings';
import { actions as datastoreActions } from './redux/modules/settingsDatastore';
import { actions } from './redux/modules/settingsApp';

const AppComponent = props => {
  if (props.error) {
    return <ErrorUnexpected />;
  } else if (props.loading) {
    return <Loading text="App is loading ..." />;
  } else {
    return props.render({
      sidebar: !props.isGuest && (
        <Router>
          <Sidebar path="/*" />
        </Router>
      ),
      main: (
        <I18n>
          <main className={`package-layout package-layout--settings`}>
            <PageTitle parts={['Loading...']} />
            <Router>
              <SpaceSettings path="space" />
              <Datastore path="datastore/*" />
              <Robots path="robots/*" />
              <Users path="users/*" />
              <Notifications path="notifications/*" />
              <Teams path="teams/*" />
              <SchedulerSettings path="schedulers/*" />
              <Translations path="translations/*" />
              <Settings default />
            </Router>
          </main>
        </I18n>
      ),
    });
  }
};

const mapStateToProps = state => ({
  loading: state.settingsApp.loading,
  error: state.settingsApp.error,
});

const mapDispatchToProps = {
  fetchForms: datastoreActions.fetchForms,
  fetchAppData: actions.fetchAppDataRequest,
};

const enhance = compose(
  connect(
    mapStateToProps,
    mapDispatchToProps,
  ),
  lifecycle({
    componentDidMount() {
      this.props.fetchForms();
      this.props.fetchAppData();
    },
  }),
);

export const App = enhance(AppComponent);

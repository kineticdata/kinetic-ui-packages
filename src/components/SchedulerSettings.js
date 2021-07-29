import React from 'react';
import { connect } from '../redux/store';
import { compose, lifecycle } from 'recompose';
import { Router } from '@reach/router';
import {
  selectHasRoleSchedulerAdmin,
  selectHasRoleSchedulerManager,
  ErrorUnauthorized,
  CreateScheduler,
  Scheduler,
  SchedulersList,
} from '@kineticdata/bundle-common';

export const SchedulerSettingsComponent = ({
  isSchedulerAdmin,
  isSchedulerManager,
  profile,
  appLocation
}) =>
  isSchedulerAdmin || isSchedulerManager ? (
    <Router>
      <CreateScheduler
        path="new"
        profile={profile}
        type="TechBar"
        pathPrefix={`/settings/schedulers`}
        breadcrumbs={[
          { label: 'Home', to: '/' },
          {
            label: 'Settings',
            to: appLocation,
          },
          {
            label: 'Schedulers',
            to: `${appLocation}/schedulers`,
          },
        ]}
      />
      <Scheduler
        path=":id"
        profile={profile}
        pathPrefix={`/settings/schedulers`}
        breadcrumbs={[
          { label: 'Home', to: '/' },
          {
            label: 'Settings',
            to: appLocation,
          },
          {
            label: 'Schedulers',
            to: `${appLocation}/schedulers`,
          },
        ]}
      />
      <SchedulersList
        default
        profile={profile}
        pathPrefix={`/settings/schedulers`}
        breadcrumbs={[
          { label: 'Home', to: '/' },
          {
            label: 'Settings',
            to: appLocation,
          },
        ]}
      />
    </Router>
  ) : (
    <ErrorUnauthorized />
  );

export const mapStateToProps = (state, props) => ({
  isSchedulerAdmin: selectHasRoleSchedulerAdmin(state.app.profile),
  isSchedulerManager: selectHasRoleSchedulerManager(state.app.profile),
  profile: state.app.profile,
  appLocation: state.app.location,
});

export const SchedulerSettings = compose(
  connect(mapStateToProps),
  lifecycle({
    componentWillUnmount() {},
  }),
)(SchedulerSettingsComponent);

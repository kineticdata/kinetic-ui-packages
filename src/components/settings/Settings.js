import React from 'react';
import { Link, Router } from '@reach/router';
import { connect } from '../../redux/store';
import { compose } from 'recompose';
import {
  Card,
  CardCol,
  CardRow,
  ErrorUnauthorized,
  selectHasRoleSchedulerAdmin,
  selectHasRoleSchedulerManager,
  selectHasRoleSchedulerAgent,
} from '@kineticdata/bundle-common';
import { PageTitle } from '../shared/PageTitle';
import { SchedulerSettings } from './SchedulerSettings';
import { TechBarMetrics } from './TechBarMetrics';
import { TechBarSettings } from './TechBarSettings';
import { TechBar } from './tech-bar/TechBar';
import { TechBarSettingsForm } from './tech-bar/TechBarSettingsForm';
import { AppointmentForm } from './tech-bar/AppointmentForm';
import { I18n } from '@kineticdata/react';

export const SettingsComponent = ({ kappSlug, hasSettingsAccess }) =>
  hasSettingsAccess ? (
    <Router>
      <TechBarMetrics path="metrics/:mode" />
      <TechBarMetrics path="metrics" />
      <AppointmentForm path="general/:techBarId/appointment/:id" />
      <TechBarSettingsForm path="general/:techBarId/edit" />
      <TechBar path="general/:techBarId" />
      <TechBarSettings path="general" />
      <SchedulerSettings path="schedulers/*" />
      <SettingsNavigation default />
    </Router>
  ) : (
    <ErrorUnauthorized />
  );

const mapStateToProps = (state, props) => {
  return {
    kappSlug: state.app.kappSlug,
    hasSettingsAccess:
      selectHasRoleSchedulerAgent(state.app.profile) ||
      selectHasRoleSchedulerManager(state.app.profile) ||
      selectHasRoleSchedulerAdmin(state.app.profile),
  };
};

const mapDispatchToProps = {};

export const Settings = compose(
  connect(
    mapStateToProps,
    mapDispatchToProps,
  ),
)(SettingsComponent);

const SettingsCard = ({ path, icon, name, description }) => (
  <Card
    to={path}
    color="light"
    components={{ Link }}
    bar={true}
    barColor="dark"
    barSize="xs"
  >
    <CardCol>
      <CardRow type="title">
        <span
          className={`fa fa-${(icon || 'cog').replace(
            /^fa-/i,
            '',
          )} fa-fw fa-rounded bg-dark`}
        />
        <span>
          <I18n>{name}</I18n>
        </span>
      </CardRow>
      <CardRow className="text-muted">{description}</CardRow>
    </CardCol>
  </Card>
);

const SettingsNavigationComponent = ({ kapp, hasManagerAccess }) => (
  <div className="page-container">
    <div className="page-panel">
      <PageTitle
        settings
        breadcrumbs={[{ label: 'Home', to: '/' }]}
        title={`${kapp.name} Settings`}
      />

      <div className="cards cards--seconds">
        <SettingsCard
          name="Metrics"
          path={`metrics`}
          icon="fa-bar-chart"
          description="View metrics for the Tech Bars."
        />
        <SettingsCard
          name="Tech Bars"
          path={`general`}
          icon="fa-gear"
          description="View and modify Tech Bar settings."
        />
        {hasManagerAccess && (
          <SettingsCard
            name="Schedulers"
            path={`schedulers`}
            icon="fa-calendar"
            description="View and modify scheduler settings, including event types and availability."
          />
        )}
      </div>
    </div>
  </div>
);

const mapStateToPropsNav = state => {
  return {
    kapp: state.app.kapp,
    hasManagerAccess:
      selectHasRoleSchedulerManager(state.app.profile) ||
      selectHasRoleSchedulerAdmin(state.app.profile),
  };
};

export const SettingsNavigation = compose(connect(mapStateToPropsNav))(
  SettingsNavigationComponent,
);

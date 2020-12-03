import React from 'react';
import { Link, Router } from '@reach/router';
import { compose, lifecycle } from 'recompose';
import {
  Card,
  CardCol,
  CardRow,
  ErrorMessage,
  LoadingMessage,
} from '@kineticdata/bundle-common';
import { QueueSettings } from './QueueSettings';
import { actions as formActions } from '../../redux/modules/settingsForms';
import { PageTitle } from '../shared/PageTitle';
import { FormList } from './forms/FormList';
import { FormSettings } from './forms/FormSettings';
import { FormActivity } from './forms/FormActivity';
import { FormSubmissions } from './forms/FormSubmissions';
import { I18n } from '@kineticdata/react';
import { connect } from '../../redux/store';

// Wrapper for components that require the form object
export const FormSettingsWrapper = compose(
  connect(
    state => ({
      kapp: state.app.kapp,
      form: state.settingsForms.currentForm,
      error: state.settingsForms.error,
    }),
    { fetchFormRequest: formActions.fetchFormRequest },
  ),
  lifecycle({
    componentWillMount(prev, next) {
      this.props.fetchFormRequest({
        kappSlug: this.props.kapp.slug,
        formSlug: this.props.formSlug,
      });
    },
  }),
)(
  ({ form, error }) =>
    error || !form ? (
      <div className="page-container">
        <PageTitle parts={[form && form.name, 'Forms', 'Settings']} />
        <div className="page-panel page-panel--white">
          <div className="page-title">
            <div
              role="navigation"
              aria-label="breadcrumbs"
              className="page-title__breadcrumbs"
            >
              <span className="breadcrumb-item">
                <Link to="../../../">
                  <I18n>queue</I18n>
                </Link>{' '}
              </span>
              <span aria-hidden="true">/ </span>
              <span className="breadcrumb-item">
                {' '}
                <Link to="../../">
                  <I18n>settings</I18n>
                </Link>{' '}
              </span>
              <span aria-hidden="true">/ </span>
              <span className="breadcrumb-item">
                {' '}
                <Link to="../">
                  <I18n>forms</I18n>
                </Link>{' '}
              </span>
              <span aria-hidden="true">/ </span>
            </div>
          </div>
          {error ? (
            <ErrorMessage message={error.message} />
          ) : (
            <LoadingMessage />
          )}
        </div>
      </div>
    ) : (
      <Router>
        <FormSettings form={form} path="settings" />
        <FormActivity form={form} path="submissions/:id" />
        <FormSubmissions form={form} default />
      </Router>
    ),
);

export const Settings = () => (
  <Router>
    <QueueSettings path="general" />
    <FormList path="forms" />
    <FormSettingsWrapper path="forms/:formSlug/*" />
    {/* <FormActivity path="forms/:id/activity" /> */}
    <SettingsNavigation default />
  </Router>
);

const SettingsCard = ({ path, icon, name, description }) => (
  <Card
    to={path}
    color="light"
    components={{ Link }}
    bar={true}
    barColor="dark"
    barSize="sm"
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

const SettingsNavigationComponent = ({ isSpaceAdmin }) => (
  <div className="page-container">
    <PageTitle settings />
    <div className="page-panel page-panel--white">
      <div className="page-title">
        <div
          role="navigation"
          aria-label="breadcrumbs"
          className="page-title__breadcrumbs"
        >
          <span className="breadcrumb-item">
            <Link to="..">
              <I18n>queue</I18n>
            </Link>{' '}
            <span aria-hidden="true">/ </span>
          </span>
          <h1>
            <I18n>Settings</I18n>
          </h1>
        </div>
      </div>

      <div className="cards cards--seconds">
        {isSpaceAdmin && (
          <SettingsCard
            name="General Settings"
            path="general"
            icon="fa-gear"
            description="View and Modify all Queue Settings"
          />
        )}
        <SettingsCard
          name="Forms"
          path="forms"
          icon="fa-gear"
          description="View Forms and their Submissions."
        />
      </div>
    </div>
  </div>
);

const mapStateToProps = state => ({
  isSpaceAdmin: state.app.profile.spaceAdmin,
});

export const SettingsNavigation = compose(connect(mapStateToProps))(
  SettingsNavigationComponent,
);

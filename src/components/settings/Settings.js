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
  ({ form, error, kapp }) =>
    error || !form ? (
      <div className="page-container">
        <div className="page-panel">
          <PageTitle
            parts={[form && form.name, 'Forms']}
            settings
            breadcrumbs={[
              { label: 'Home', to: '/' },
              { label: `${kapp.name} Settings`, to: '../..' },
              { label: 'Forms', to: '..' },
            ]}
          />
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

const SettingsNavigationComponent = ({ kapp, isSpaceAdmin }) => (
  <div className="page-container">
    <div className="page-panel">
      <PageTitle
        settings
        breadcrumbs={[{ label: 'Home', to: '/' }]}
        title={`${kapp.name} Settings`}
      />

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
  kapp: state.app.kapp,
  isSpaceAdmin: state.app.profile.spaceAdmin,
});

export const SettingsNavigation = compose(connect(mapStateToProps))(
  SettingsNavigationComponent,
);

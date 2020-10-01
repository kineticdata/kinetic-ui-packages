import React from 'react';
import { Link, Router } from '@reach/router';
import { compose, lifecycle } from 'recompose';
import { ErrorMessage, LoadingMessage } from '@kineticdata/bundle-common';
import { PageTitle } from '../shared/PageTitle';
import { actions as formActions } from '../../redux/modules/settingsForms';
import { ServicesSettings } from './services_settings/ServicesSettings';
import { FormsList } from './forms/FormsList';
import { FormSettings } from './forms/FormSettings';
import { FormSubmissions } from './forms/FormSubmissions';
import { FormActivity } from './forms/FormActivity';
import { CategorySettings } from './categories/CategorySettings';
import { I18n } from '@kineticdata/react';
import { connect } from '../../redux/store';

// Wrapper for components that require the form object
export const FormSettingsWrapper = compose(
  connect(
    state => ({
      kapp: state.app.kapp,
      form: state.settingsForms.form,
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
        <div className="page-panel page-panel--white">
          <PageTitle
            parts={[form && form.name, `Forms`]}
            settings
            hero={false}
            breadcrumbs={[
              { label: 'services', to: '../../..' },
              { label: 'settings', to: '../..' },
              { label: 'forms', to: '..' },
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
    <ServicesSettings path="general" />
    <FormsList path="forms" />
    <FormSettingsWrapper path="forms/:formSlug/*" />
    <FormActivity path="forms/:id/activity" />
    <CategorySettings path="categories/*" />
    <SettingsNavigation default />
  </Router>
);

const SettingsCard = ({ path, icon, name, description }) => (
  <Link to={path} className="card card--light">
    <div className="card__bar card__bar--sm card__bar--dark" />
    <div className="card__col">
      <div className="card__row-title">
        <span
          className={`fa fa-${(icon || 'cog').replace(
            /^fa-/i,
            '',
          )} fa-fw bg-dark`}
        />
        <span>
          <I18n>{name}</I18n>
        </span>
      </div>
      <div className="card__row text-muted">
        <I18n>{description}</I18n>
      </div>
    </div>
  </Link>
);

const SettingsNavigationComponent = ({ kapp, isSpaceAdmin }) => (
  <div className="page-container">
    <div className="page-panel page-panel--white">
      <PageTitle
        settings
        hero={false}
        breadcrumbs={[{ label: 'services', to: '..' }]}
        title="Settings"
      />

      <div className="cards cards--seconds">
        {isSpaceAdmin && (
          <SettingsCard
            name="General Settings"
            path="general"
            icon="fa-gear"
            description="View and Modify all Services Settings"
          />
        )}
        <SettingsCard
          name="Forms"
          path="forms"
          icon="fa-gear"
          description="View Forms and their Submissions."
        />
        {isSpaceAdmin && (
          <SettingsCard
            name="Categories"
            path="categories"
            icon="fa-gear"
            description="View and Modify Categories"
          />
        )}
      </div>
    </div>
  </div>
);

const mapStateToPropsNav = state => ({
  kapp: state.app.kapp,
  isSpaceAdmin: state.app.profile.spaceAdmin,
});

export const SettingsNavigation = compose(connect(mapStateToPropsNav))(
  SettingsNavigationComponent,
);

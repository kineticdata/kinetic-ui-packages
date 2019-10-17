import React from 'react';
import { Icon } from 'common';
import { Link, Router } from '@reach/router';
import { compose, lifecycle } from 'recompose';

import { ServicesSettings } from './services_settings/ServicesSettings';
import { actions } from '../../redux/modules/settingsServices';
import { FormList } from './forms/FormList';
import { FormSettings } from './forms/FormSettings';
import { FormActivity } from './forms/FormActivity';
import { CreateForm } from './forms/CreateForm';
import { CategorySettings } from './categories/CategorySettings';
import { FormSubmissions } from './forms/FormSubmissions';
import { I18n } from '@kineticdata/react';
import { connect } from '../../redux/store';

export const SettingsComponent = ({ kappSlug }) => (
  <Router>
    <ServicesSettings path="general" />
    <FormList path="forms" />
    <CreateForm path="forms/new" />
    <CreateForm path="forms/clone/:id" />
    <FormSettings path="forms/:id/settings" />
    <FormActivity path="forms/:id/activity" />
    <FormSubmissions path="forms/:id" />
    <CategorySettings path="categories/*" />
    <SettingsNavigation default />
  </Router>
);

const mapStateToProps = (state, props) => ({
  kappSlug: state.app.kappSlug,
});

const mapDispatchToProps = {
  fetchServicesSettings: actions.fetchServicesSettings,
};

export const Settings = compose(
  connect(
    mapStateToProps,
    mapDispatchToProps,
  ),
  lifecycle({
    componentWillMount(prev, next) {
      this.props.fetchServicesSettings();
    },
  }),
)(SettingsComponent);

const SettingsCard = ({ path, icon, name, description }) => (
  <Link to={path} className="card card--service">
    <h1>
      <Icon image={icon || 'fa-gear'} background="blueSlate" />
      <I18n>{name}</I18n>
    </h1>
    <p>
      <I18n>{description}</I18n>
    </p>
  </Link>
);

const SettingsNavigationComponent = ({ isSpaceAdmin }) => (
  <div className="page-container">
    <div className="page-panel page-panel--white">
      <div className="page-title">
        <div className="page-title__wrapper">
          <h3>
            <Link to="../">
              <I18n>services</I18n>
            </Link>{' '}
            /{` `}
          </h3>
          <h1>
            <I18n>Settings</I18n>
          </h1>
        </div>
      </div>

      <div className="cards__wrapper cards__wrapper--seconds">
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
  isSpaceAdmin: state.app.profile.spaceAdmin,
});

export const SettingsNavigation = compose(connect(mapStateToPropsNav))(
  SettingsNavigationComponent,
);

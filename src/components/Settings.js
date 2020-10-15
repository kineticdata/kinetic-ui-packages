import React from 'react';
import { Link } from '@reach/router';
import { connect } from '../redux/store';
import { PageTitle } from './shared/PageTitle';
import { I18n } from '@kineticdata/react';

const SettingsCard = ({ path, icon, name, description }) => (
  <Link to={path} className="card card--light">
    <div className="card__bar card__bar--sm card__bar--dark" />
    <div className="card__col">
      <div className="card__row-title">
        <span
          className={`fa fa-${(icon || 'cog').replace(
            /^fa-/i,
            '',
          )} fa-fw fa-rounded bg-dark`}
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

const SettingsComponent = ({
  isSpaceAdmin,
  hasDatastoreAccess,
  hasNotificationAccess,
  hasRobotAccess,
  hasSchedulerAccess,
  hasTeamAccess,
  hasUserAccess,
}) => (
  <div className="page-container">
    <PageTitle />
    <div className="page-panel page-panel--white">
      <div className="page-title">
        <h1>
          <I18n>Settings</I18n>
        </h1>
      </div>

      <I18n
        render={translate => (
          <div className="cards cards--seconds">
            {isSpaceAdmin && (
              <SettingsCard
                name={translate('Space Settings')}
                path={`/settings/space`}
                icon="fa-gear"
                description={translate('View and modify space settings')}
              />
            )}
            {hasDatastoreAccess && (
              <SettingsCard
                name={translate('Datastore Forms')}
                path={`/settings/datastore`}
                icon="fa-hdd-o"
                description={translate('View, create, and edit reference data')}
              />
            )}
            {hasNotificationAccess && (
              <SettingsCard
                name={translate('Notifications')}
                path={`/settings/notifications`}
                icon="fa-envelope-o"
                description={translate(
                  'View, create, and edit email notifications',
                )}
              />
            )}
            {hasRobotAccess && (
              <SettingsCard
                name={translate('Robots')}
                path={`/settings/robots`}
                icon="fa-tasks"
                description={translate('View, create, and edit robots')}
              />
            )}
            {hasSchedulerAccess && (
              <SettingsCard
                name={translate('Schedulers')}
                path={`/settings/schedulers`}
                icon="fa-calendar"
                description={translate('View, create, and manage schedulers')}
              />
            )}
            {hasTeamAccess && (
              <SettingsCard
                name={translate('Team Management')}
                path={`/settings/teams`}
                icon="fa-users"
                description={translate('View, create, and edit teams')}
              />
            )}
            {hasUserAccess && (
              <SettingsCard
                name={translate('User Management')}
                path={`/settings/users`}
                icon="fa-users"
                description={translate('View, create, and edit users')}
              />
            )}
          </div>
        )}
      />
    </div>
  </div>
);

const mapStateToProps = state => ({
  isSpaceAdmin: state.app.profile.spaceAdmin,
  hasDatastoreAccess: state.settingsApp.hasDatastoreAccess,
  hasNotificationAccess: state.settingsApp.hasNotificationAccess,
  hasRobotAccess: state.settingsApp.hasRobotAccess,
  hasSchedulerAccess: state.settingsApp.hasSchedulerAccess,
  hasTeamAccess: state.settingsApp.hasTeamAccess,
  hasUserAccess: state.settingsApp.hasUserAccess,
});

export const Settings = connect(mapStateToProps)(SettingsComponent);

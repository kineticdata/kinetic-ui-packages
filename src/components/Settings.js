import React from 'react';
import { Link } from '@reach/router';
import { connect } from '../redux/store';
import { PageTitle } from './shared/PageTitle';
import { I18n } from '@kineticdata/react';
import { Card, CardCol, CardRow } from '@kineticdata/bundle-common';

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

const SettingsComponent = ({
  isSpaceAdmin,
  hasDatastoreAccess,
  hasNotificationAccess,
  hasRobotAccess,
  hasCalendarAccess,
  hasSchedulerAccess,
  hasTeamAccess,
  hasUserAccess,
}) => (
  <div className="page-container">
    <div className="page-panel">
      <PageTitle breadcrumbs={[{ label: 'Home', to: '/' }]} title="Settings" />

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
            {hasCalendarAccess && (
              <SettingsCard
                name={translate('Calendar Management')}
                path={`/settings/calendars`}
                icon="fa-calendar"
                description={translate(
                  'View, create, and edit calendar configurations',
                )}
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
  hasCalendarAccess: state.settingsApp.hasCalendarAccess,
  hasSchedulerAccess: state.settingsApp.hasSchedulerAccess,
  hasTeamAccess: state.settingsApp.hasTeamAccess,
  hasUserAccess: state.settingsApp.hasUserAccess,
});

export const Settings = connect(mapStateToProps)(SettingsComponent);

import React from 'react';
import { Link } from '@reach/router';
import { connect } from '../redux/store';
import { bundle } from '@kineticdata/react';
import { selectVisibleKapps } from '@kineticdata/bundle-common';
import { I18n } from '@kineticdata/react';

import { isActiveClass } from '../utils';

export const SidebarComponent = ({
  isSpaceAdmin,
  hasDatastoreAccess,
  hasNotificationAccess,
  hasRobotAccess,
  hasSchedulerAccess,
  hasTeamAccess,
  hasUserAccess,
  visibleKapps,
}) => (
  <div className="sidebar">
    <div className="sidebar-group--content-wrapper">
      <div className="sidebar-group">
        <div className="sidebar-group__label">Space Settings</div>
        <ul className="nav flex-column">
          <li className="nav-item">
            {isSpaceAdmin && (
              <Link to="space" getProps={isActiveClass('nav-link')}>
                <I18n>Space</I18n>
                <span className="fa fa-fw fa-angle-right" />
              </Link>
            )}
            {hasDatastoreAccess && (
              <Link to="datastore" getProps={isActiveClass('nav-link')}>
                <I18n>Datastore</I18n>
                <span className="fa fa-fw fa-angle-right" />
              </Link>
            )}
            {hasNotificationAccess && (
              <Link to="notifications" getProps={isActiveClass('nav-link')}>
                <I18n>Notifications</I18n>
                <span className="fa fa-fw fa-angle-right" />
              </Link>
            )}
            {hasRobotAccess && (
              <Link to="robots" getProps={isActiveClass('nav-link')}>
                <I18n>Robots</I18n>
                <span className="fa fa-fw fa-angle-right" />
              </Link>
            )}
            {hasSchedulerAccess && (
              <Link to="schedulers" getProps={isActiveClass('nav-link')}>
                <I18n>Schedulers</I18n>
                <span className="fa fa-fw fa-angle-right" />
              </Link>
            )}
            {hasTeamAccess && (
              <Link to="teams" getProps={isActiveClass('nav-link')}>
                <I18n>Teams</I18n>
                <span className="fa fa-fw fa-angle-right" />
              </Link>
            )}
            {hasUserAccess && (
              <Link to="users" getProps={isActiveClass('nav-link')}>
                <I18n>Users</I18n>
                <span className="fa fa-fw fa-angle-right" />
              </Link>
            )}
          </li>
        </ul>
      </div>
      {/*visibleKapps &&
            visibleKapps.length > 0 && (
              <div className="sidebar-group">
                <h1>Kapp Settings</h1>
                <ul className="nav flex-column">
                  {visibleKapps.map(kapp => (
                    <Link
                      key={kapp.slug}
                      to={`/kapps/${kapp.slug}/settings`}
                      getProps={isActiveClass('nav-link')}
                    >
                      <I18n>{kapp.name}</I18n>
                      <span className="fa fa-fw fa-angle-right" />
                    </Link>
                  ))}
                </ul>
              </div>
            )*/}
    </div>
    {isSpaceAdmin && (
      <div className="sidebar-group sidebar-group--settings">
        <ul className="nav flex-column settings-group">
          <li>
            <a
              href={`${bundle.spaceLocation()}/app`}
              target="_blank"
              rel="noopener noreferrer"
              className="nav-link nav-link--admin"
            >
              <I18n>Kinetic Platform Admin</I18n>
              <span className="fa fa-fw fa-external-link" />
            </a>
          </li>
        </ul>
      </div>
    )}
  </div>
);

export const mapStateToProps = state => ({
  isSpaceAdmin: state.app.profile.spaceAdmin,
  hasDatastoreAccess: state.settingsApp.hasDatastoreAccess,
  hasNotificationAccess: state.settingsApp.hasNotificationAccess,
  hasRobotAccess: state.settingsApp.hasRobotAccess,
  hasSchedulerAccess: state.settingsApp.hasSchedulerAccess,
  hasTeamAccess: state.settingsApp.hasTeamAccess,
  hasUserAccess: state.settingsApp.hasUserAccess,
  visibleKapps: selectVisibleKapps(state),
});

export const Sidebar = connect(mapStateToProps)(SidebarComponent);

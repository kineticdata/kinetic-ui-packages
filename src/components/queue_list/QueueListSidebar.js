import React, { useCallback } from 'react';
import { Link } from '@reach/router';
import { Nav, NavItem } from 'reactstrap';
import { I18n } from '@kineticdata/react';
import classNames from 'classnames';
import matchPath from 'rudy-match-path';
import { connect } from '../../redux/store';
import { selectMyTeamForms } from '../../redux/modules/queueApp';
import { actions as queueActions } from '../../redux/modules/queue';

const formatCount = count =>
  count || count === 0 ? (count >= 1000 ? '(999+)' : `(${count})`) : '';

const QueueListSidebarComponent = ({
  counts,
  openNewItemMenu,
  myFilters,
  teamFilters,
  hasTeams,
  hasForms,
  pathname,
  appLocation,
  onSidebarAction,
  showCreateNew = true,
}) => {
  const SidebarLink = useCallback(
    ({ to, matchParams = {}, icon, children }) => (
      <Link
        to={to}
        className={classNames('nav-link', {
          active: matchPath(pathname, {
            path: decodeURI(to),
            exact: true,
          }),
        })}
        onClick={onSidebarAction}
      >
        <span className={icon} />
        {children}
      </Link>
    ),
    [pathname, onSidebarAction],
  );

  return (
    <div className="queue-sidebar">
      {showCreateNew &&
        hasForms && (
          <div className="px-4 pt-4 pb-2">
            <button
              type="button"
              className="btn btn-secondary btn-block"
              onClick={openNewItemMenu}
            >
              <I18n>New Task</I18n>
            </button>
          </div>
        )}
      <Nav className="nav-tabs nav-tabs--vertical">
        <div className="nav-item nav-item--header">Default Filters</div>
        <NavItem>
          <SidebarLink to={`${appLocation}/list/Mine`} icon="fa fa-user fa-fw">
            <I18n>Mine</I18n> {formatCount(counts.get('Mine', 0))}
          </SidebarLink>
        </NavItem>
        {hasTeams && (
          <NavItem>
            <SidebarLink
              to={`${appLocation}/list/Unassigned`}
              icon="fa fa-inbox fa-fw"
            >
              <I18n>Unassigned</I18n> {formatCount(counts.get('Unassigned', 0))}
            </SidebarLink>
          </NavItem>
        )}
        <NavItem>
          <SidebarLink
            to={`${appLocation}/list/Created By Me`}
            icon="fa fa-user-circle-o fa-fw"
          >
            <I18n>Created By Me</I18n>{' '}
            {formatCount(counts.get('Created By Me', 0))}
          </SidebarLink>
        </NavItem>

        <div className="nav-item nav-item--header">
          <I18n>Team Filters</I18n>
        </div>
        {teamFilters.map(filter => (
          <NavItem key={filter.name}>
            <SidebarLink
              to={`${appLocation}/team/${encodeURIComponent(filter.name)}`}
              icon={`fa fa-fw fa-${filter.icon}`}
            >
              <I18n>{`${filter.name}`}</I18n>
            </SidebarLink>
          </NavItem>
        ))}

        <div className="nav-item nav-item--header">
          <I18n>My Filters</I18n>
        </div>
        {myFilters.map(filter => (
          <NavItem key={filter.name}>
            <SidebarLink
              to={`${appLocation}/custom/${encodeURIComponent(filter.name)}`}
              icon="fa fa-star-o fa-fw"
            >
              {filter.name}
            </SidebarLink>
          </NavItem>
        ))}
        {myFilters.size === 0 && (
          <NavItem>
            <span className="nav-link">
              <span className="fa fa-filled-star" role="presentation" />
              <em>
                <I18n>None Configured</I18n>
              </em>
            </span>
          </NavItem>
        )}
      </Nav>
    </div>
  );
};

export const QueueListSidebar = connect(
  state => ({
    appLocation: state.app.location,
    pathname: state.router.location.pathname,
    teamFilters: state.queueApp.teamFilters,
    myFilters: state.queueApp.myFilters,
    counts: state.queueApp.filters
      .toMap()
      .mapEntries(([_, filter]) => [
        filter.name,
        state.queue.counts.get(filter),
      ]),
    hasTeams: state.queueApp.myTeams.size > 0,
    hasForms:
      selectMyTeamForms(state).filter(form => form.type === 'Task').length > 0,
  }),
  {
    openNewItemMenu: queueActions.openNewItemMenu,
  },
)(QueueListSidebarComponent);

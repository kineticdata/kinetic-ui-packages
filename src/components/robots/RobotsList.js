import React from 'react';
import { Link } from '@reach/router';
import { connect } from 'react-redux';
import { push } from 'redux-first-history';
import { compose, lifecycle, withHandlers, withState } from 'recompose';
import {
  Dropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
} from 'reactstrap';
import moment from 'moment';
import { Constants, Loading, openConfirm } from '@kineticdata/bundle-common';
import wallyHappyImage from '@kineticdata/bundle-common/assets/images/wally-happy.svg';
import { PageTitle } from '../shared/PageTitle';

import { actions } from '../../redux/modules/settingsRobots';
import { context } from '../../redux/store';
import { I18n } from '@kineticdata/react';

const getStatusColor = status =>
  status === 'Inactive'
    ? 'status--red'
    : status === 'Expired'
      ? 'status--yellow'
      : 'status--green';

const getNextExecution = (nextExecutions, robotId) => {
  let nextExecution;
  const found = nextExecutions.find(
    execution => execution.values['Robot ID'] === robotId,
  );

  if (found) {
    nextExecution = found.values['Next Execution']
      ? found.values['Next Execution']
      : 'No upcoming executions scheduled';
  } else {
    nextExecution = 'Unknown';
  }

  return nextExecution;
};

const WallyEmptyMessage = () => {
  return (
    <div className="empty-state empty-state--wally">
      <div className="empty-state__title">
        <I18n>No Robots Found</I18n>
      </div>
      <img src={wallyHappyImage} alt="Happy Wally" />
    </div>
  );
};

const RobotsListComponent = ({
  robots,
  robotsLoading,
  robotsLoaded,
  robotsErrors,
  nextExecutions,
  nextExecutionsLoading,
  openDropdown,
  toggleDropdown,
  handleClone,
  handleDelete,
}) => {
  const loading = !nextExecutionsLoading && !robotsLoading && !robotsLoaded;
  return loading ? (
    <Loading />
  ) : (
    <div className="page-container">
      <PageTitle parts={['Robots', 'Settings']} />
      <div className="page-panel page-panel--white">
        <div className="page-title">
          <div
            role="navigation"
            aria-label="breadcrumbs"
            className="page-title__breadcrumbs"
          >
            <span className="breadcrumb-item">
              <Link to="/settings">
                <I18n>settings</I18n>
              </Link>
            </span>{' '}
            <span aria-hidden="true">/ </span>
            <h1>
              <I18n>Robots</I18n>
            </h1>
          </div>
          <Link to={`/settings/robots/robots/new`} className="btn btn-primary">
            <I18n>Create Robot</I18n>
          </Link>
        </div>
        {robots.size <= 0 &&
          robotsErrors.length > 0 && (
            <div className="text-center text-danger">
              <h1>
                <I18n>Oops!</I18n>
              </h1>
              <h2>
                <I18n>Robots Not Found</I18n>
              </h2>
              {robotsErrors.map(error => (
                <p className="error-details">{error}</p>
              ))}
            </div>
          )}
        {robots.size > 0 && (
          <table className="table table-sm table-striped table-robots">
            <thead className="header">
              <tr>
                <th scope="col">
                  <I18n>Robot Name</I18n>
                </th>
                <th scope="col" width="25%">
                  <I18n>Status</I18n>
                </th>
                <th scope="col">
                  <I18n>Category</I18n>
                </th>
                <th scope="col">
                  <I18n>Tree Name</I18n>
                </th>
                <th scope="col">
                  <I18n>Description</I18n>
                </th>
                <th scope="col">
                  <I18n>Next Execution Time</I18n>
                </th>
              </tr>
            </thead>
            <tbody>
              {robots.map(robot => {
                const nextExecution = nextExecutions
                  ? getNextExecution(nextExecutions, robot.id)
                  : 'fetching';
                const isExpired =
                  robot.values['End Date'] &&
                  moment(robot.values['End Date']).isBefore(moment());
                return (
                  <tr key={robot.id}>
                    <td>
                      <Link to={`/settings/robots/${robot.id}`}>
                        <span>{robot.values['Robot Name']}</span>
                      </Link>
                    </td>
                    <td>
                      <span
                        className={`status ${getStatusColor(
                          robot.values['Status'],
                        )}`}
                      >
                        {robot.values['Status']}
                      </span>
                      {isExpired && (
                        <span className={`status ${getStatusColor('Expired')}`}>
                          Expired
                        </span>
                      )}
                    </td>
                    <td>{robot.values['Category']}</td>
                    <td>{robot.values['Task Tree']}</td>
                    <td>{robot.values['Description']}</td>
                    <td>
                      {moment(nextExecution).isValid()
                        ? moment(nextExecution).format(Constants.TIME_FORMAT)
                        : nextExecution}
                    </td>
                    <td>
                      <Dropdown
                        toggle={toggleDropdown(robot.id)}
                        isOpen={openDropdown === robot.id}
                      >
                        <DropdownToggle color="link" className="btn-sm">
                          <span className="fa fa-ellipsis-h fa-2x" />
                        </DropdownToggle>
                        <DropdownMenu right>
                          <DropdownItem tag={Link} to={robot.id}>
                            <I18n>Edit</I18n>
                          </DropdownItem>
                          <DropdownItem onClick={handleClone(robot.id)}>
                            <I18n>Clone</I18n>
                          </DropdownItem>
                          <DropdownItem divider />
                          <DropdownItem
                            onClick={handleDelete(robot.id)}
                            className="text-danger"
                          >
                            <I18n>Delete</I18n>
                          </DropdownItem>
                        </DropdownMenu>
                      </Dropdown>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        {robotsErrors.length <= 0 && robots.size === 0 && <WallyEmptyMessage />}
      </div>
    </div>
  );
};

const handleClone = ({ cloneRobot, fetchRobots }) => id => () =>
  cloneRobot({ id: id, callback: fetchRobots });

const handleDelete = ({ deleteRobot, fetchRobots }) => id => () =>
  openConfirm({
    title: 'Delete Robot',
    body: 'Are you sure you want to delete this Robot?',
    actionName: 'Delete',
    ok: () => {
      deleteRobot({ id: id, callback: fetchRobots });
    },
  });

const toggleDropdown = ({
  setOpenDropdown,
  openDropdown,
}) => dropdownSlug => () =>
  setOpenDropdown(dropdownSlug === openDropdown ? '' : dropdownSlug);

export const mapStateToProps = state => ({
  robot: state.settingsRobots.robot,
  robots: state.settingsRobots.robots,
  robotsLoading: state.settingsRobots.robotsLoading,
  robotsLoaded: state.settingsRobots.robotsLoaded,
  robotsErrors: state.settingsRobots.robotsErrors,
  nextExecutions: state.settingsRobots.nextExecutions,
  nextExecutionsLoading: state.settingsRobots.nextExecutionsLoading,
});

export const mapDispatchToProps = {
  push,
  fetchRobots: actions.fetchRobots,
  fetchNextExecutions: actions.fetchNextExecutions,
  deleteRobot: actions.deleteRobot,
  cloneRobot: actions.cloneRobot,
};

export const RobotsList = compose(
  connect(
    mapStateToProps,
    mapDispatchToProps,
    null,
    { context },
  ),
  withState('openDropdown', 'setOpenDropdown', ''),
  withHandlers({
    toggleDropdown,
    handleClone,
    handleDelete,
  }),
  lifecycle({
    componentWillMount() {
      this.props.fetchRobots();
      this.props.fetchNextExecutions();
    },
  }),
)(RobotsListComponent);

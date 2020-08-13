import React from 'react';
import { Link } from '@reach/router';
import { compose, withHandlers, lifecycle } from 'recompose';
import { connect } from '../../redux/store';
import {
  I18n,
  DatastoreSubmissionTable,
  Moment,
  refetchTable,
} from '@kineticdata/react';
import {
  UncontrolledDropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
} from 'reactstrap';
import {
  TableComponents,
  addToast,
  addToastAlert,
  openConfirm,
} from '@kineticdata/bundle-common';
import { PageTitle } from '../shared/PageTitle';
import { actions, ROBOT_FORM_SLUG } from '../../redux/modules/settingsRobots';
import moment from 'moment';

const NameCell = ({ row }) => (
  <td>
    <Link to={row.get('id')}>{row.getIn(['values', 'Robot Name'])}</Link>
  </td>
);

const StatusCell = ({ row }) => {
  const isExpired =
    row.getIn(['values', 'End Date']) &&
    moment(row.getIn(['values', 'End Date'])).isBefore(moment());
  return (
    <td>
      <TableComponents.StatusBadge status={row.getIn(['values', 'Status'])} />
      {isExpired && <TableComponents.StatusBadge status={'Expired'} />}
    </td>
  );
};

const getNextExecution = (nextExecutions, robotId) => {
  let nextExecution;
  const found = nextExecutions.find(
    execution => execution.values['Robot ID'] === robotId,
  );

  if (found) {
    nextExecution = found.values['Next Execution'] ? (
      <Moment
        timestamp={found.values['Next Execution']}
        format={Moment.formats.dateTime}
      />
    ) : (
      'No upcoming executions scheduled'
    );
  } else {
    nextExecution = 'Unknown';
  }

  return nextExecution;
};

const EmptyBodyRow = TableComponents.generateEmptyBodyRow({
  loadingMessage: 'Loading Robots...',
  noSearchResultsMessage:
    'No robots were found - please modify your search criteria',
  noItemsMessage: 'There are no robots to display',
});

export const RobotsListComponent = ({
  tableKey,
  nextExecutions,
  nextExecutionsError,
  handleClone,
  handleDelete,
}) => {
  const ExecutionsCell = ({ row }) => {
    const nextExecution = nextExecutions
      ? getNextExecution(nextExecutions, row.get('id'))
      : nextExecutionsError
        ? 'Error'
        : 'Fetching...';
    return <td>{nextExecution}</td>;
  };

  const ActionsCell = ({ row }) => (
    <td>
      <UncontrolledDropdown>
        <DropdownToggle tag="button" className="btn btn-sm btn-link">
          <span className="sr-only">More Actions</span>
          <span className="fa fa-chevron-down fa-fw" role="presentation" />
        </DropdownToggle>
        <DropdownMenu right>
          <DropdownItem tag={Link} to={row.get('id')}>
            <I18n>Edit</I18n>
          </DropdownItem>
          <DropdownItem onClick={handleClone(row.get('id'))}>
            <I18n>Clone</I18n>
          </DropdownItem>
          <DropdownItem tag={Link} to={`${row.get('id')}/executions`}>
            <I18n>View Executions</I18n>
          </DropdownItem>
          <DropdownItem divider />
          <DropdownItem
            onClick={handleDelete(row.get('id'))}
            className="text-danger"
          >
            <I18n>Delete</I18n>
          </DropdownItem>
        </DropdownMenu>
      </UncontrolledDropdown>
    </td>
  );

  return (
    <DatastoreSubmissionTable
      tableKey={tableKey}
      formSlug={ROBOT_FORM_SLUG}
      include="values"
      components={{
        EmptyBodyRow,
      }}
      columnSet={[
        'robotName',
        'status',
        'category',
        'treeName',
        'description',
        'nextExecutionTime',
        'actions',
      ]}
      defaultSortColumn={'robotName'}
      defaultSortDirection={'asc'}
      addColumns={[
        {
          value: 'robotName',
          title: 'Robot Name',
          sortable: true,
          components: {
            BodyCell: NameCell,
          },
        },
        {
          value: 'status',
          title: 'Status',
          components: {
            BodyCell: StatusCell,
          },
        },
        {
          value: 'category',
          valueTransform: (_value, row) => row.getIn(['values', 'Category']),
          title: 'Category',
        },
        {
          value: 'treeName',
          valueTransform: (_value, row) => row.getIn(['values', 'Task Tree']),
          title: 'Tree Name',
        },
        {
          value: 'description',
          valueTransform: (_value, row) => row.getIn(['values', 'Description']),
          title: 'Description',
        },
        {
          value: 'nextExecutionTime',
          title: 'Next Execution Time',
          components: {
            BodyCell: ExecutionsCell,
          },
        },
        {
          value: 'actions',
          title: ' ',
          components: {
            BodyCell: ActionsCell,
          },
        },
      ]}
      initialFilterValues={{
        query: {
          index: 'values[Robot Name]',
        },
      }}
    >
      {({ pagination, table }) => (
        <div className="page-container">
          <PageTitle parts={['Robots']} />
          <div className="page-panel page-panel--white">
            <div className="page-title">
              <div
                role="navigation"
                aria-label="breadcrumbs"
                className="page-title__breadcrumbs"
              >
                <span className="breadcrumb-item">
                  <span className="breadcrumb-item">
                    <Link to="..">
                      <I18n>settings</I18n>
                    </Link>
                  </span>{' '}
                  <span aria-hidden="true">/ </span>
                </span>
                <h1>
                  <I18n>Robots</I18n>
                </h1>
              </div>
              <div className="page-title__actions">
                <Link to={`new`} className="btn btn-primary">
                  <I18n>Create Robot</I18n>
                </Link>
              </div>
            </div>
            <div className="scroll-wrapper-h">{table}</div>
            {pagination}
          </div>
        </div>
      )}
    </DatastoreSubmissionTable>
  );
};

const mapStateToProps = state => ({
  nextExecutions: state.settingsRobots.nextExecutions,
  nextExecutionsError: state.settingsRobots.nextExecutionsError,
});

const mapDispatchToProps = {
  fetchNextExecutions: actions.fetchNextExecutionsRequest,
  cloneRobot: actions.cloneRobotRequest,
  deleteRobot: actions.deleteRobotRequest,
};

const handleClone = props => id => () =>
  props.cloneRobot({
    id: id,
    success: submission => {
      addToast(`Robot cloned successfully`);
      refetchTable(props.tableKey);
      props.navigate(submission.id);
    },
    failure: error =>
      addToastAlert({ title: 'Clone Failed', message: error.message }),
  });

const handleDelete = props => id => () =>
  openConfirm({
    title: 'Delete Robot',
    body: 'Are you sure you want to delete this Robot?',
    actionName: 'Delete',
    ok: () => {
      props.deleteRobot({
        id: id,
        success: () => {
          addToast(`Robot deleted successfully`);
          refetchTable(props.tableKey);
        },
        failure: error =>
          addToastAlert({ title: 'Delete Failed', message: error.message }),
      });
    },
  });

export const RobotsList = compose(
  connect(
    mapStateToProps,
    mapDispatchToProps,
  ),
  withHandlers({
    handleClone,
    handleDelete,
  }),
  lifecycle({
    componentDidMount() {
      this.props.fetchNextExecutions();
    },
  }),
)(RobotsListComponent);

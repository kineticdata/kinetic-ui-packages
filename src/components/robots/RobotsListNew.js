import React from 'react';
import { Link } from '@reach/router';
import { compose, withState, withHandlers, lifecycle } from 'recompose';
import { connect } from '../../redux/store';
import {
  I18n,
  DatastoreSubmissionTable,
  mountTable,
  unmountTable,
  refetchTable,
} from '@kineticdata/react';
import {
  Dropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
} from 'reactstrap';
import { TableComponents, openConfirm } from '@kineticdata/bundle-common';
import { PageTitle } from '../shared/PageTitle';
import { actions, ROBOT_FORM_SLUG } from '../../redux/modules/settingsRobots';

const tableKey = 'robots-list';

const NameCell = ({ row }) => (
  <td>
    <Link to={row.get('id')}>{row.getIn(['values', 'Robot Name'])}</Link>
  </td>
);

const StatusCell = ({ row }) => (
  <td>
    <TableComponents.CoreStateBadge coreState={row.getIn(['values', 'Status'])}>
      {row.getIn(['values', 'Status'])}
    </TableComponents.CoreStateBadge>
  </td>
);

const CategoryCell = ({ row }) => <td>{row.getIn(['values', 'Category'])}</td>;

const TreeCell = ({ row }) => <td>{row.getIn(['values', 'Task Tree'])}</td>;

const DescriptionCell = ({ row }) => (
  <td>{row.getIn(['values', 'Description'])}</td>
);

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

const EmptyBodyRow = TableComponents.generateEmptyBodyRow({
  loadingMessage: 'Loading Robots...',
  noSearchResultsMessage:
    'No robots were found - please modify your search criteria',
  noItemsMessage: 'There are no robots to display.',
});

export const RobotsListComponent = ({
  openModal,
  filterModalOpen,
  setFilterModalOpen,
  nextExecutions,
  openDropdown,
  toggleDropdown,
  handleClone,
  handleDelete,
}) => {
  const ExecutionsCell = ({ row }) => {
    const nextExecution = nextExecutions
      ? getNextExecution(nextExecutions, row.get('id'))
      : 'fetching';
    return <td>{nextExecution}</td>;
  };

  const ActionsCell = ({ row }) => (
    <td>
      <Dropdown
        toggle={toggleDropdown(row.get('id'))}
        isOpen={openDropdown === row.get('id')}
      >
        <DropdownToggle color="link" className="btn-sm">
          <span className="fa fa-ellipsis-h fa-2x" />
        </DropdownToggle>
        <DropdownMenu right>
          <DropdownItem tag={Link} to={row.get('id')}>
            <I18n>Edit</I18n>
          </DropdownItem>
          <DropdownItem onClick={handleClone(row.get('id'))}>
            <I18n>Clone</I18n>
          </DropdownItem>
          <DropdownItem divider />
          <DropdownItem
            onClick={handleDelete(row.get('id'))}
            className="text-danger"
          >
            <I18n>Delete</I18n>
          </DropdownItem>
        </DropdownMenu>
      </Dropdown>
    </td>
  );

  return (
    <DatastoreSubmissionTable
      tableKey={tableKey}
      formSlug={ROBOT_FORM_SLUG}
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
          sortable: false,
          components: {
            BodyCell: StatusCell,
          },
        },
        {
          value: 'category',
          title: 'Category',
          sortable: false,
          components: {
            BodyCell: CategoryCell,
          },
        },
        {
          value: 'treeName',
          title: 'Tree Name',
          sortable: false,
          components: {
            BodyCell: TreeCell,
          },
        },
        {
          value: 'description',
          title: 'Description',
          sortable: false,
          components: {
            BodyCell: DescriptionCell,
          },
        },
        {
          value: 'nextExecutionTime',
          title: 'Next Execution Time',
          sortable: false,
          components: {
            BodyCell: ExecutionsCell,
          },
        },
        {
          value: 'actions',
          title: ' ',
          sortable: false,
          components: {
            BodyCell: ActionsCell,
          },
        },
      ]}
    >
      {({ pagination, table }) => (
        <div className="page-container">
          <PageTitle parts={[`Robots List`]} />
          <div className="page-panel page-panel--white">
            <div className="page-title">
              <div
                role="navigation"
                aria-label="breadcrumbs"
                className="page-title__breadcrumbs"
              >
                <span className="breadcrumb-item">
                  <span className="breadcrumb-item">
                    <Link to="../../../">
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
                <Link
                  to={`/settings/robots/robots/new`}
                  className="btn btn-primary"
                >
                  <I18n>Create Robot</I18n>
                </Link>
              </div>
            </div>
            <div>
              <div className="scroll-wrapper-h">{table}</div>
              {pagination}
            </div>
          </div>
        </div>
      )}
    </DatastoreSubmissionTable>
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

const mapStateToProps = state => ({
  nextExecutions: state.settingsRobots.nextExecutions,
  nextExecutionsLoading: state.settingsRobots.nextExecutionsLoading,
  robots: state.settingsRobots.robots,
});

const mapDispatchToProps = {
  openModal: actions.openModal,
  fetchNextExecutions: actions.fetchNextExecutions,
  fetchRobots: actions.fetchRobots,
  deleteRobot: actions.deleteRobot,
  cloneRobot: actions.cloneRobot,
};

export const RobotsList = compose(
  connect(
    mapStateToProps,
    mapDispatchToProps,
  ),
  withState('filterModalOpen', 'setFilterModalOpen', false),
  withState('openDropdown', 'setOpenDropdown', ''),
  withHandlers({
    toggleDropdown,
    handleClone,
    handleDelete,
  }),
  lifecycle({
    componentDidMount() {
      this.props.fetchNextExecutions();
      mountTable(tableKey);
    },
    componentDidUpdate(prevProps) {
      if (this.props.robots !== prevProps.robots) {
        refetchTable(tableKey);
      }
    },
    componentWillUnmount() {
      unmountTable(tableKey);
    },
  }),
)(RobotsListComponent);

import React from 'react';
import { Link } from '@reach/router';
import { compose, withHandlers, lifecycle } from 'recompose';
import { connect } from '../../redux/store';
import {
  I18n,
  DatastoreSubmissionTable,
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
  PageTitle,
} from '@kineticdata/bundle-common';
import {
  actions,
  CALENDAR_FORM_SLUG,
} from '../../redux/modules/settingsCalendars';
import moment from 'moment';

const NameCell = ({ row }) => (
  <td>
    <Link to={`calendar/${row.get('id')}`}>
      {row.getIn(['values', 'Calendar Name'])}
    </Link>
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

const EmptyBodyRow = TableComponents.generateEmptyBodyRow({
  loadingMessage: 'Loading Calendars...',
  noSearchResultsMessage:
    'No calendars were found - please modify your search criteria',
  noItemsMessage: 'There are no calendars to display',
});

export const CalendarListComponent = ({
  tableKey,
  handleClone,
  handleDelete,
  breadcrumbs,
  appLocation,
  title,
}) => {
  const ActionsCell = ({ row }) => (
    <td>
      <UncontrolledDropdown>
        <DropdownToggle tag="button" className="btn btn-sm btn-link">
          <span className="sr-only">More Actions</span>
          <span className="fa fa-chevron-down fa-fw" role="presentation" />
        </DropdownToggle>
        <DropdownMenu right>
          <DropdownItem tag={Link} to={`calendar/${row.get('id')}`}>
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
      </UncontrolledDropdown>
    </td>
  );

  return (
    <DatastoreSubmissionTable
      tableKey={tableKey}
      formSlug={CALENDAR_FORM_SLUG}
      include="values"
      components={{
        EmptyBodyRow,
      }}
      columnSet={['calendarName', 'status', 'description', 'actions']}
      defaultSortColumn={'calendarName'}
      defaultSortDirection={'asc'}
      addColumns={[
        {
          value: 'calendarName',
          title: 'Calendar Name',
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
          value: 'actions',
          title: ' ',
          components: {
            BodyCell: ActionsCell,
          },
        },
      ]}
      initialFilterValues={{
        query: {
          index: 'values[Calendar Name]',
        },
      }}
    >
      {({ pagination, table }) => (
        <div className="page-container">
          <div className="page-panel page-panel--white">
            <PageTitle
              parts={['Calendars']}
              settings
              breadcrumbs={breadcrumbs}
              title={title}
              actions={[
                {
                  label: 'Create Calendar',
                  to: `${appLocation}/calendars/calendar/new`,
                },
              ]}
            />
            <div className="scroll-wrapper-h">{table}</div>
            {pagination}
          </div>
        </div>
      )}
    </DatastoreSubmissionTable>
  );
};

const mapStateToProps = state => ({
  appLocation: state.app.location,
});

const mapDispatchToProps = {
  fetchCalendars: actions.fetchCalendarsRequest,
  cloneCalendar: actions.cloneCalendarRequest,
  deleteCalendar: actions.deleteCalendarRequest,
};

const handleClone = props => id => () =>
  props.cloneCalendar({
    id: id,
    success: submission => {
      addToast(`Calendar cloned successfully`);
      refetchTable(props.tableKey);
      props.navigate(submission.id);
    },
    failure: error =>
      addToastAlert({ title: 'Clone Failed', message: error.message }),
  });

const handleDelete = props => id => () =>
  openConfirm({
    title: 'Delete Calendar',
    body: 'Are you sure you want to delete this Calendar?',
    actionName: 'Delete',
    ok: () => {
      props.deleteCalendar({
        id: id,
        success: () => {
          addToast(`Calendar deleted successfully`);
          refetchTable(props.tableKey);
        },
        failure: error =>
          addToastAlert({ title: 'Delete Failed', message: error.message }),
      });
    },
  });

export const CalendarList = compose(
  connect(mapStateToProps, mapDispatchToProps),
  withHandlers({
    handleClone,
    handleDelete,
  }),
  lifecycle({
    componentDidMount() {
      this.props.fetchCalendars();
    },
    componentWillUpdate() {
      refetchTable(this.props.tableKey);
    },
  }),
)(CalendarListComponent);

import React from 'react';
import { Link } from '@reach/router';
import { connect } from '../../redux/store';
import { compose } from 'recompose';
import { I18n, DatastoreSubmissionTable, Moment } from '@kineticdata/react';
import { TableComponents } from '@kineticdata/bundle-common';
import { ROBOT_EXECUTIONS_FORM_SLUG } from '../../redux/modules/settingsRobots';
import { PageTitle } from '../shared/PageTitle';

export const StatusBadge = ({ status }) => (
  <span
    className={`badge ${
      status === 'Queued'
        ? 'badge-warning'
        : status === 'Running'
          ? 'badge-success'
          : 'badge-secondary'
    }`}
  >
    <I18n>{status}</I18n>
  </span>
);

const EmptyBodyRow = TableComponents.generateEmptyBodyRow({
  loadingMessage: 'Loading Executions...',
  noSearchResultsMessage:
    'No executions were found - please modify your search criteria',
  noItemsMessage: 'There are no executions to display',
});

const StatusCell = ({ value }) => {
  return (
    <td>
      <StatusBadge status={value} />
    </td>
  );
};

const StartDateCell = ({ value }) => {
  return (
    <td>
      <Moment timestamp={value} format={Moment.formats.dateTime} />
    </td>
  );
};

const EndDateCell = ({ row, value }) => {
  return (
    <td>
      {value && row.getIn(['values', 'Start']).toLowerCase() !== 'running' ? (
        <Moment timestamp={value} format={Moment.formats.dateTime} />
      ) : (
        ''
      )}
    </td>
  );
};

const LinkCell = ({ row }) => (
  <td>
    <Link to={row.get('id')}>
      <I18n>View</I18n> <span className="fa fa-fw fa-external-link-square" />
    </Link>
  </td>
);

const RobotExecutionsListComponent = ({
  tableKey,
  robot,
  robotError,
  robotId,
}) => {
  return (
    <DatastoreSubmissionTable
      tableKey={tableKey}
      formSlug={ROBOT_EXECUTIONS_FORM_SLUG}
      include="values"
      components={{
        EmptyBodyRow,
      }}
      columnSet={['robotName', 'status', 'start', 'end', 'link']}
      defaultSortColumn={'start'}
      defaultSortDirection={'desc'}
      addColumns={[
        {
          value: 'robotName',
          title: 'Robot Name',
          valueTransform: (_value, row) => row.getIn(['values', 'Robot Name']),
        },
        {
          value: 'status',
          title: 'Status',
          valueTransform: (_value, row) => row.getIn(['values', 'Status']),
          components: {
            BodyCell: StatusCell,
          },
        },
        {
          value: 'start',
          valueTransform: (_value, row) => row.getIn(['values', 'Start']),
          title: 'Start',
          sortable: true,
          components: {
            BodyCell: StartDateCell,
          },
        },
        {
          value: 'end',
          valueTransform: (_value, row) => row.getIn(['values', 'End']),
          title: 'End',
          components: {
            BodyCell: EndDateCell,
          },
        },
        {
          value: 'link',
          title: ' ',
          components: {
            BodyCell: LinkCell,
          },
        },
      ]}
      initialFilterValues={{
        query: {
          index: 'values[Robot ID],values[Start]',
          parts: ['values[Robot ID]', 'equals', robotId],
          q: `values[Robot ID] = "${robotId}"`,
        },
      }}
    >
      {({ pagination, table }) => (
        <div className="page-container">
          <div className="page-panel">
            <PageTitle
              parts={[
                'Executions',
                robot && robot.values['Robot Name'],
                `Robots`,
              ]}
              breadcrumbs={[
                { label: 'Home', to: '/' },
                { label: 'Settings', to: '../../..' },
                { label: 'Robots', to: '../..' },
                (robot || robotError) && {
                  label: robot ? robot.values['Robot Name'] : 'Robot',
                  to: '..',
                },
              ]}
              title="Executions"
            />
            <div className="scroll-wrapper-h">{table}</div>
            {pagination}
          </div>
        </div>
      )}
    </DatastoreSubmissionTable>
  );
};

export const mapStateToProps = state => ({
  robot: state.settingsRobots.robot,
  robotError: state.settingsRobots.robotError,
});

export const RobotExecutionsList = compose(connect(mapStateToProps))(
  RobotExecutionsListComponent,
);

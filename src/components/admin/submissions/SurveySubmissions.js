import React from 'react';
import { Link } from '@reach/router';
import { compose, lifecycle, withHandlers, withState } from 'recompose';
import { connect } from '../../../redux/store';
import { actions } from '../../../redux/modules/surveys';
import {
  I18n,
  SubmissionTable,
  mountTable,
  refetchTable,
  unmountTable,
} from '@kineticdata/react';
import {
  Dropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
} from 'reactstrap';
import { TableComponents, TimeAgo } from '@kineticdata/bundle-common';
import { FormStatusBadge, CoreStateBadgeCell } from '../../shared/StatusBadge';
import { ExportModal } from '../export/ExportModal';
import { PageTitle } from '../../shared/PageTitle';

const tableKey = 'survey-submissions';

const LinkCell = ({ row, value }) => (
  <td>
    <Link to={`${row.get('id')}/details`}>{value}</Link>
  </td>
);

const TimeAgoCell = ({ value }) => (
  <td>{value ? <TimeAgo timestamp={value} /> : 'N/A'}</td>
);

const ActionsCell = ({
  openDropdown,
  toggleDropdown,
  formActions,
  callFormAction,
}) => ({ row }) => (
  <td>
    <Dropdown
      toggle={toggleDropdown(row.get('id'))}
      isOpen={openDropdown === row.get('id')}
    >
      <DropdownToggle color="link" className="btn-sm">
        <span className="fa fa-chevron-down fa-fw" />
      </DropdownToggle>
      <DropdownMenu right positionFixed>
        <DropdownItem tag={Link} to={`${row.get('id')}/details`}>
          <I18n>View</I18n>
        </DropdownItem>
        {formActions.map(el => (
          <DropdownItem
            key={el.slug}
            onClick={() =>
              callFormAction({
                formSlug: el.slug,
                surveySubmission: row.toJS(),
              })
            }
          >
            <I18n>{el.name}</I18n>
          </DropdownItem>
        ))}
      </DropdownMenu>
    </Dropdown>
  </td>
);

const EmptyBodyRow = TableComponents.generateEmptyBodyRow({
  loadingMessage: 'Loading Submissions...',
  noSearchResultsMessage:
    'No submissions were found - please modify your search criteria',
  noItemsMessage: 'There are no submissions to display.',
});

// const VALUE_FILTER_MATCH = /values\[(.+)]/;

export const SurveySubmissionsComponent = ({
  kapp,
  form,
  formActions,
  callFormAction,
  openModal,
  openDropdown,
  toggleDropdown,
  filterOpen,
  setFilterOpen,
  navigate,
  createTestSubmission,
}) => {
  const FilterFormLayout = TableComponents.generateFilterFormLayout({
    isOpen: filterOpen,
    toggle: () => setFilterOpen(open => !open),
    fieldsLayout: [
      ['startDate', 'endDate'],
      'coreState',
      'submittedBy',
      'values',
    ],
  });

  return (
    form && (
      <SubmissionTable
        tableKey={tableKey}
        kappSlug={kapp.slug}
        formSlug={form.slug}
        components={{
          EmptyBodyRow,
          FilterFormLayout,
          FilterFormButtons: TableComponents.FilterFormButtons,
        }}
        columnSet={[
          'label',
          'createdAt',
          'submittedAt',
          'submittedBy',
          'coreState',
          'actions',
        ]}
        addColumns={[
          form.status === 'Active' && {
            value: 'actions',
            title: ' ',
            sortable: false,
            components: {
              BodyCell: ActionsCell({
                toggleDropdown,
                openDropdown,
                formActions,
                callFormAction,
              }),
            },
            className: 'text-right',
          },
        ].filter(Boolean)}
        alterColumns={{
          label: {
            components: { BodyCell: LinkCell },
          },
          submittedBy: {
            title: 'Submitter',
          },
          createdAt: {
            title: 'Created',
            components: {
              BodyCell: TimeAgoCell,
            },
          },
          submittedAt: {
            title: 'Submitted',
            components: {
              BodyCell: TimeAgoCell,
            },
          },
          coreState: {
            title: 'Status',
            sortable: true,
            components: {
              BodyCell: CoreStateBadgeCell,
            },
          },
        }}
        filterSet={[
          'startDate',
          'endDate',
          'coreState',
          'submittedBy',
          'values',
        ]}
        onSearch={() => () => setFilterOpen(false)}
      >
        {({ pagination, table, filter, appliedFilters, filterFormKey }) => {
          return (
            <div className="page-container">
              <div className="page-panel">
                <PageTitle
                  parts={[form.name]}
                  breadcrumbs={[
                    { label: 'Home', to: '/' },
                    { label: `${kapp.name} Admin`, to: '../..' },
                  ]}
                  title={form.name}
                  actions={[
                    {
                      label: 'Create Draft',
                      onClick: () =>
                        createTestSubmission({ formSlug: form.slug }),
                      menu: true,
                    },
                    {
                      label: 'Export Records',
                      onClick: () => openModal('export'),
                      menu: true,
                    },
                    {
                      label: 'Survey Settings',
                      to: '../settings',
                    },
                  ]}
                />
                <div>
                  <div className="data-list data-list--fourths">
                    <dl>
                      <dt>Description</dt>
                      <dd>
                        {form.description || (
                          <em className="text-muted">None</em>
                        )}
                      </dd>
                    </dl>
                    <dl>
                      <dt>Status</dt>
                      <dd>
                        <FormStatusBadge value={form.status} />
                      </dd>
                    </dl>
                    <dl>
                      <dt>Created</dt>
                      <dd>
                        <TimeAgo timestamp={form.createdAt} />
                        <br />
                        <small>
                          <I18n>by</I18n> {form.createdBy}
                        </small>
                      </dd>
                    </dl>
                    <dl>
                      <dt>Updated</dt>
                      <dd>
                        <TimeAgo timestamp={form.updatedAt} />
                        <br />
                        <small>
                          <I18n>by</I18n> {form.updatedBy}
                        </small>
                      </dd>
                    </dl>
                  </div>
                  <div className="section__title">
                    <span className="title">
                      <I18n>Submissions</I18n>
                    </span>
                    {filter}
                  </div>
                  <div className="section__content">
                    <TableComponents.FilterPills
                      filterFormKey={filterFormKey}
                      appliedFilters={appliedFilters}
                    />
                    <div className="scroll-wrapper-h">{table}</div>
                    {pagination}
                  </div>
                </div>
              </div>
              <ExportModal form={form} filter={filter} />
            </div>
          );
        }}
      </SubmissionTable>
    )
  );
};

const mapStateToProps = state => ({
  kapp: state.app.kapp,
  form: state.surveys.form,
  error: state.surveys.error,
  formActions: state.surveyApp.formActions,
  loading: state.surveys.creatingTest,
});

const mapDispatchToProps = {
  fetchFormRequest: actions.fetchFormRequest,
  callFormAction: actions.callFormAction,
  openModal: actions.openModal,
  createTestSubmission: actions.createTestSubmission,
};

const toggleDropdown = ({
  setOpenDropdown,
  openDropdown,
}) => dropdownSlug => () =>
  setOpenDropdown(dropdownSlug === openDropdown ? '' : dropdownSlug);

export const SurveySubmissions = compose(
  connect(
    mapStateToProps,
    mapDispatchToProps,
  ),
  withState('openDropdown', 'setOpenDropdown', ''),
  withState('filterOpen', 'setFilterOpen', false),
  withHandlers({
    toggleDropdown,
  }),
  lifecycle({
    componentDidMount() {
      this.props.fetchFormRequest({
        kappSlug: this.props.kapp.slug,
        formSlug: this.props.slug,
      });
      mountTable(tableKey);
    },
    componentDidUpdate(prevProps) {
      if (this.props.loading !== prevProps.loading) {
        refetchTable(tableKey);
      }
    },
    componentWillUnmount() {
      unmountTable(tableKey);
    },
  }),
)(SurveySubmissionsComponent);

import React from 'react';
import { Link } from '@reach/router';
import { compose, lifecycle, withHandlers, withState } from 'recompose';
import { connect } from '../../../redux/store';
import { actions } from '../../../redux/modules/surveys';
import {
  I18n,
  SubmissionTable,
  submitForm,
  isValueEmpty,
  mountTable,
  unmountTable,
} from '@kineticdata/react';
import {
  Dropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
} from 'reactstrap';
import { TableComponents, TimeAgo } from '@kineticdata/bundle-common';
import { ExportModal } from '../export/ExportModal';
import { PageTitle } from '../../shared/PageTitle';
import { Map } from 'immutable';

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
        <span className="fa fa-ellipsis-h fa-2x" />
      </DropdownToggle>
      <DropdownMenu right>
        <DropdownItem tag={Link} to={`${row.get('id')}/details`}>
          <I18n>View</I18n>
        </DropdownItem>
        {formActions.map(el => (
          <DropdownItem
            key={el.slug}
            onClick={() =>
              callFormAction({
                formSlug: el.slug,
                surveySubmissionId: row.get('id'),
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

const FilterPill = props => (
  <div className="btn-group">
    <button type="button" className="btn btn-xs btn-subtle">
      {props.name}
    </button>
    <button
      type="button"
      className="btn btn-xs btn-subtle"
      onClick={props.onRemove}
    >
      <span className="fa fa-fw fa-times" />
    </button>
  </div>
);

const VALUE_FILTER_MATCH = /values\[(.+)]/;

export const SurveySubmissionsComponent = ({
  kapp,
  form,
  formActions,
  callFormAction,
  openModal,
  openDropdown,
  toggleDropdown,
  filterModalOpen,
  setFilterModalOpen,
}) => {
  const FilterFormLayout = ({ buttons, fields }) => (
    <Dropdown
      direction="left"
      size="sm"
      isOpen={filterModalOpen}
      toggle={() => setFilterModalOpen(!filterModalOpen)}
    >
      <DropdownToggle color="primary">Filter</DropdownToggle>
      <DropdownMenu modifiers={{ preventOverflow: { enabled: true } }}>
        <div className="filter-menu">
          <form>
            <div className="row">
              <div className="col-6">{fields.get('startDate')}</div>
              <div className="col-6">{fields.get('endDate')}</div>
              <div className="col-12">{fields.get('coreState')}</div>
              <div className="col-12">{fields.get('submittedBy')}</div>
              <div className="col-12">{fields.get('values')}</div>
            </div>
            <span className="text-right">{buttons}</span>
          </form>
        </div>
      </DropdownMenu>
    </Dropdown>
  );

  const FilterFormButtons = ({ fields, formKey, ...props }) => {
    const resetFilterForm = () => () => {
      const values = fields.map(() => null);
      submitForm(formKey, { values });
    };
    return (
      <div className="form-buttons__right">
        <button className="btn btn-link" onClick={resetFilterForm()}>
          Reset
        </button>
        <button
          className="btn btn-success"
          type="submit"
          disabled={!props.dirty || props.submitting}
          onClick={props.submit}
        >
          {props.submitting ? (
            <span className="fa fa-circle-o-notch fa-spin fa-fw" />
          ) : (
            <span className="fa fa-check fa-fw" />
          )}
          Apply
        </button>
      </div>
    );
  };

  return (
    form && (
      <SubmissionTable
        tableKey={tableKey}
        kappSlug={kapp.slug}
        formSlug={form.slug}
        components={{
          EmptyBodyRow,
          FilterFormLayout,
          FilterFormButtons,
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
        ]}
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
              BodyCell: TableComponents.CoreStateBadgeCell,
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
        onSearch={() => () => setFilterModalOpen(false)}
      >
        {({ pagination, table, filter, appliedFilters, filterFormKey }) => {
          const handleClearFilter = filter => () => {
            const matches = filter.match(VALUE_FILTER_MATCH);

            if (matches) {
              // Handling clearing a value.
              const valueName = matches[1];

              submitForm(filterFormKey, {
                values: {
                  values: appliedFilters.get('values').delete(valueName),
                },
              });
            } else {
              submitForm(filterFormKey, { values: { [filter]: null } });
            }
          };

          const filterPills = appliedFilters
            .filter(
              (filter, filterName) =>
                !isValueEmpty(filter) && filterName !== 'values',
            )
            .merge(
              appliedFilters
                .get('values', Map())
                .mapEntries(([filterName, value]) => [
                  `values[${filterName}]`,
                  value,
                ]),
            )
            .keySeq()
            .map(filterName => (
              <FilterPill
                key={filterName}
                name={filterName}
                onRemove={handleClearFilter(filterName)}
              />
            ));

          return (
            <div className="page-container">
              <PageTitle parts={[form.name]} />
              <div className="page-panel page-panel--white">
                <div className="page-title">
                  <div
                    role="navigation"
                    aria-label="breadcrumbs"
                    className="page-title__breadcrumbs"
                  >
                    <span className="breadcrumb-item">
                      <Link to="../../">
                        <I18n>{kapp.name}</I18n>
                      </Link>{' '}
                      /
                    </span>
                    <h1>
                      <I18n>{form.name}</I18n>
                    </h1>
                  </div>
                  <div className="page-title__actions">
                    <button
                      onClick={() => openModal('export')}
                      value="export"
                      className="btn btn-secondary pull-left"
                    >
                      <span className="fa fa-fw fa-download" />
                      <I18n> Export Records</I18n>
                    </button>
                    <Link to="../settings" className="btn btn-primary">
                      <span className="fa fa-fw fa-cog" />
                      <I18n> Survey Settings</I18n>
                    </Link>
                  </div>
                </div>
                <div>
                  <div className="data-list data-list--fourths">
                    <div>
                      <dl>
                        <dt>Description</dt>
                        <dd>
                          {form.description || (
                            <em className="text-muted">None</em>
                          )}
                        </dd>
                      </dl>
                    </div>
                    <dl>
                      <dt>Status</dt>
                      <dd>
                        <TableComponents.StatusBadge status={form.status} />
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
                  <h3 className="section__title">
                    <I18n>Submissions</I18n>
                    {filter}
                  </h3>
                  <div className="section__content">
                    {filterPills.size > 0 && (
                      <div className="filter-pills">{filterPills}</div>
                    )}
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
});

const mapDispatchToProps = {
  fetchFormRequest: actions.fetchFormRequest,
  callFormAction: actions.callFormAction,
  openModal: actions.openModal,
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
  withState('filterModalOpen', 'setFilterModalOpen', false),
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
    componentWillUnmount() {
      unmountTable(tableKey);
    },
  }),
)(SurveySubmissionsComponent);

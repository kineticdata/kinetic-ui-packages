import React from 'react';
import { Link } from '@reach/router';
import { compose, withProps, withState, lifecycle } from 'recompose';
import { connect } from '../../../redux/store';
import {
  I18n,
  SubmissionTable,
  mountTable,
  unmountTable,
} from '@kineticdata/react';
import { TableComponents, TimeAgo } from '@kineticdata/bundle-common';
import { ExportModal } from './ExportModal';
import { PageTitle } from '../../shared/PageTitle';
import {
  actions,
  buildFormConfigurationObject,
} from '../../../redux/modules/settingsForms';

const tableKey = 'queue-settings-form-submissions';

const LinkCell = ({ row, value }) => (
  <td>
    <Link to={`submissions/${row.get('id')}`}>{value}</Link>
  </td>
);

const EmptyBodyRow = TableComponents.generateEmptyBodyRow({
  loadingMessage: 'Loading Submissions...',
  noSearchResultsMessage:
    'No submissions were found - please modify your search criteria',
  noItemsMessage: 'There are no submissions to display.',
});

export const FormSubmissionsComponent = ({
  kapp,
  form,
  columns,
  openModal,
  filterOpen,
  setFilterOpen,
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

  const visibleSortColumns = columns.filter(
    c => c.visible && ['createdAt', 'updatedAt'].includes(c.name),
  );

  const sortField =
    visibleSortColumns.size > 0
      ? visibleSortColumns.getIn([0, 'name'])
      : 'updatedAt';

  const visibleColumns = columns
    .filter(c => c.visible)
    .map((c, i) => ({
      value: c.type === 'value' ? `_${c.name}` : c.name,
      valueTransform:
        c.type === 'value'
          ? (_, row) => row.getIn(['values', c.name])
          : undefined,
      title: c.label,
      sortable: ['createdAt', 'updatedAt'].includes(c.name),
      components:
        i === 0
          ? { BodyCell: LinkCell }
          : ['createdAt', 'updatedAt'].includes(c.name)
            ? {
                BodyCell: TableComponents.TimeAgoCell,
              }
            : undefined,
    }))
    .push(
      visibleSortColumns.size === 0
        ? {
            value: 'updatedAt',
            sortable: true,
            components: { BodyCell: TableComponents.TimeAgoCell },
          }
        : undefined,
    )
    .filter(Boolean);

  return (
    form && (
      <SubmissionTable
        tableKey={tableKey}
        kappSlug={kapp.slug}
        formSlug={form.slug}
        include={['values']}
        components={{
          EmptyBodyRow,
          FilterFormLayout,
          FilterFormButtons: TableComponents.FilterFormButtons,
        }}
        columnSet={visibleColumns.map(c => c.value).toJS()}
        defaultSortColumn={sortField}
        addColumns={visibleColumns.filter(c => !!c.valueTransform).toJS()}
        alterColumns={visibleColumns.filter(c => !c.valueTransform).reduce(
          (alter, { value, valueTransform, ...properties }) => ({
            ...alter,
            [value]: properties,
          }),
          {},
        )}
        filterSet={[
          'startDate',
          'endDate',
          'submittedBy',
          'coreState',
          'values',
        ]}
        onSearch={() => () => setFilterOpen(false)}
      >
        {({ pagination, table, filter, appliedFilters, filterFormKey }) => {
          return (
            <div className="page-container">
              <PageTitle parts={[form.name, `Forms`]} />
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
                          <I18n>services</I18n>
                        </Link>
                      </span>{' '}
                      <span aria-hidden="true">/ </span>
                      <span className="breadcrumb-item">
                        <Link to="../../">
                          <I18n>settings</I18n>
                        </Link>
                      </span>{' '}
                      <span aria-hidden="true">/ </span>
                      <span className="breadcrumb-item">
                        <Link to="../">
                          <I18n>forms</I18n>
                        </Link>
                      </span>{' '}
                      <span aria-hidden="true">/ </span>
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
                    <Link to="settings" className="btn btn-primary">
                      <span className="fa fa-fw fa-cog" />
                      <I18n>Form Settings</I18n>
                    </Link>
                  </div>
                </div>
                <div>
                  <div className="data-list data-list--fourths">
                    <dl>
                      <dt>Type</dt>
                      <dd>
                        {form.type || <em className="text-muted">None</em>}
                      </dd>
                    </dl>
                    <dl>
                      <dt>Status</dt>
                      <dd>
                        {form.status || <em className="text-muted">None</em>}
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
                    {form.description && (
                      <div>
                        <dl>
                          <dt>Description</dt>
                          <dd>{form.description}</dd>
                        </dl>
                      </div>
                    )}
                  </div>
                  <h3 className="section__title pr-0 mb-2">
                    <I18n>Submissions</I18n>
                    {filter}
                  </h3>
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
});

const mapDispatchToProps = {
  openModal: actions.openModal,
};

export const FormSubmissions = compose(
  connect(
    mapStateToProps,
    mapDispatchToProps,
  ),
  withState('filterOpen', 'setFilterOpen', false),
  withProps(props => ({
    columns: buildFormConfigurationObject(props.form).columns,
  })),
  lifecycle({
    componentDidMount() {
      mountTable(tableKey);
    },
    componentWillUnmount() {
      unmountTable(tableKey);
    },
  }),
)(FormSubmissionsComponent);

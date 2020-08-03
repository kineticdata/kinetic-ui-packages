import React, { Fragment } from 'react';
import { compose, lifecycle, withHandlers, withState } from 'recompose';
import { connect } from '../../redux/store';
import { Link } from '@reach/router';
import { UncontrolledDropdown, DropdownToggle, DropdownMenu } from 'reactstrap';
import { I18n, FormTable, FormForm, refetchTable } from '@kineticdata/react';
import { PageTitle } from '../shared/PageTitle';
import { Modal, ModalBody, ModalFooter } from 'reactstrap';
import {
  TableComponents,
  FormComponents,
  addToast,
} from '@kineticdata/bundle-common';
import { actions } from '../../redux/modules/settingsDatastore';

const FormLayout = ({ fields, error, buttons }) => (
  <Fragment>
    <ModalBody className="form">
      <div className="form-group__columns">
        {fields.get('name')}
        {fields.get('slug')}
      </div>
      {fields.get('description')}
      {fields.get('status')}
      {error}
    </ModalBody>
    <ModalFooter className="modal-footer--full-width">{buttons}</ModalFooter>
  </Fragment>
);

const FormButtons = props => (
  <button
    className="btn btn-success"
    type="submit"
    disabled={!props.dirty || props.submitting}
    onClick={props.submit}
  >
    {props.submitting && (
      <span className="fa fa-circle-o-notch fa-spin fa-fw" />
    )}{' '}
    <I18n>Create Datastore</I18n>
  </button>
);

const ActionsCell = () => ({ row }) => (
  <td className="text-right" style={{ width: '1%' }}>
    <UncontrolledDropdown className="more-actions">
      <DropdownToggle tag="button" className="btn btn-sm btn-link">
        <span className="sr-only">More Actions</span>
        <span className="fa fa-chevron-down fa-fw" />
      </DropdownToggle>
      <DropdownMenu right>
        <Link to={row.get('slug')} className="dropdown-item">
          <I18n>View</I18n>
        </Link>
        <Link to={`${row.get('slug')}/new`} className="dropdown-item">
          <I18n>New Record</I18n>
        </Link>
        <Link to={`${row.get('slug')}/settings`} className="dropdown-item">
          <I18n>Configure</I18n>
        </Link>
      </DropdownMenu>
    </UncontrolledDropdown>
  </td>
);

const FormNameCell = ({ row, value }) => (
  <td>
    <Link to={row.get('slug')}>{value}</Link>
    <br />
    <small>{row.get('slug')}</small>
  </td>
);

const EmptyBodyRow = TableComponents.generateEmptyBodyRow({
  loadingMessage: 'Loading Datastore Forms...',
  noSearchResultsMessage:
    'No datastore forms were found - please modify your search criteria',
  noItemsMessage: 'There are no datastore forms to display.',
});

export const FormListComponent = ({
  tableKey,
  modalOpen,
  toggleModal,
  filterOpen,
  setFilterOpen,
  navigate,
}) => {
  const FilterFormLayout = TableComponents.generateFilterFormLayout({
    isOpen: filterOpen,
    toggle: () => setFilterOpen(open => !open),
  });

  return (
    <FormTable
      datastore
      tableKey={tableKey}
      components={{
        EmptyBodyRow,
        FilterFormLayout,
        FilterFormButtons: TableComponents.FilterFormButtons,
        TableLayout: TableComponents.SettingsTableLayout,
      }}
      columnSet={['name', 'status', 'updatedAt', 'actions']}
      addColumns={[
        {
          value: 'actions',
          title: ' ',
          sortable: false,
          components: { BodyCell: ActionsCell() },
          className: 'text-right',
        },
      ]}
      alterColumns={{
        updatedAt: { components: { BodyCell: TableComponents.TimeAgoCell } },
        name: { components: { BodyCell: FormNameCell } },
        status: {
          components: {
            BodyCell: TableComponents.StatusBadgeCell,
            Filter: TableComponents.SelectFilter,
          },
        },
      }}
      filterSet={['name', 'status']}
      onSearch={() => () => setFilterOpen(false)}
    >
      {({ pagination, table, filter, appliedFilters, filterFormKey }) => (
        <div className="page-container">
          <PageTitle parts={['Datastore Forms']} />
          <div className="page-panel page-panel--white">
            <div className="page-title">
              <div
                role="navigation"
                aria-label="breadcrumbs"
                className="page-title__breadcrumbs"
              >
                <span className="breadcrumb-item">
                  <Link to="../">
                    <I18n>settings</I18n>
                  </Link>
                </span>{' '}
                <span aria-hidden="true">/ </span>
                <h1>
                  <I18n>Datastore Forms</I18n>
                </h1>
              </div>
              <div className="page-title__actions">
                <I18n
                  render={translate => (
                    <button
                      type="button"
                      className="btn btn-secondary"
                      title={translate('New Datastore')}
                      onClick={() => toggleModal(true)}
                    >
                      <span className="fa fa-plus fa-fw" />{' '}
                      {translate('New Datastore')}
                    </button>
                  )}
                />
              </div>
            </div>
            <div>
              <div className="text-right mb-2">{filter}</div>
              <TableComponents.FilterPills
                filterFormKey={filterFormKey}
                appliedFilters={appliedFilters}
              />
              <div className="scroll-wrapper-h">{table}</div>
              {pagination}
            </div>
          </div>

          {/* Modal for creating a new team */}
          <Modal isOpen={!!modalOpen} toggle={() => toggleModal()} size="lg">
            <div className="modal-header">
              <h4 className="modal-title">
                <button
                  type="button"
                  className="btn btn-link btn-delete"
                  onClick={() => toggleModal()}
                >
                  <I18n>Close</I18n>
                </button>
                <span>
                  <I18n>New Datastore</I18n>
                </span>
              </h4>
            </div>
            <FormForm
              datastore={true}
              fieldSet={['name', 'slug', 'description', 'status']}
              onSave={() => form => {
                addToast(`${form.name} created successfully.`);
                refetchTable(tableKey);
                navigate(`${form.slug}/settings`);
              }}
              components={{
                FormLayout,
                FormButtons,
                FormError: FormComponents.FormError,
              }}
              alterFields={{
                description: { component: FormComponents.TextAreaField },
              }}
            >
              {({ form, initialized }) => {
                return initialized && form;
              }}
            </FormForm>
          </Modal>
        </div>
      )}
    </FormTable>
  );
};

// Datastore Container
export const FormList = compose(
  connect(
    null,
    { resetSearch: actions.resetSearchParams },
  ),
  withState('modalOpen', 'setModalOpen', false),
  withState('filterOpen', 'setFilterOpen', false),
  withHandlers({
    toggleModal: props => slug =>
      !slug || slug === props.modalOpen
        ? props.setModalOpen(false)
        : props.setModalOpen(slug),
  }),
  lifecycle({
    componentDidMount() {
      this.props.resetSearch();
    },
  }),
)(FormListComponent);

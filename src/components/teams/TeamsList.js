import React, { Fragment } from 'react';
import { compose, withHandlers, withState } from 'recompose';
import { Link } from '@reach/router';
import { TeamTable, TeamForm, I18n, refetchTable } from '@kineticdata/react';
import { PageTitle } from '../shared/PageTitle';
import { Modal, ModalBody, ModalFooter } from 'reactstrap';
import {
  FormComponents,
  TableComponents,
  addToast,
} from '@kineticdata/bundle-common';

const FormLayout = ({ fields, error, buttons }) => (
  <Fragment>
    <ModalBody className="form">
      {fields.get('parentTeam')}
      {fields.get('localName')}
      {fields.get('description')}
      {error}
    </ModalBody>
    <ModalFooter>{buttons}</ModalFooter>
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
    <I18n>Create Team</I18n>
  </button>
);

const NameCell = ({ value, row }) => (
  <td>
    <Link to={row.get('slug')} title="Edit Team">
      {value}
    </Link>
  </td>
);

const EmptyBodyRow = TableComponents.generateEmptyBodyRow({
  loadingMessage: 'Loading Teams...',
  noSearchResultsMessage:
    'No teams were found - please modify your search criteria',
  noItemsMessage: 'There are no teams to display.',
});

export const TeamsListComponent = ({
  tableKey,
  tableType,
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
    <TeamTable
      tableKey={tableKey}
      components={{
        EmptyBodyRow,
        FilterFormLayout,
        FilterFormButtons: TableComponents.FilterFormButtons,
        TableLayout: TableComponents.SettingsTableLayout,
      }}
      alterColumns={{
        name: { components: { BodyCell: NameCell } },
        description: { sortable: false },
      }}
      columnSet={['name', 'description']}
      filterSet={['name']}
      onSearch={() => () => setFilterOpen(false)}
    >
      {({ pagination, table, filter, appliedFilters, filterFormKey }) => (
        <div className="page-container">
          <PageTitle parts={['Teams']} />
          <div className="page-panel page-panel--white">
            <div className="page-title">
              <div
                role="navigation"
                aria-label="breadcrumbs"
                className="page-title__breadcrumbs"
              >
                <span className="breadcrumb-item">
                  <Link to="..">
                    <I18n>settings</I18n>
                  </Link>
                </span>{' '}
                <span aria-hidden="true">/ </span>
                <h1>
                  <I18n>Teams</I18n>
                </h1>
              </div>
              <div className="page-title__actions">
                <I18n
                  render={translate => (
                    <button
                      type="button"
                      className="btn btn-secondary"
                      title={translate('New Team')}
                      onClick={() => toggleModal(true)}
                    >
                      <span className="fa fa-plus fa-fw" />{' '}
                      {translate('New Team')}
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
                  <I18n>New Team</I18n>
                </span>
              </h4>
            </div>
            <TeamForm
              formkey="team-new"
              onSave={() => team => {
                addToast(`${team.name} created successfully.`);
                refetchTable(tableKey);
                navigate(`${team.slug}`);
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
            </TeamForm>
          </Modal>
        </div>
      )}
    </TeamTable>
  );
};

// Teams Container
export const TeamsList = compose(
  withState('modalOpen', 'setModalOpen', false),
  withState('filterOpen', 'setFilterOpen', false),
  withHandlers({
    toggleModal: props => slug =>
      !slug || slug === props.modalOpen
        ? props.setModalOpen(false)
        : props.setModalOpen(slug),
  }),
)(TeamsListComponent);

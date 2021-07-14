import React, { Fragment } from 'react';
import { Link } from '@reach/router';
import { connect } from '../../redux/store';
import { actions } from '../../redux/modules/surveys';
import { actions as appActions } from '../../redux/modules/surveyApp';
import { compose, withState, withHandlers, lifecycle } from 'recompose';
import { PageTitle } from '../shared/PageTitle';
import {
  UncontrolledDropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
  Modal,
  ModalBody,
  ModalFooter,
} from 'reactstrap';
import {
  I18n,
  FormTable,
  FormForm,
  fetchForm,
  mountTable,
  unmountTable,
} from '@kineticdata/react';
import {
  FormComponents,
  TableComponents,
  ErrorMessage,
  LoadingMessage,
  addToast,
  openConfirm,
} from '@kineticdata/bundle-common';

const tableKey = 'survey-list';

const ActionsCell = ({ deleteForm, toggleModal }) => ({ row, tableKey }) => (
  <td className="text-right" style={{ width: '1%' }}>
    <UncontrolledDropdown className="more-actions">
      <DropdownToggle tag="button" className="btn btn-sm btn-link">
        <span className="sr-only">More Actions</span>
        <span className="fa fa-chevron-down fa-fw" />
      </DropdownToggle>
      <DropdownMenu right positionFixed>
        <Link to={`${row.get('slug')}/submissions`} className="dropdown-item">
          View
        </Link>
        <Link to={`${row.get('slug')}/settings`} className="dropdown-item">
          Settings
        </Link>
        <DropdownItem onClick={() => toggleModal(row.get('slug'))}>
          Clone
        </DropdownItem>
        <DropdownItem onClick={() => deleteForm(row.get('slug'))}>
          Delete
        </DropdownItem>
      </DropdownMenu>
    </UncontrolledDropdown>
  </td>
);

const FormNameCell = ({ row, value }) => (
  <td>
    <Link to={`${row.get('slug')}/submissions`}>{value}</Link>
    <br />
    <small>{row.get('slug')}</small>
  </td>
);

const FormLayout = ({ fields, error, buttons, bindings: { cloneForm } }) => (
  <Fragment>
    <ModalBody className="form">
      {cloneForm && (
        <div className="alert alert-info text-center">
          <div className="alert-heading">
            <I18n>Cloning Survey</I18n>{' '}
            <strong>
              <I18n>{cloneForm.get('name')}</I18n>
            </strong>
          </div>
          <hr className="my-2" />
          <small>
            <I18n
              render={translate =>
                translate(
                  'The attributes, categories, security policies, and all survey content will be copied from the %s survey into this new survey.',
                ).replace('%s', translate(cloneForm.get('name')))
              }
            />
          </small>
        </div>
      )}
      <div className="form-group__columns">
        {fields.get('name')}
        {fields.get('slug')}
      </div>
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
    <I18n>Create Survey</I18n>
  </button>
);

const LoadingFormLayout = () => (
  <Fragment>
    <ModalBody className="form">
      <LoadingMessage />
    </ModalBody>
    <ModalFooter>
      <button className="btn btn-success" type="button" disabled={true}>
        <I18n>Create Survey</I18n>
      </button>
    </ModalFooter>
  </Fragment>
);

const CloneErrorFormLayout = () => (
  <Fragment>
    <ModalBody className="form">
      <ErrorMessage message="Failed to load survey to clone." />
    </ModalBody>
    <ModalFooter>
      <button className="btn btn-success" type="button" disabled={true}>
        <I18n>Create Survey</I18n>
      </button>
    </ModalFooter>
  </Fragment>
);

const EmptyBodyRow = TableComponents.generateEmptyBodyRow({
  loadingMessage: 'Loading Surveys...',
  noSearchResultsMessage:
    'No surveys were found - please modify your search criteria',
  noItemsMessage: 'There are no surveys to display.',
});

const SurveyAdminListComponent = ({
  kapp,
  loading,
  filterOpen,
  setFilterOpen,
  modalOpen,
  toggleModal,
  deleteForm,
  cloneFormRequest,
  fetchAppDataRequest,
  navigate,
}) => {
  const FilterFormLayout = TableComponents.generateFilterFormLayout({
    isOpen: filterOpen,
    toggle: () => setFilterOpen(open => !open),
  });

  return (
    !loading && (
      <FormTable
        tableKey={tableKey}
        kappSlug="survey"
        surveyList
        components={{
          EmptyBodyRow,
          FilterFormLayout,
          FilterFormButtons: TableComponents.FilterFormButtons,
        }}
        addColumns={[
          {
            value: 'actions',
            title: ' ',
            sortable: false,
            components: {
              BodyCell: ActionsCell({
                deleteForm,
                toggleModal,
              }),
            },
            className: 'text-right',
          },
        ]}
        alterColumns={{
          name: {
            components: {
              BodyCell: FormNameCell,
            },
          },
          createdAt: {
            components: {
              BodyCell: TableComponents.TimeAgoCell,
            },
          },
          updatedAt: {
            components: {
              BodyCell: TableComponents.TimeAgoCell,
            },
          },
          status: {
            components: {
              BodyCell: TableComponents.StatusBadgeCell,
            },
          },
        }}
        columnSet={[
          'name',
          'type',
          'createdAt',
          'updatedAt',
          'status',
          'actions',
        ]}
        filterSet={['name', 'status']}
        alterFilters={{
          status: {
            options: ['Active', 'Inactive'].map(s => ({
              value: s,
              label: s,
            })),
          },
        }}
        onSearch={() => () => setFilterOpen(false)}
      >
        {({ pagination, table, filter, appliedFilters, filterFormKey }) => {
          return (
            <div className="page-container">
              <PageTitle parts={['Survey Admin']} />
              <div className="page-panel page-panel--white">
                <div className="page-title">
                  <div
                    role="navigation"
                    aria-label="breadcrumbs"
                    className="page-title__breadcrumbs"
                  >
                    <span className="breadcrumb-item">
                      <Link to="../">
                        <I18n>survey</I18n>
                      </Link>
                    </span>{' '}
                    /
                    <h1>
                      <I18n>Survey Admin</I18n>
                    </h1>
                  </div>
                  <div className="page-title__actions">
                    <Link to="new">
                      <I18n
                        render={translate => (
                          <button
                            type="button"
                            className="btn btn-secondary"
                            title={translate('New Survey')}
                          >
                            <span className="fa fa-plus fa-fw" />{' '}
                            {translate('New Survey')}
                          </button>
                        )}
                      />
                    </Link>
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

              {/* Modal for creating a new form */}
              <Modal
                isOpen={!!modalOpen}
                toggle={() => toggleModal()}
                size="lg"
              >
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
                      <I18n>New Form</I18n>
                    </span>
                  </h4>
                </div>
                <FormForm
                  kappSlug={kapp.slug}
                  fieldSet={['name', 'slug', 'description']}
                  onSave={() => form => {
                    if (typeof modalOpen === 'string') {
                      cloneFormRequest({
                        kappSlug: kapp.slug,
                        formSlug: form.slug,
                        cloneFormSlug: modalOpen,
                        callback: () => {
                          fetchAppDataRequest();
                          navigate(`${form.slug}/settings`);
                        },
                      });
                    } else {
                      addToast(`${form.name} created successfully.`);
                      navigate(`${form.slug}/settings`);
                    }
                  }}
                  components={{ FormLayout, FormButtons }}
                  alterFields={{
                    description: {
                      component: FormComponents.TextAreaField,
                    },
                  }}
                  addDataSources={
                    typeof modalOpen === 'string'
                      ? {
                          cloneForm: {
                            fn: fetchForm,
                            params: [
                              { kappSlug: kapp.slug, formSlug: modalOpen },
                            ],
                            // Set to the form, or the result in case of an error
                            transform: result => result.form || result,
                          },
                        }
                      : undefined
                  }
                >
                  {({ form, initialized, bindings: { cloneForm } }) => {
                    const isClone = typeof modalOpen === 'string';
                    const cloneError = cloneForm && cloneForm.get('error');
                    return initialized && (!isClone || cloneForm) ? (
                      cloneError ? (
                        <CloneErrorFormLayout />
                      ) : (
                        form
                      )
                    ) : (
                      <LoadingFormLayout />
                    );
                  }}
                </FormForm>
              </Modal>
            </div>
          );
        }}
      </FormTable>
    )
  );
};

export const mapStateToProps = state => ({
  loading: state.surveyApp.loading,
  kapp: state.app.kapp,
});

const mapDispatchToProps = {
  deleteFormRequest: actions.deleteFormRequest,
  cloneFormRequest: actions.cloneFormRequest,
  fetchAppDataRequest: appActions.fetchAppDataRequest,
};

export const SurveyAdminList = compose(
  connect(
    mapStateToProps,
    mapDispatchToProps,
  ),
  withState('modalOpen', 'setModalOpen', false),
  withState('filterOpen', 'setFilterOpen', false),
  withHandlers({
    toggleModal: props => slug =>
      !slug || slug === props.modalOpen
        ? props.setModalOpen(false)
        : props.setModalOpen(slug),
    deleteForm: props => formSlug =>
      openConfirm({
        title: 'Delete Form',
        body: 'Are you sure you want to delete this form?',
        confirmationText: formSlug,
        confirmationTextLabel: 'form slug',
        actionName: 'Delete',
        ok: () =>
          props.deleteFormRequest({
            kappSlug: props.kapp.slug,
            formSlug,
          }),
      }),
  }),
  lifecycle({
    componentDidMount() {
      mountTable(tableKey);
    },
    componentWillUnmount() {
      unmountTable(tableKey);
    },
  }),
)(SurveyAdminListComponent);

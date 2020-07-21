import React, { Fragment } from 'react';
import { compose, withHandlers, withState } from 'recompose';
import { connect } from '../../redux/store';
import { actions } from '../../redux/modules/settingsUsers';
import { Link } from '@reach/router';
import { UserTable, UserForm, fetchUser, I18n } from '@kineticdata/react';
import {
  UncontrolledDropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
  Modal,
  ModalBody,
  ModalFooter,
} from 'reactstrap';
import { PageTitle } from '../shared/PageTitle';
import {
  ErrorMessage,
  LoadingMessage,
  addToast,
  addToastAlert,
  FormComponents,
  TableComponents,
} from '@kineticdata/bundle-common';
import { ExportModal } from './ExportModal';
import { ImportModal } from './ImportModal';
import papaparse from 'papaparse';
import { fromJS } from 'immutable';

const IsJsonString = str => {
  try {
    JSON.parse(str);
  } catch (e) {
    return false;
  }
  return true;
};

const handleImport = props => e => {
  const file = e.target.files[0];
  e.target.value = null;
  const extention =
    file && file.name && file.name.split('.')[file.name.split('.').length - 1];
  if (file && extention === 'csv') {
    const reader = new FileReader();
    reader.readAsText(file);
    reader.onload = event => {
      papaparse.parse(event.target.result, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: results => {
          // When streaming, parse results are not available in this callback.
          if (results.errors.length <= 0) {
            props.importUsersRequest(
              fromJS(results.data)
                .map(user => {
                  return user
                    .update('allowedIps', val => (val ? val : ''))
                    .update(
                      'attributesMap',
                      val => (IsJsonString(val) ? fromJS(JSON.parse(val)) : {}),
                    )
                    .update(
                      'profileAttributesMap',
                      val => (IsJsonString(val) ? fromJS(JSON.parse(val)) : {}),
                    )
                    .update(
                      'memberships',
                      val => (IsJsonString(val) ? fromJS(JSON.parse(val)) : {}),
                    );
                })
                .toSet()
                .toJS(),
            );
          } else {
            addToastAlert({
              title: 'Import File Error',
              message:
                (results.errors &&
                  results.errors[0] &&
                  results.errors[0].message) ||
                'Invalid file provided',
            });
          }
        },
      });
    };
  }
};

const FormLayout = ({ fields, error, buttons, bindings: { cloneUser } }) => (
  <Fragment>
    <ModalBody className="form">
      {cloneUser && (
        <div className="alert alert-info text-center">
          <div className="alert-heading">
            <I18n>Cloning User</I18n>{' '}
            <strong>
              <I18n>{cloneUser.get('username')}</I18n>
            </strong>
          </div>
          <hr className="my-2" />
          <small>
            <I18n
              render={translate =>
                translate(
                  'Attributes and team memberships will be copied from %s to this new user.',
                ).replace('%s', translate(cloneUser.get('username')))
              }
            />
          </small>
        </div>
      )}
      <div className="form-group__columns">
        {fields.get('username')}
        {fields.get('displayName')}
        {fields.get('password')}
        {fields.get('passwordConfirmation')}
      </div>
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
    <I18n>Create User</I18n>
  </button>
);

const LoadingFormLayout = () => (
  <Fragment>
    <ModalBody className="form">
      <LoadingMessage />
    </ModalBody>
    <ModalFooter className="modal-footer--full-width">
      <button className="btn btn-success" type="button" disabled={true}>
        <I18n>Create User</I18n>
      </button>
    </ModalFooter>
  </Fragment>
);

const CloneErrorFormLayout = () => (
  <Fragment>
    <ModalBody className="form">
      <ErrorMessage message="Failed to load user to clone." />
    </ModalBody>
    <ModalFooter className="modal-footer--full-width">
      <button className="btn btn-success" type="button" disabled={true}>
        <I18n>Create User</I18n>
      </button>
    </ModalFooter>
  </Fragment>
);

const NameCell = ({ value, row }) => (
  <td>
    <Link to={encodeURIComponent(row.get('username'))} title="Edit User">
      {value}
    </Link>
  </td>
);

const ActionsCell = ({ toggleModal }) => ({ row }) => (
  <td className="text-right" style={{ width: '1%' }}>
    <UncontrolledDropdown className="more-actions">
      <DropdownToggle tag="button" className="btn btn-sm btn-link">
        <span className="sr-only">More Actions</span>
        <span className="fa fa-chevron-down fa-fw" />
      </DropdownToggle>
      <DropdownMenu right>
        <Link
          to={`/profile/${encodeURIComponent(row.get('username'))}`}
          className="dropdown-item"
        >
          <I18n>View</I18n>
        </Link>
        <Link
          to={encodeURIComponent(row.get('username'))}
          className="dropdown-item"
        >
          <I18n>Edit</I18n>
        </Link>
        <DropdownItem onClick={() => toggleModal(row.get('username'))}>
          Clone
        </DropdownItem>
      </DropdownMenu>
    </UncontrolledDropdown>
  </td>
);

const EmptyBodyRow = TableComponents.generateEmptyBodyRow({
  loadingMessage: 'Loading Users...',
  noSearchResultsMessage:
    'No Users were found - please modify your search criteria',
  noItemsMessage: 'There are no Users to display.',
  noItemsLinkTo: '/settings/users/new',
  noItemsLinkToMessage: 'Add new User',
});

const FilterLayout = TableComponents.generateFilterModalLayout([
  'username',
  'displayName',
]);

export const UsersListComponent = ({
  tableKey,
  modalOpen,
  toggleModal,
  cloneUserRequest,
  createUserRequest,
  navigate,
  openExportModal,
  handleImport,
  remountKey,
  setRemountKey,
}) => (
  <UserTable
    key={remountKey}
    tableKey={tableKey}
    components={{
      FilterLayout,
      EmptyBodyRow,
      TableLayout: TableComponents.SettingsTableLayout,
    }}
    alterColumns={{
      username: { title: 'Email', components: { BodyCell: NameCell } },
    }}
    addColumns={[
      {
        value: 'actions',
        title: ' ',
        sortable: false,
        components: {
          BodyCell: ActionsCell({ toggleModal }),
        },
      },
    ]}
    columnSet={['username', 'displayName', 'actions']}
  >
    {({ pagination, table, filter }) => (
      <div className="page-container page-container--panels">
        <PageTitle parts={['Users']} />
        <div className="page-panel page-panel--two-thirds page-panel--white">
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
              <h1 aria-current="page">
                <I18n>Users</I18n>
              </h1>
            </div>
            <div className="page-title__actions">
              <div className="file-up" data-file-input>
                <label htmlFor="file_upload" className="file-up__label">
                  <span className="file-up__label__text btn btn-info">
                    <I18n>Import Users</I18n>
                  </span>
                  <input
                    type="file"
                    accept=".csv"
                    autocomplete="off"
                    id="file_upload"
                    onChange={handleImport}
                  />
                </label>
              </div>

              <button
                className="btn btn-info"
                onClick={() => openExportModal('export')}
              >
                <I18n>Export Users</I18n>
              </button>
              <I18n
                render={translate => (
                  <button
                    type="button"
                    className="btn btn-secondary"
                    title={translate('New User')}
                    onClick={() => toggleModal(true)}
                  >
                    <span className="fa fa-plus fa-fw" />{' '}
                    {translate('New User')}
                  </button>
                )}
              />
            </div>
          </div>
          <div>
            <div className="mb-2 text-right">{filter}</div>
            {table}
            {pagination}
          </div>
        </div>
        <div className="page-panel page-panel--one-thirds page-panel--sidebar">
          <h3>
            <I18n>Users</I18n>
          </h3>
          <p>
            <I18n>
              Users are the platform representation of individuals. They can
              have attributes and profile attributes, which can be defined per
              space, and they can also be members of teams.
            </I18n>
          </p>
        </div>
        <ExportModal />
        <ImportModal
          onClose={() => setRemountKey(`remount-key-${new Date().getTime()}`)}
        />

        {/* Modal for creating a new user */}
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
                <I18n>New User</I18n>
              </span>
            </h4>
          </div>
          <UserForm
            formkey={`user-${typeof modalOpen === 'string' ? 'clone' : 'new'}`}
            onSave={() => ({ user }) => {
              if (typeof modalOpen === 'string') {
                cloneUserRequest({
                  cloneUserUsername: modalOpen,
                  user: user,
                  callback: () => navigate(`${user.username}`),
                });
              } else {
                addToast(`${user.username} created successfully.`);
                user && navigate(`${user.username}`);
              }
            }}
            components={{
              FormLayout,
              FormButtons,
              FormError: FormComponents.FormError,
            }}
            alterFields={{ username: { label: 'Email' } }}
            addDataSources={
              typeof modalOpen === 'string'
                ? {
                    cloneUser: {
                      fn: fetchUser,
                      params: [{ username: modalOpen }],
                      transform: result => result.user || result,
                    },
                  }
                : undefined // Set to the user, or the result in case of an error
            }
          >
            {({ form, initialized, bindings: { cloneUser } }) => {
              const isClone = typeof modalOpen === 'string';
              const cloneError = cloneUser && cloneUser.get('error');
              return initialized && (!isClone || cloneUser) ? (
                cloneError ? (
                  <CloneErrorFormLayout />
                ) : (
                  form
                )
              ) : (
                <LoadingFormLayout />
              );
            }}
          </UserForm>
        </Modal>
      </div>
    )}
  </UserTable>
);

const mapStateToProps = state => ({
  kapp: state.app.kapp,
});

const mapDispatchToProps = {
  cloneUserRequest: actions.cloneUserRequest,
  openExportModal: actions.openModal,
  importUsersRequest: actions.importUsersRequest,
};

// Users Container
export const UsersList = compose(
  connect(
    mapStateToProps,
    mapDispatchToProps,
  ),
  withState(
    'remountKey',
    'setRemountKey',
    `remount-key-${new Date().getTime()}`,
  ),
  withState('modalOpen', 'setModalOpen', false),
  withHandlers({
    toggleModal: props => slug =>
      !slug || slug === props.modalOpen
        ? props.setModalOpen(false)
        : props.setModalOpen(slug),
    handleImport,
  }),
)(UsersListComponent);

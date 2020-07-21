import React from 'react';
import { Link } from '@reach/router';
import {
  compose,
  withState,
  withHandlers,
  withProps,
  lifecycle,
} from 'recompose';
import { connect } from '../../redux/store';
import {
  I18n,
  DatastoreSubmissionTable,
  mountTable,
  unmountTable,
  refetchTable,
} from '@kineticdata/react';
import { Modal, ModalBody } from 'reactstrap';
import {
  Dropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
} from 'reactstrap';
import { TableComponents } from '@kineticdata/bundle-common';
import { PageTitle } from '../shared/PageTitle';
import { isActiveClass } from '../../utils';
import {
  actions,
  NOTIFICATIONS_FORM_SLUG,
  NOTIFICATIONS_DATE_FORMAT_FORM_SLUG,
} from '../../redux/modules/settingsNotifications';

const tableKey = type => `notifications-list-${type}`;

const NameCell = ({ row }) => (
  <td>
    <Link to={row.get('id')}>{row.getIn(['values', 'Name'])}</Link>
  </td>
);

const StatusCell = ({ row }) => (
  <td>
    <TableComponents.CoreStateBadge coreState={row.getIn(['values', 'Status'])}>
      {row.getIn(['values', 'Status'])}
    </TableComponents.CoreStateBadge>
  </td>
);

const SubjectCell = ({ row }) => <td>{row.getIn(['values', 'Subject'])}</td>;

const FormatCell = ({ row }) => <td>{row.getIn(['values', 'Format'])}</td>;

export const NotificationsListComponent = ({
  type,
  openDropdown,
  toggleDropdown,
  handleClone,
  handleDelete,
  handlePreview,
  previewModal,
  setPreviewModal,
}) => {
  const EmptyBodyRow = TableComponents.generateEmptyBodyRow({
    loadingMessage: `Loading templates...`,
    noSearchResultsMessage: `No templates were found - please modify your search criteria`,
    noItemsMessage: `There are no templates to display.`,
  });

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
          {type !== 'Date Format' && (
            <DropdownItem onClick={handlePreview(row.toJS())}>
              <I18n>Preview</I18n>
            </DropdownItem>
          )}
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
      key={tableKey(type)}
      tableKey={tableKey(type)}
      notificationType={type}
      formSlug={
        type === 'Date Format'
          ? NOTIFICATIONS_DATE_FORMAT_FORM_SLUG
          : NOTIFICATIONS_FORM_SLUG
      }
      components={{
        EmptyBodyRow,
      }}
      columnSet={
        type === 'Date Format'
          ? ['templateName', 'status', 'format', 'actions']
          : ['templateName', 'status', 'subject', 'actions']
      }
      defaultSortColumn={'templateName'}
      addColumns={[
        {
          value: 'templateName',
          title: 'Template Name',
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
          value: 'subject',
          title: 'Subject',
          sortable: false,
          components: {
            BodyCell: SubjectCell,
          },
        },
        {
          value: 'format',
          title: 'Format',
          sortable: false,
          components: {
            BodyCell: FormatCell,
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
          <PageTitle parts={[`${type}s`, 'Notifications', 'Settings']} />
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
                  <I18n>Notifications</I18n>
                </h1>
              </div>
              <div className="page-title__actions">
                <Link to="new" className="btn btn-primary">
                  <I18n>New {type}</I18n>
                </Link>
              </div>
            </div>
            <div className="notifications-tabs">
              <ul className="nav nav-tabs">
                <li role="presentation">
                  <Link
                    to="/settings/notifications/templates"
                    getProps={isActiveClass()}
                  >
                    <I18n>Templates</I18n>
                  </Link>
                </li>
                <li role="presentation">
                  <Link
                    to="/settings/notifications/snippets"
                    getProps={isActiveClass()}
                  >
                    <I18n>Snippets</I18n>
                  </Link>
                </li>
                <li role="presentation">
                  <Link
                    to="/settings/notifications/date-formats"
                    getProps={isActiveClass()}
                  >
                    <I18n>Date Formats</I18n>
                  </Link>
                </li>
              </ul>
            </div>
            <div className="scroll-wrapper-h">{table}</div>
            {pagination}
            {previewModal && (
              <Modal
                isOpen={!!previewModal}
                toggle={() => setPreviewModal(null)}
              >
                <div className="modal-header">
                  <h4 className="modal-title">
                    <button
                      onClick={() => setPreviewModal(null)}
                      type="button"
                      className="btn btn-link"
                    >
                      <I18n>Close</I18n>
                    </button>
                    <span>
                      <I18n>Template Preview</I18n>
                    </span>
                  </h4>
                </div>
                <ModalBody>
                  <div
                    dangerouslySetInnerHTML={{
                      __html: previewModal.values['HTML Content'],
                    }}
                  />
                </ModalBody>
              </Modal>
            )}
          </div>
        </div>
      )}
    </DatastoreSubmissionTable>
  );
};

const handleClone = ({ cloneNotification }) => id => () =>
  cloneNotification(id);

const handleDelete = props => id => () =>
  props.deleteNotification({
    id: id,
    callback: () => refetchTable(tableKey(props.type)),
  });

const handlePreview = props => notification => () => {
  let values = notification.values;

  values['HTML Content'] = values['HTML Content'].replace(
    /\$\{snippet\(\'.*?\'\)\}/gi,
    snippet => {
      const label = snippet.match(/\$\{snippet\(\'(.*?)\'\)\}/);
      return props.snippets[label[1]].values['HTML Content'];
    },
  );

  props.setPreviewModal({ ...notification, values });
};

const toggleDropdown = ({
  setOpenDropdown,
  openDropdown,
}) => dropdownSlug => () =>
  setOpenDropdown(dropdownSlug === openDropdown ? '' : dropdownSlug);

const mapStateToProps = state => ({
  // notifications: state.settingsNotifications.notifications,
});

const mapDispatchToProps = {
  openModal: actions.openModal,
  // fetchNotifications: actions.fetchNotifications,
  deleteNotification: actions.deleteNotification,
  cloneNotification: actions.cloneNotification,
};

export const NotificationsList = compose(
  connect(
    mapStateToProps,
    mapDispatchToProps,
  ),
  withState('openDropdown', 'setOpenDropdown', ''),
  withState('previewModal', 'setPreviewModal', null),
  withProps(props => {
    switch (props.type) {
      case 'templates':
        return { type: 'Template', submissions: props.templates };
      case 'snippets':
        return { type: 'Snippet', submissions: props.snippets };
      case 'date-formats':
        return { type: 'Date Format', submissions: props.dateFormats };
      default:
        return { type: 'Template', submissions: props.templates };
    }
  }),
  withHandlers({
    toggleDropdown,
    handleClone,
    handleDelete,
    handlePreview,
  }),
  lifecycle({
    componentDidMount() {
      mountTable(tableKey(this.props.type));
    },
    componentDidUpdate(prevProps) {
      if (this.props.type !== prevProps.type) {
        unmountTable(tableKey(prevProps.type));
        mountTable(tableKey(this.props.type));
      }
    },
    componentWillUnmount() {
      unmountTable(tableKey(this.props.type));
    },
  }),
)(NotificationsListComponent);

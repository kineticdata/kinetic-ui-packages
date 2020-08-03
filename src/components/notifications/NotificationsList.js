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
import {
  TableComponents,
  addToast,
  addToastAlert,
  openConfirm,
} from '@kineticdata/bundle-common';
import { PageTitle } from '../shared/PageTitle';
import { isActiveClass } from '../../utils';
import {
  actions,
  NOTIFICATIONS_FORM_SLUG,
  NOTIFICATIONS_DATE_FORMAT_FORM_SLUG,
} from '../../redux/modules/settingsNotifications';

const NameCell = ({ row }) => (
  <td>
    <Link to={row.get('id')}>{row.getIn(['values', 'Name'])}</Link>
  </td>
);

const StatusCell = ({ row }) => (
  <td>
    <TableComponents.StatusBadge status={row.getIn(['values', 'Status'])}>
      {row.getIn(['values', 'Status'])}
    </TableComponents.StatusBadge>
  </td>
);

export const NotificationsListComponent = ({
  tableKey,
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
    errorMessage: (error, translate) => {
      const match = error.message.match(
        /index parameter was specified \((.*?)\), but doesn't correspond to an index defined/,
      );
      return `${translate(
        'There was a problem loading information from the server!',
      )}${
        match && match.length > 1
          ? ` ${translate('The %s index is missing.').replace('%s', match[1])}`
          : ''
      }`;
    },
  });

  const ActionsCell = ({ row }) => (
    <td>
      <Dropdown
        toggle={toggleDropdown(row.get('id'))}
        isOpen={openDropdown === row.get('id')}
      >
        <DropdownToggle tag="button" className="btn btn-sm btn-link">
          <span className="sr-only">More Actions</span>
          <span className="fa fa-chevron-down fa-fw" role="presentation" />
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
      key={`${tableKey}-${type}`}
      tableKey={tableKey}
      formSlug={
        type === 'Date Format'
          ? NOTIFICATIONS_DATE_FORMAT_FORM_SLUG
          : NOTIFICATIONS_FORM_SLUG
      }
      include="values"
      components={{
        EmptyBodyRow,
      }}
      columnSet={
        type === 'Date Format'
          ? ['templateName', 'status', 'format', 'actions']
          : ['templateName', 'status', 'subject', 'actions']
      }
      defaultSortColumn={'templateName'}
      defaultSortDirection={'asc'}
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
          components: {
            BodyCell: StatusCell,
          },
        },
        {
          value: 'subject',
          valueTransform: (_value, row) => row.getIn(['values', 'Subject']),
          title: 'Subject',
        },
        {
          value: 'format',
          valueTransform: (_value, row) => row.getIn(['values', 'Format']),
          title: 'Format',
        },
        {
          value: 'actions',
          title: ' ',
          components: {
            BodyCell: ActionsCell,
          },
        },
      ]}
      initialFilterValues={
        type === 'Date Format'
          ? {
              query: {
                index: 'values[Name]',
              },
            }
          : {
              query: {
                index: 'values[Type],values[Name]',
                parts: ['values[Type]', 'equals', type],
                q: `values[Type] = "${type}"`,
              },
            }
      }
    >
      {({ pagination, table }) => (
        <div className="page-container">
          <PageTitle parts={['Notifications', 'Settings']} />
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

const mapStateToProps = state => ({
  snippets: state.settingsNotifications.snippets.reduce((obj, item) => {
    obj[item.label] = item;
    return obj;
  }, {}),
});

const mapDispatchToProps = {
  fetchSnippets: actions.fetchSnippetsRequest,
  cloneNotification: actions.cloneNotificationRequest,
  deleteNotification: actions.deleteNotificationRequest,
};

const toggleDropdown = ({
  setOpenDropdown,
  openDropdown,
}) => dropdownSlug => () =>
  setOpenDropdown(dropdownSlug === openDropdown ? '' : dropdownSlug);

const handleClone = ({
  cloneNotification,
  type,
  tableKey,
  navigate,
}) => id => () =>
  cloneNotification({
    id,
    success: submission => {
      addToast(`${type} cloned successfully`);
      refetchTable(tableKey);
      navigate(submission.id);
    },
    failure: error =>
      addToastAlert({ title: 'Clone Failed', message: error.message }),
  });

const handleDelete = ({ deleteNotification, tableKey, type }) => id => () =>
  openConfirm({
    title: `Delete ${type}`,
    body: `Are you sure you want to delete this ${type.toLowerCase()}?`,
    actionName: 'Delete',
    ok: () =>
      deleteNotification({
        id: id,
        success: () => {
          addToast(`${type} deleted successfully`);
          refetchTable(tableKey);
        },
        failure: error =>
          addToastAlert({ title: 'Delete Failed', message: error.message }),
      }),
  });

const handlePreview = props => notification => () => {
  let values = notification.values;

  values['HTML Content'] = values['HTML Content'].replace(
    /\$\{snippet\('.*?'\)\}/gi,
    snippet => {
      const label = snippet.match(/\$\{snippet\('(.*?)'\)\}/);
      return props.snippets[label[1]]
        ? props.snippets[label[1]].values['HTML Content']
        : snippet;
    },
  );

  props.setPreviewModal({ ...notification, values });
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
        return { type: 'Template' };
      case 'snippets':
        return { type: 'Snippet' };
      case 'date-formats':
        return { type: 'Date Format' };
      default:
        return { type: 'Template' };
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
      this.props.fetchSnippets();
    },
    componentDidUpdate(prevProps) {
      if (this.props.type !== prevProps.type) {
        unmountTable(this.props.tableKey);
        mountTable(this.props.tableKey);
      }
    },
  }),
)(NotificationsListComponent);

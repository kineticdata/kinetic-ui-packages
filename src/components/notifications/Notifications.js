import React, { Component } from 'react';
import { connect } from '../../redux/store';
import { Router } from '@reach/router';
import { Notification } from './Notification';
import { DateFormat } from './DateFormat';
import { NotificationsList } from './NotificationsList';
import { ErrorMessage, TableComponents } from '@kineticdata/bundle-common';
import { I18n } from '@kineticdata/react';

const tableKey = 'notifications-list';

class RedirectComponent extends Component {
  constructor(props) {
    super(props);
    props.navigate('templates', { replace: true });
  }
  render() {
    return null;
  }
}

export const NotificationsComponent = ({ hasNotificationAccess }) =>
  hasNotificationAccess ? (
    <Router>
      <TableComponents.MountWrapper tableKey={tableKey} default>
        <DateFormat tableKey={tableKey} path="date-formats/:id" />
        <Notification tableKey={tableKey} path=":type/:id" />
        <NotificationsList tableKey={tableKey} path=":type" />
        <RedirectComponent default />
      </TableComponents.MountWrapper>
    </Router>
  ) : (
    <I18n
      render={translate => (
        <ErrorMessage
          title={translate('Page Not Found')}
          message={translate("Sorry, this page isn't available.")}
        />
      )}
    />
  );

export const mapStateToProps = state => ({
  hasNotificationAccess: state.settingsApp.hasNotificationAccess,
});

export const Notifications = connect(mapStateToProps)(NotificationsComponent);

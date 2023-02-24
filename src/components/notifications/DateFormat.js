import React from 'react';
import { compose, withHandlers, withProps } from 'recompose';
import { CoreForm } from '@kineticdata/react';
import { I18n, refetchTable } from '@kineticdata/react';
import { addToast } from '@kineticdata/bundle-common';
import { PageTitle } from '../shared/PageTitle';
import { NOTIFICATIONS_DATE_FORMAT_FORM_SLUG } from '../../redux/modules/settingsNotifications';

export const DateFormatComponent = props => (
  <div className="page-container">
    <div className="page-panel">
      <PageTitle
        parts={[
          `${props.submissionId ? 'Edit' : 'New'} Date Format`,
          'Notifications',
        ]}
        breadcrumbs={[
          { label: 'Home', to: '/' },
          { label: 'Settings', to: '../..' },
          { label: `Notification Date Formats`, to: '..' },
        ]}
        title={`${props.submissionId ? 'Edit' : 'New'} Date Format`}
      />
      <div className="form-unstyled mb-5">
        <I18n
          context={`kapps.datastore.forms.${NOTIFICATIONS_DATE_FORMAT_FORM_SLUG}`}
        >
          <CoreForm
            kapp="datastore"
            form={!props.submissionId && NOTIFICATIONS_DATE_FORMAT_FORM_SLUG}
            submission={props.submissionId}
            onCreated={props.handleCreated}
            onUpdated={props.handleUpdated}
          />
        </I18n>
      </div>
    </div>
  </div>
);

export const handleCreated = props => () => {
  addToast('Date format successfully created');
  refetchTable(props.tableKey);
  props.navigate('..');
};

export const handleUpdated = props => (response, actions) => {
  addToast('Date format successfully updated');
  refetchTable(props.tableKey);
  props.navigate('..');
};

export const DateFormat = compose(
  withProps(props => ({
    submissionId: props.id !== 'new' ? props.id : null,
  })),
  withHandlers({ handleCreated, handleUpdated }),
)(DateFormatComponent);

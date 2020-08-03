import React from 'react';
import { compose, withHandlers, withProps } from 'recompose';
import { Link } from '@reach/router';
import { CoreForm } from '@kineticdata/react';
import { I18n, refetchTable } from '@kineticdata/react';
import { addToast } from '@kineticdata/bundle-common';
import { PageTitle } from '../shared/PageTitle';
import { NOTIFICATIONS_DATE_FORMAT_FORM_SLUG } from '../../redux/modules/settingsNotifications';

export const DateFormatComponent = props => (
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
            <Link to="../../..">
              <I18n>settings</I18n>
            </Link>
          </span>{' '}
          <span aria-hidden="true">/ </span>
          <span className="breadcrumb-item">
            <Link to="..">
              <I18n>notification date formats</I18n>
            </Link>
          </span>{' '}
          <span aria-hidden="true">/ </span>
          <h1>
            <I18n>{props.submissionId ? 'Edit' : 'New'} Date Format</I18n>
          </h1>
          <I18n
            context={`datastore.forms.${NOTIFICATIONS_DATE_FORMAT_FORM_SLUG}`}
          >
            <CoreForm
              datastore
              form={!props.submissionId && NOTIFICATIONS_DATE_FORMAT_FORM_SLUG}
              submission={props.submissionId}
              onCreated={props.handleCreated}
              onUpdated={props.handleUpdated}
            />
          </I18n>
        </div>
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

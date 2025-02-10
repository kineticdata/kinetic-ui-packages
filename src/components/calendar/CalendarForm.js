import React from 'react';
import { CalendarForm as Form } from '@kineticdata/bundle-common';
import { I18n } from '@kineticdata/react';
import { Link } from '@reach/router';
import { PageTitle } from '../shared/PageTitle';

export const CalendarForm = props => (
  <div className="page-container page-container--panels">
    <PageTitle parts={['Calendar']} />
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
            <Link to={`../..`}>
              <I18n>Calendars</I18n>
            </Link>
          </span>{' '}
          <span aria-hidden="true">/ </span>
          <h1>
            <I18n>Calendar</I18n>
          </h1>
        </div>
      </div>
      <Form id={props.id} />
    </div>
  </div>
);

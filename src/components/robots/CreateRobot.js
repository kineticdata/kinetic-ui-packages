import React from 'react';
import { Link } from '@reach/router';
import { compose, withHandlers } from 'recompose';
import { ROBOT_FORM_SLUG } from '../../redux/modules/settingsRobots';
import { CoreForm, refetchTable } from '@kineticdata/react';
import { addToast } from '@kineticdata/bundle-common';
import { PageTitle } from '../shared/PageTitle';

import { I18n } from '@kineticdata/react';

const CreateRobotComponent = ({ handleCreated }) => (
  <div className="page-container">
    <PageTitle parts={[`Robots`, 'Settings']} />
    <div className="page-panel page-panel--white">
      <div className="page-title">
        <div
          role="navigation"
          aria-label="breadcrumbs"
          className="page-title__breadcrumbs"
        >
          <span className="breadcrumb-item">
            <Link to="../..">
              <I18n>settings</I18n>
            </Link>
          </span>{' '}
          <span aria-hidden="true">/ </span>
          <span className="breadcrumb-item">
            <Link to="..">
              <I18n>robots</I18n>
            </Link>
          </span>{' '}
          <span aria-hidden="true">/ </span>
          <h1>
            <I18n>New Robot</I18n>
          </h1>
        </div>
      </div>

      <div>
        <I18n context={`datastore.forms.${ROBOT_FORM_SLUG}`}>
          <CoreForm datastore form={ROBOT_FORM_SLUG} created={handleCreated} />
        </I18n>
      </div>
    </div>
  </div>
);

export const handleCreated = props => response => {
  addToast(
    `${response.submission.values['Robot Name']} robot created successfully`,
  );
  refetchTable(props.tableKey);
  props.navigate(`../${response.submission.id}`);
};

export const CreateRobot = compose(
  withHandlers({
    handleCreated,
  }),
)(CreateRobotComponent);

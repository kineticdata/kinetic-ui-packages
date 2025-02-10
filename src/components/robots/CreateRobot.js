import React from 'react';
import { compose, withHandlers } from 'recompose';
import { ROBOT_FORM_SLUG } from '../../redux/modules/settingsRobots';
import { CoreForm, refetchTable } from '@kineticdata/react';
import { addToast } from '@kineticdata/bundle-common';
import { PageTitle } from '../shared/PageTitle';

import { I18n } from '@kineticdata/react';

const CreateRobotComponent = ({ handleCreated }) => (
  <div className="page-container">
    <div className="page-panel">
      <PageTitle
        parts={['New Robot', 'Robots']}
        breadcrumbs={[
          { label: 'Home', to: '/' },
          { label: 'Settings', to: '../..' },
          { label: 'Robots', to: '..' },
        ]}
        title="New Robot"
      />
      <div className="form-unstyled mb-5">
        <I18n context={`kapps.datastore.forms.${ROBOT_FORM_SLUG}`}>
          <CoreForm
            kapp="datastore"
            form={ROBOT_FORM_SLUG}
            created={handleCreated}
          />
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

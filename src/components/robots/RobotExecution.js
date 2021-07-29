import React from 'react';
import { connect } from '../../redux/store';
import { compose } from 'recompose';
import { CoreForm } from '@kineticdata/react';
import { I18n } from '@kineticdata/react';
import { PageTitle } from '../shared/PageTitle';
import { ROBOT_EXECUTIONS_FORM_SLUG } from '../../redux/modules/settingsRobots';

const RobotExecutionComponent = ({
  robot,
  robotError,
  robotId,
  executionId,
}) => {
  return (
    <div className="page-container">
      <div className="page-panel">
        <PageTitle
          parts={[
            executionId && executionId.slice(-6).toUpperCase(),
            'Executions',
            robot && robot.values['Robot Name'],
            `Robots`,
          ]}
          breadcrumbs={[
            { label: 'Home', to: '/' },
            { label: 'Settings', to: '../../../..' },
            { label: 'Robots', to: '../../..' },
            (robot || robotError) && {
              label: robot ? robot.values['Robot Name'] : 'Robot',
              to: '../..',
            },
            (robot || robotError) && {
              label: 'Executions',
              to: '..',
            },
          ]}
          title="Execution Details"
        />
        <div className="form-unstyled mb-5">
          <I18n context={`kapps.datastore.forms.${ROBOT_EXECUTIONS_FORM_SLUG}`}>
            <CoreForm review submission={executionId} />
          </I18n>
        </div>
      </div>
    </div>
  );
};

export const mapStateToProps = state => ({
  robot: state.settingsRobots.robot,
  robotError: state.settingsRobots.robotError,
});

export const RobotExecution = compose(connect(mapStateToProps))(
  RobotExecutionComponent,
);

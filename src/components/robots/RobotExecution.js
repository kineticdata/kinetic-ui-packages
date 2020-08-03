import React from 'react';
import { Link } from '@reach/router';
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
      <PageTitle parts={[`Robots`, 'Settings']} />
      <div className="page-panel page-panel--white">
        <div className="page-title">
          <div
            role="navigation"
            aria-label="breadcrumbs"
            className="page-title__breadcrumbs"
          >
            <span className="breadcrumb-item">
              <Link to="../../../..">
                <I18n>settings</I18n>
              </Link>
            </span>{' '}
            <span aria-hidden="true">/ </span>
            <span className="breadcrumb-item">
              <Link to="../../..">
                <I18n>robots</I18n>
              </Link>
            </span>{' '}
            <span aria-hidden="true">/ </span>
            {(robot || robotError) && (
              <>
                <span className="breadcrumb-item">
                  <Link to={`../..`}>
                    <I18n>{robot ? robot.values['Robot Name'] : 'robot'}</I18n>
                  </Link>
                </span>{' '}
                <span aria-hidden="true">/ </span>
                <span className="breadcrumb-item">
                  <Link to="..">
                    <I18n>executions</I18n>
                  </Link>
                </span>{' '}
                <span aria-hidden="true">/ </span>
              </>
            )}
            <h1>
              <I18n>Execution Details</I18n>
            </h1>
          </div>
        </div>
        <I18n context={`datastore.forms.${ROBOT_EXECUTIONS_FORM_SLUG}`}>
          <CoreForm datastore review submission={executionId} />
        </I18n>
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

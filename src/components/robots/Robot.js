import React from 'react';
import { connect } from '../../redux/store';
import { compose, withHandlers, withState } from 'recompose';
import moment from 'moment';
import { CoreForm, refetchTable } from '@kineticdata/react';
import { addToast } from '@kineticdata/bundle-common';
import { I18n } from '@kineticdata/react';
import { PageTitle } from '../shared/PageTitle';
import { ROBOT_FORM_SLUG } from '../../redux/modules/settingsRobots';

const RobotComponent = ({
  robot,
  robotId,
  handleUpdated,
  handleError,
  profile,
  isSmallLayout,
}) => {
  const isInactive =
    robot && robot.values['Status'].toLowerCase() === 'inactive';
  const isExpired =
    robot &&
    robot.values['End Date'] &&
    moment(robot.values['End Date']).isBefore(moment());
  return (
    <div className="page-container">
      <div className="page-panel">
        <PageTitle
          parts={[robot && robot.values['Robot Name'], 'Robots']}
          breadcrumbs={[
            { label: 'Home', to: '/' },
            { label: 'Settings', to: '../..' },
            { label: 'Robots', to: '..' },
          ]}
          title={robot && robot.values['Robot Name']}
          actions={[
            {
              label: 'Executions',
              icon: 'arrow-right',
              to: 'executions',
            },
          ]}
        />
        {(isInactive || isExpired) && (
          <div className="alert alert-warning">
            <I18n>This robot is</I18n>{' '}
            {isInactive && (
              <strong>
                <I18n>Inactive</I18n>
              </strong>
            )}
            {isInactive &&
              isExpired && (
                <I18n render={translate => ` ${translate('and')} `} />
              )}
            {isExpired && (
              <strong>
                <I18n>Expired</I18n>
              </strong>
            )}
            {'.'}
          </div>
        )}
        <div className="form-unstyled mb-5">
          <I18n context={`kapps.datastore.forms.${ROBOT_FORM_SLUG}`}>
            <CoreForm submission={robotId} updated={handleUpdated} />
          </I18n>
        </div>
      </div>
    </div>
  );
};

export const mapStateToProps = state => ({
  robot: state.settingsRobots.robot,
  robotError: state.settingsRobots.robotError,
  profile: state.app.profile,
  isSmallLayout: state.app.layoutSize === 'small',
});

export const handleUpdated = props => response => {
  refetchTable(props.tableKey);
  addToast(
    `${response.submission.values['Robot Name']} robot successfully updated`,
  );
};

export const Robot = compose(
  connect(mapStateToProps),
  withState('confirmDelete', 'setConfirmDelete', false),
  withHandlers({
    handleUpdated,
  }),
)(RobotComponent);

import React from 'react';
import { connect } from '../../redux/store';
import { compose, withHandlers, withProps, withState } from 'recompose';
import moment from 'moment';
import { CoreForm, refetchTable } from '@kineticdata/react';
import {
  Aside,
  DiscussionsPanel,
  addToast,
  selectDiscussionsEnabled,
} from '@kineticdata/bundle-common';
import { I18n } from '@kineticdata/react';
import { PageTitle } from '../shared/PageTitle';
import { ROBOT_FORM_SLUG } from '../../redux/modules/settingsRobots';

const DiscussionCreationForm = ({ onChange, values, errors }) => (
  <div className="form-group">
    <label htmlFor="title">Title</label>
    <input
      id="title"
      name="title"
      type="text"
      value={values.title}
      onChange={onChange}
    />
    {errors.title && (
      <small className="form-text text-danger">{errors.title}</small>
    )}
  </div>
);

const RobotComponent = ({
  robot,
  robotId,
  handleUpdated,
  handleError,
  creationFields,
  profile,
  discussionsEnabled,
  isSmallLayout,
  asideOpen,
  toggleAsideOpen,
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
            discussionsEnabled && {
              label: 'Discussions',
              icon: 'comments-o',
              onClick: () => toggleAsideOpen(!asideOpen),
            },
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
      {discussionsEnabled &&
        asideOpen && (
          <Aside
            title="Discussions"
            toggle={() => toggleAsideOpen(false)}
            className="p-0"
          >
            <DiscussionsPanel
              creationFields={creationFields}
              CreationForm={DiscussionCreationForm}
              itemType="Submission"
              itemKey={robotId}
              me={profile}
              overrideClassName="page-panel--discussions"
            />
          </Aside>
        )}
    </div>
  );
};

export const mapStateToProps = state => ({
  robot: state.settingsRobots.robot,
  robotError: state.settingsRobots.robotError,
  profile: state.app.profile,
  discussionsEnabled: selectDiscussionsEnabled(state),
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
  withProps(
    props =>
      props.robot && {
        creationFields: {
          title: props.robot.label || 'Robot Discussion',
          description: props.robot.form.name || '',
        },
      },
  ),
  withState('confirmDelete', 'setConfirmDelete', false),
  withState('asideOpen', 'toggleAsideOpen', false),
  withHandlers({
    handleUpdated,
  }),
)(RobotComponent);

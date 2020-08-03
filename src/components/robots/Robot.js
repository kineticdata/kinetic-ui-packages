import React from 'react';
import { Link } from '@reach/router';
import { connect } from '../../redux/store';
import { compose, withHandlers, withProps, withState } from 'recompose';
import moment from 'moment';
import { CoreForm, refetchTable } from '@kineticdata/react';
import {
  DiscussionsPanel,
  ViewDiscussionsModal,
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
  viewDiscussionsModal,
  openDiscussions,
  closeDiscussions,
  isSmallLayout,
}) => {
  const isInactive =
    robot && robot.values['Status'].toLowerCase() === 'inactive';
  const isExpired =
    robot &&
    robot.values['End Date'] &&
    moment(robot.values['End Date']).isBefore(moment());
  return (
    <div className="page-container page-container--panels">
      <PageTitle parts={['Robots', 'Settings']} />
      <div className="page-panel page-panel--white page-panel--three-fifths">
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
            <h1>{robot && robot.values['Robot Name']}</h1>
          </div>
          {robot && (
            <div className="page-title__actions">
              {discussionsEnabled &&
                isSmallLayout && (
                  <button onClick={openDiscussions} className="btn btn-info">
                    <span className="fa fa-fw fa-comments" />{' '}
                    <I18n>Open Discussions</I18n>
                  </button>
                )}
              <Link to="executions" className="btn btn-info">
                <I18n>View Executions</I18n>
              </Link>
            </div>
          )}
        </div>
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
        <I18n context={`datastore.forms.${ROBOT_FORM_SLUG}`}>
          <CoreForm datastore submission={robotId} updated={handleUpdated} />
        </I18n>
        {discussionsEnabled &&
          isSmallLayout &&
          viewDiscussionsModal && (
            <ViewDiscussionsModal
              itemType="Datastore Submission"
              itemKey={robotId}
              close={closeDiscussions}
              creationFields={creationFields}
              CreationForm={DiscussionCreationForm}
              me={profile}
            />
          )}
      </div>
      {discussionsEnabled &&
        !isSmallLayout && (
          <DiscussionsPanel
            itemType="Datastore Submission"
            itemKey={robotId}
            creationFields={creationFields}
            CreationForm={DiscussionCreationForm}
            me={profile}
          />
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
  withState('viewDiscussionsModal', 'setViewDiscussionsModal', false),
  withHandlers({
    openDiscussions: props => () => props.setViewDiscussionsModal(true),
    closeDiscussions: props => () => props.setViewDiscussionsModal(false),
    handleUpdated,
  }),
)(RobotComponent);

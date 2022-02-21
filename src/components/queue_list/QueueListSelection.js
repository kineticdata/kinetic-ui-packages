import React from 'react';
import { compose, withHandlers, withProps, withState } from 'recompose';
import { connect } from '../../redux/store';
import { actions } from '../../redux/modules/queue';
import {
  selectAssignmentTeams,
  mapTeamsToAssignments,
} from '../../redux/modules/queueApp';
import { BulkAssignModal } from './BulkAssignModal';
import { BulkWorkModal } from './BulkWorkModal';
import { BulkStatusModal } from './BulkStatusModal';
import { UncontrolledTooltip } from 'reactstrap';
import { I18n } from '@kineticdata/react';
import { addToast } from '@kineticdata/bundle-common';
import { Map, Set } from 'immutable';
import classNames from 'classnames';

export const QueueListSelectionComponent = ({
  selectedList,
  toggleSelectionMode,
  toggleSelectedItem,
  assignUnavailable,
  assignTooltip,
  workHidden,
  workUnavailable,
  workTooltip,
  action,
  toggleAssign,
  handleAssignSubmit,
  toggleWork,
  handleWorkSubmit,
  assignments,
  isMobile,
  refresh,
}) => {
  return (
    <div className="queue-controls">
      <div className="queue-controls__selection">
        <div className="details">
          <div>
            {selectedList.size}{' '}
            <I18n>{`Item${selectedList.size !== 1 ? 's' : ''} Selected`}</I18n>
          </div>
        </div>
        <div className="buttons d-flex">
          <button
            id="bulk-assign-btn"
            type="button"
            className={classNames('btn btn-icon', {
              'text-danger unavailable': assignUnavailable,
            })}
            onClick={toggleAssign}
            aria-label="Assign Selected Items"
            disabled={selectedList.size === 0}
          >
            <span className="icon">
              <span className="fa fa-fw fa-share-square-o" />
            </span>
            {!isMobile && (
              <span>
                <I18n>Assign</I18n>
              </span>
            )}
          </button>
          {assignTooltip &&
            !isMobile && (
              <UncontrolledTooltip
                placement="top"
                target="bulk-assign-btn"
                delay={0}
                trigger="hover focus"
              >
                <I18n>{assignTooltip}</I18n>
              </UncontrolledTooltip>
            )}
          {!workHidden && (
            <>
              <button
                id="bulk-work-btn"
                type="button"
                className={classNames('btn btn-icon', {
                  'text-danger unavailable': workUnavailable,
                })}
                onClick={toggleWork}
                aria-label="Work Selected Items"
                disabled={selectedList.size === 0}
              >
                <span className="icon">
                  <span className="fa fa-fw fa-pencil-square-o" />
                </span>
                {!isMobile && (
                  <span>
                    <I18n>Work</I18n>
                  </span>
                )}
              </button>
              {workTooltip &&
                !isMobile && (
                  <UncontrolledTooltip
                    placement="top"
                    target="bulk-work-btn"
                    delay={0}
                    trigger="hover focus"
                  >
                    <I18n>{workTooltip}</I18n>
                  </UncontrolledTooltip>
                )}
            </>
          )}
          <div className="ml-1 mr-2 border-right" aria-hidden="true" />
          <button
            type="button"
            className="btn btn-icon"
            onClick={toggleSelectionMode}
            aria-label="Cancel Selection Mode"
          >
            <span className="icon">
              <span className="fa fa-fw fa-times" />
            </span>
          </button>
        </div>
      </div>
      {action === 'assign' && (
        <BulkAssignModal
          toggle={toggleAssign}
          handleSubmit={handleAssignSubmit}
          message={assignTooltip}
          assignments={assignments}
        />
      )}
      {action === 'work' && (
        <BulkWorkModal
          toggle={toggleWork}
          handleSubmit={handleWorkSubmit}
          message={workTooltip}
        />
      )}
      <BulkStatusModal refresh={refresh} />
    </div>
  );
};

const mapStateToProps = (state, props) => {
  return {
    profile: state.app.profile,
    selectedList: state.queue.selectedList,
    forms: state.queueApp.forms,
    teams: state.queueApp.allTeams,
    isMobile: state.app.layoutSize === 'small',
  };
};

const mapDispatchToProps = {
  toggleSelectionMode: actions.toggleSelectionMode,
  toggleSelectedItem: actions.toggleSelectedItem,
  bulkAssign: actions.bulkAssignRequest,
  bulkWork: actions.bulkWorkRequest,
};

export const QueueListSelection = compose(
  connect(
    mapStateToProps,
    mapDispatchToProps,
  ),
  withProps(props => {
    // Create default additional props
    const addProps = {
      assignUnavailable: false,
      assignTooltip: null,
      workHidden: true,
      workUnavailable: false,
      workTooltip: null,
      assignments: [],
    };

    // Calculate whether the assign button is available
    if (props.selectedList.size > 0) {
      // Create a unique list of form and Assigned Team pairs, and calculate the
      // teams that the items can be assigned to.
      const teamsPerUniqueItem = props.selectedList
        .reduce((map, item) => {
          const key = `${item.form.slug}_${item.values['Assigned Team']}`;
          if (!map.has(key)) {
            return map.set(key, item);
          }
          return map;
        }, Map())
        .map(item => selectAssignmentTeams(props.teams, item.form, item))
        .toList();

      // If there aren't any teams that all selected items can be assigned to,
      // prevent the assign action.
      if (
        !props.teams.some(team =>
          teamsPerUniqueItem.every(assignmentTeams =>
            assignmentTeams.find(at => at.name === team.name),
          ),
        )
      ) {
        addProps.assignUnavailable = true;
        addProps.assignTooltip =
          'There are no valid teams that all the selected items can be assigned to.';
      }
      // If the set of available teams for each item isn't the same, show a
      // warning message that the avialable assignment will be limited
      else if (
        teamsPerUniqueItem
          .map(teams =>
            teams
              .map(team => team.name)
              .sort()
              .join('_'),
          )
          .some((teamString, i, iter) => teamString !== iter.get(0))
      ) {
        addProps.assignTooltip =
          'The available assignments for the selected items will be limited due to assignment restrictions of some of the selected items.';
      }

      // Set the available assignments for the itnersection set of available teams
      addProps.assignments = mapTeamsToAssignments(
        props.teams.filter(team =>
          teamsPerUniqueItem.every(assignmentTeams =>
            assignmentTeams.find(at => at.name === team.name),
          ),
        ),
      ).toJS();
    }

    // Calculate whether the work button is available
    if (props.selectedList.size > 0) {
      // Get a set of unique forms from the selected items
      const uniqueSelectedForms = Set(
        props.selectedList.map(item => item.form.slug).toList(),
      );
      // If all items are for a single form, get the from
      const selectedForm =
        uniqueSelectedForms.size === 1 && props.selectedList.first().form;

      // Show work button if any of the selected items support bulk operations
      if (
        !!props.selectedList.find(
          item =>
            item.form &&
            item.form.fields &&
            item.form.fields.some(field => field.name === 'Bulk Action'),
        )
      ) {
        addProps.workHidden = false;

        // If multiple forms have been selected, prevent the work action.
        if (!selectedForm) {
          addProps.workUnavailable = true;
          addProps.workTooltip =
            'All selected items must be from the same form, and the form must support bulk work actions.';
        }
        // If the selected items aren't all assigned to me, prevent the work action.
        else if (
          props.selectedList.some(
            item =>
              item.values['Assigned Individual'] !== props.profile.username,
          )
        ) {
          addProps.workUnavailable = true;
          addProps.workTooltip =
            'The selected items must all be assigned to you.';
        }
      }
    }

    return addProps;
  }),
  withState('action', 'setAction', null),
  withHandlers({
    toggleAssign: props => () => {
      if (props.selectedList.size > 0) {
        if (!props.assignUnavailable) {
          props.setAction(props.action === 'assign' ? null : 'assign');
        } else if (props.assignTooltip && props.isMobile) {
          addToast({ severity: 'danger', message: props.assignTooltip });
        }
      }
    },
    toggleWork: props => () => {
      if (props.selectedList.size > 0) {
        if (!props.workUnavailable) {
          props.setAction(props.action === 'work' ? null : 'work');
        } else if (props.workTooltip && props.isMobile) {
          addToast({ severity: 'danger', message: props.workTooltip });
        }
      }
    },
  }),
  withHandlers({
    handleAssignSubmit: props => assignment => {
      props.toggleAssign();
      props.bulkAssign({ assignment });
    },
    handleWorkSubmit: props => values => {
      props.toggleWork();
      props.bulkWork({ values });
    },
  }),
)(QueueListSelectionComponent);

import React from 'react';
import { compose, withHandlers, withState } from 'recompose';
import { connect } from '../../redux/store';
import { AssignmentSelector } from '../shared/AssignmentSelector';
import { Modal, ModalBody, ModalFooter } from 'reactstrap';
import { I18n } from '@kineticdata/react';

const BulkAssignModalComponent = props => (
  <Modal isOpen={true} toggle={props.toggle} size="lg">
    <div className="modal-header">
      <div className="modal-title">
        <button type="button" className="btn btn-link" onClick={props.toggle}>
          <I18n>Close</I18n>
        </button>
        <span>
          <I18n
            render={translate =>
              translate(
                `Assign %d Selected Item${props.items.size > 1 ? 's' : ''}`,
              ).replace('%d', props.items.size)
            }
          />
        </span>
      </div>
    </div>
    <ModalBody>
      {props.message && <div className="p-3">{props.message}</div>}
      {props.isAssigning ? (
        <AssignmentSelector
          toggle={props.toggleAssigning}
          onSelect={props.setAssignment}
          assignments={props.assignments}
        />
      ) : (
        <div
          className="assignment-badge"
          onClick={props.toggleAssigning}
          role="button"
          aria-label="Change Assignment"
          tabIndex={0}
        >
          <span className="badge" aria-hidden="true">
            {(props.assignment['Assigned Individual Display Name'] &&
              props.assignment['Assigned Individual Display Name'].charAt(0)) ||
              (props.assignment['Assigned Team Display Name'] &&
                props.assignment['Assigned Team Display Name'].charAt(0))}
          </span>
          <div>
            <div className="assignment-badge__team">
              <I18n>{props.assignment['Assigned Team Display Name']}</I18n>
            </div>
            <div className="assignment-badge__individual text-truncate">
              {props.assignment['Assigned Individual Display Name'] ||
                props.assignment['Assigned Individual']}
            </div>
          </div>
          <span className="icon" aria-hidden="true">
            <span className="fa fa-pencil" />
          </span>
        </div>
      )}
    </ModalBody>
    <ModalFooter>
      <button
        type="button"
        className="btn btn-primary"
        onClick={props.submitAssignment}
        disabled={!props.assignment}
      >
        <I18n>Assign</I18n>
      </button>
    </ModalFooter>
  </Modal>
);

const mapStateToProps = (state, props) => {
  return {
    items: state.queue.selectedList,
    forms: state.queueApp.forms,
  };
};

export const BulkAssignModal = compose(
  connect(mapStateToProps),
  withState('assignment', 'setAssignment', null),
  withState('isAssigning', 'setIsAssigning', true),
  withHandlers({
    toggleAssigning: props => () =>
      props.setIsAssigning(props.assignment ? !props.isAssigning : true),
    setAssignment: props => (_v, assignment) => {
      const teamParts = assignment.team.split('::');
      let data = {
        'Assigned Team': assignment.team,
        'Assigned Team Display Name': teamParts[teamParts.length - 1],
        'Assigned Individual': '',
        'Assigned Individual Display Name': '',
      };
      if (assignment.username) {
        data['Assigned Individual'] = assignment.username;
        data['Assigned Individual Display Name'] = assignment.displayName;
      }
      props.setAssignment(data);
    },
    submitAssignment: props => () => props.handleSubmit(props.assignment),
  }),
)(BulkAssignModalComponent);

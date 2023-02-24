import { Record } from 'immutable';
import { Utils } from '@kineticdata/bundle-common';
const { noPayload, withPayload } = Utils;
const ns = Utils.namespaceBuilder('settings/robots');

export const ROBOT_DEFINITIONS_FORM_SLUG = 'robot-definitions';
export const ROBOT_FORM_SLUG = 'robot-definitions';
export const ROBOT_EXECUTIONS_FORM_SLUG = 'robot-executions';
export const ROBOT_NEXT_EXECUTION_FORM_SLUG = 'robot-next-execution';

export const types = {
  FETCH_NEXT_EXECUTIONS_REQUEST: ns('FETCH_NEXT_EXECUTIONS_REQUEST'),
  FETCH_NEXT_EXECUTIONS_SUCCESS: ns('FETCH_NEXT_EXECUTIONS_SUCCESS'),
  FETCH_NEXT_EXECUTIONS_FAILURE: ns('FETCH_NEXT_EXECUTIONS_FAILURE'),

  FETCH_ROBOT_REQUEST: ns('FETCH_ROBOT_REQUEST'),
  FETCH_ROBOT_SUCCESS: ns('FETCH_ROBOT_SUCCESS'),
  FETCH_ROBOT_FAILURE: ns('FETCH_ROBOT_FAILURE'),

  CLONE_ROBOT_REQUEST: ns('CLONE_ROBOT_REQUEST'),
  DELETE_ROBOT_REQUEST: ns('DELETE_ROBOT_REQUEST'),
};

export const actions = {
  fetchNextExecutionsRequest: noPayload(types.FETCH_NEXT_EXECUTIONS_REQUEST),
  fetchNextExecutionsSuccess: withPayload(types.FETCH_NEXT_EXECUTIONS_SUCCESS),
  fetchNextExecutionsFailure: withPayload(types.FETCH_NEXT_EXECUTIONS_FAILURE),

  fetchRobotRequest: withPayload(types.FETCH_ROBOT_REQUEST),
  fetchRobotSuccess: withPayload(types.FETCH_ROBOT_SUCCESS),
  fetchRobotFailure: withPayload(types.FETCH_ROBOT_FAILURE),

  cloneRobotRequest: withPayload(types.CLONE_ROBOT_REQUEST),
  deleteRobotRequest: withPayload(types.DELETE_ROBOT_REQUEST),
};

export const State = Record({
  nextExecutions: null,
  nextExecutionsError: null,
  robot: null,
  robotError: null,
});

export const reducer = (state = State(), { type, payload }) => {
  switch (type) {
    case types.FETCH_NEXT_EXECUTIONS_REQUEST:
      return state.set('nextExecutionsError', null);
    case types.FETCH_NEXT_EXECUTIONS_SUCCESS:
      return state.set('nextExecutions', payload);
    case types.FETCH_NEXT_EXECUTIONS_FAILURE:
      return state.set('nextExecutionsError', payload);

    case types.FETCH_ROBOT_REQUEST:
      return state
        .set('robotError', null)
        .set(
          'robot',
          state.robot && state.robot.id !== payload.id ? null : state.robot,
        );
    case types.FETCH_ROBOT_SUCCESS:
      return state.set('robot', payload);
    case types.FETCH_ROBOT_FAILURE:
      return state.set('robotError', payload);
    default:
      return state;
  }
};

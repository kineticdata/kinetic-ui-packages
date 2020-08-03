import React from 'react';
import { Router } from '@reach/router';
import { compose, lifecycle } from 'recompose';
import { actions } from '../../redux/modules/settingsRobots';
import { connect } from '../../redux/store';
import { CreateRobot } from './CreateRobot';
import { Robot } from './Robot';
import { RobotExecution } from './RobotExecution';
import { RobotExecutionsList } from './RobotExecutionsList';
import { RobotsList } from './RobotsList';
import { TableComponents } from '@kineticdata/bundle-common';

const tableKey = 'robots-list';
const exeTableKey = 'robot-executions-list';

const RobotWrapper = compose(
  connect(
    null,
    { fetchRobot: actions.fetchRobotRequest },
  ),
  lifecycle({
    componentDidMount() {
      this.props.fetchRobot({ id: this.props.robotId });
    },
    componentDidUpdate(prevProps) {
      if (this.props.robotId !== prevProps.robotId) {
        this.props.fetchRobot({ id: this.props.robotId });
      }
    },
  }),
)(props => (
  <Router>
    <RobotExecutions {...props} path="executions/*" />
    <Robot tableKey={tableKey} {...props} default />
  </Router>
));

const RobotExecutions = props => (
  <Router>
    <TableComponents.MountWrapper tableKey={exeTableKey} default>
      <RobotExecution tableKey={exeTableKey} {...props} path=":executionId" />
      <RobotExecutionsList tableKey={exeTableKey} {...props} default />
    </TableComponents.MountWrapper>
  </Router>
);

export const Robots = () => (
  <Router>
    <TableComponents.MountWrapper tableKey={tableKey} default>
      <CreateRobot tableKey={tableKey} path="new" />
      <RobotWrapper path=":robotId/*" />
      <RobotsList tableKey={tableKey} default />
    </TableComponents.MountWrapper>
  </Router>
);

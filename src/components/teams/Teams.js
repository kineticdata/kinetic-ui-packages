import React from 'react';
import { Router } from '@reach/router';
import { TeamsList } from './TeamsList';
import { TeamEdit } from './TeamEdit';
import { TableComponents } from '@kineticdata/bundle-common';

const tableKey = 'teams-list';

export const Teams = ({ match }) => (
  <Router>
    <TableComponents.MountWrapper tableKey={tableKey} default>
      <TeamEdit tableKey={tableKey} path=":slug" />
      <TeamsList tableKey={tableKey} default />
    </TableComponents.MountWrapper>
  </Router>
);

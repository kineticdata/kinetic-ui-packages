import React from 'react';
import { Router } from '@reach/router';
import { UsersList } from './UsersList';
import { UserEdit } from './UserEdit';
import { TableComponents } from '@kineticdata/bundle-common';

const tableKey = 'users-list';

export const Users = () => (
  <Router>
    <TableComponents.MountWrapper tableKey={tableKey} default>
      <UserEdit tableKey={tableKey} path=":username" />
      <UsersList tableKey={tableKey} default />
    </TableComponents.MountWrapper>
  </Router>
);

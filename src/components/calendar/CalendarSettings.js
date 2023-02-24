import React from 'react';
import { Router } from '@reach/router';
import { TableComponents } from '@kineticdata/bundle-common';
import { CalendarForm } from './CalendarForm';
import { CalendarList } from './CalendarList';

const tableKey = 'calendar-list';

export const CalendarSettings = ({ match }) => (
  <Router>
    <TableComponents.MountWrapper tableKey={tableKey} default>
      <CalendarForm path="calendar/:id" />
      <CalendarList tableKey={tableKey} default />
    </TableComponents.MountWrapper>
  </Router>
);

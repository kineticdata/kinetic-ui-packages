import React from 'react';
import { I18n } from '@kineticdata/react';

export const EmptyNode = () => (
  <div className="card card--timeline">
    <span className="card--timeline__circle" />
    <div className="card--title"><I18n>No Activity</I18n></div>
  </div>
);

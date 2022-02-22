import React from 'react';
import { TimeAgo } from '@kineticdata/bundle-common';
import { I18n } from '@kineticdata/react';

export const StartNode = ({ label, timestamp }) => (
  <div className="timeline-status timeline-status--start">
    <I18n>{label}</I18n>
    <br />
    <small>
      <TimeAgo tooltip={false} timestamp={timestamp} />
    </small>
  </div>
);

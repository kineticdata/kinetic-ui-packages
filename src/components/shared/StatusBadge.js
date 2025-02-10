import React from 'react';

const FORM_STATUS_CLASSES = {
  Active: 'badge-success',
  Inactive: 'badge-warning',
  New: 'badge-dark',
};

export const FormStatusBadge = ({ value }) => {
  return (
    <span className={`badge badge-pill ${FORM_STATUS_CLASSES[value]}`}>
      {value || 'Unknown'}
    </span>
  );
};

export const FormStatusBadgeCell = ({ value }) => (
  <td>
    <FormStatusBadge value={value} />
  </td>
);

export const CORE_STATE_CLASSES = {
  Draft: 'badge-warning',
  Submitted: 'badge-success',
  Closed: 'badge-secondary',
};

export const CoreStateBadge = ({ coreState }) => (
  <span className={`badge badge-pill ${CORE_STATE_CLASSES[coreState]}`}>
    {coreState}
  </span>
);

export const CoreStateBadgeCell = ({ value }) => (
  <td>
    <CoreStateBadge coreState={value} />
  </td>
);

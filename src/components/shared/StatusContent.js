import React, { Fragment } from 'react';
import { ButtonGroup } from 'reactstrap';
import { I18n } from '@kineticdata/react';

const getStatusClass = status =>
  `submission-status submission-status--${status
    .toLowerCase()
    .replace(/\s+/g, '-')}`;

const getStatusReason = queueItem => {
  switch (queueItem.values.Status) {
    case 'Pending':
      return queueItem.values['Pending Reason'];
    case 'Cancelled':
      return queueItem.values['Cancellation Reason'];
    case 'Complete':
      return queueItem.values.Resolution;
    default:
      return null;
  }
};

export const StatusContent = ({ queueItem, prev, next }) => (
  <Fragment>
    <div
      className={
        prev || next
          ? 'status-content  status-content--is-active'
          : 'status-content'
      }
    >
      <span className={getStatusClass(queueItem.values.Status)}>
        <I18n>{queueItem.values.Status}</I18n>
      </span>
    </div>
    {(prev || next) && (
      <span className="submission-status--reason">
        {getStatusReason(queueItem)}
      </span>
    )}
    {(prev || next) && (
      <ButtonGroup className="queue-details-nav">
        <button
          className="btn btn-inverse"
          disabled={!prev}
          onClick={prev}
          aria-label="Previous Queue Item"
        >
          <span className="fa fa-fw fa-caret-left" role="presentation" />
        </button>
        <button
          className="btn btn-inverse"
          disabled={!next}
          onClick={next}
          aria-label="Next Queue Item"
        >
          <span className="fa fa-fw fa-caret-right" role="presentation" />
        </button>
      </ButtonGroup>
    )}
  </Fragment>
);

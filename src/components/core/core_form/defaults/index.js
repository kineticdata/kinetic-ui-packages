import React, { Fragment } from 'react';
import { I18n } from '../../i18n/I18n';
import { Moment } from '../../i18n/Moment';
import moment from 'moment';
import { Map } from 'immutable';

export const LOCKED_BY_FIELD = 'Locked By';
export const LOCKED_UNTIL_FIELD = 'Locked Until';

export const LOCK_TIME_ATTRIBUTE = 'Lock Time';
export const LOCK_CHECK_INTERVAL_ATTRIBUTE = 'Lock Check Interval';
export const LOCK_PROMPT_TIME_ATTRIBUTE = 'Lock Prompt Time';

export const LOCK_TIME_DEFAULT_VALUE = 1800; // seconds
export const LOCK_CHECK_INTERVAL_DEFAULT_VALUE = 30; // seconds
export const LOCK_PROMPT_TIME_DEFAULT_VALUE = 120; // seconds

const LoadingComponent = () => (
  <div className="text-center p-3">
    <div>
      <span className="fa fa-spinner fa-spin fa-lg fa-fw" />
    </div>
  </div>
);

const ErrorComponent = ({ message }) => (
  <div className="text-center text-danger p-3">
    <div>
      <strong>
        <I18n>Oops!</I18n> <I18n>An error occurred.</I18n>
      </strong>
    </div>
    {message && (
      <small>
        <I18n>{message}</I18n>
      </small>
    )}
  </div>
);

const ReviewPaginationControl = ({ actions }) => (
  <div>
    <button
      className="btn btn-link"
      onClick={actions.previousPage}
      disabled={!actions.previousPage}
    >
      Previous Page
    </button>
    <button
      className="btn btn-link"
      onClick={actions.nextPage}
      disabled={!actions.nextPage}
    >
      Next Page
    </button>
  </div>
);

const LockMessage = ({ lock, actions }) => {
  if (!lock) {
    return null;
  }
  return lock.isLocked ? (
    !lock.isLockedByMe ? (
      <div>
        <Fragment>
          <span>
            <span className="fa fa-lock fw-fw mr-1" />
            <I18n>This submission is locked by</I18n> {lock.lockedBy}{' '}
            <I18n>until</I18n>{' '}
            <Moment
              timestamp={moment().add(lock.timeLeft, 'ms')}
              format={Moment.formats.timeWithSeconds}
            />
            .
          </span>
          <button className="btn btn-link" onClick={actions.refreshSubmission}>
            Refresh
          </button>
        </Fragment>
      </div>
    ) : lock.isExpiring ? (
      <div>
        <Fragment>
          <span>
            <span className="fa fa-lock fw-fw mr-1" />
            <I18n>Your lock on this submission will expire at</I18n>{' '}
            <Moment
              timestamp={moment().add(lock.timeLeft, 'ms')}
              format={Moment.formats.timeWithSeconds}
            />
            .
          </span>
          <button className="btn btn-link" onClick={actions.obtainLock}>
            Renew Lock
          </button>
        </Fragment>
      </div>
    ) : null
  ) : (
    <div>
      {!lock.lockLost ? (
        <Fragment>
          <span>
            <span className="fa fa-unlock fw-fw mr-1" />
            <I18n>This submission is currently unlocked.</I18n>
          </span>
          <button className="btn btn-link" onClick={actions.obtainLock}>
            Obtain Lock
          </button>
        </Fragment>
      ) : (
        <Fragment>
          <span>
            <span className="fa fa-unlock fw-fw mr-1" />
            <I18n>Your lock on this submission has expired.</I18n>
          </span>
          <button className="btn btn-link" onClick={actions.obtainLock}>
            Obtain Lock
          </button>
        </Fragment>
      )}
    </div>
  );
};

export const DefaultCoreFormConfig = Map({
  Pending: LoadingComponent,
  Unauthorized: ErrorComponent,
  Forbidden: ErrorComponent,
  Unexpected: ErrorComponent,
  NotFound: ErrorComponent,
  LockMessage,
  ReviewPaginationControl,
});

import React, { Component, Fragment } from 'react';
import t from 'prop-types';
import isPlainObject from 'lodash.isplainobject';
import isString from 'lodash.isstring';
import deepEqual from 'deepequal';
import moment from 'moment';
import { connect } from '../../../store';
import { K, bundle } from '../../../helpers';
import { corePath } from '../../../apis/http';
import { fetchSubmission, updateSubmission, fetchForm } from '../../../apis';
import { I18n } from '../i18n/I18n';
import { Moment } from '../i18n/Moment';
import { GlobalsContext } from './globals';
import {
  LOCKED_BY_FIELD,
  LOCKED_UNTIL_FIELD,
  LOCK_TIME_ATTRIBUTE,
  LOCK_TIME_DEFAULT_VALUE,
  LOCK_CHECK_INTERVAL_ATTRIBUTE,
  LOCK_CHECK_INTERVAL_DEFAULT_VALUE,
  LOCK_PROMPT_TIME_ATTRIBUTE,
  LOCK_PROMPT_TIME_DEFAULT_VALUE,
} from './defaults';

const submissionIncludes =
  'values,form,form.fields,form.attributesMap,form.kapp,form.kapp.attributesMap,form.kapp.space,form.kapp.space.attributesMap';
const formIncludes =
  'fields,attributesMap,kapp,kapp.attributesMap,kapp.space,kapp.space.attributesMap';

const getNumericAttributeValue = (form, name, defaultValue = 0) => {
  const kapp = form ? form.kapp : null;
  const space = kapp ? kapp.space : null;
  return (
    parseInt(
      (form &&
        form.attributesMap &&
        form.attributesMap[name] &&
        form.attributesMap[name][0]) ||
        (kapp &&
          kapp.attributesMap &&
          kapp.attributesMap[name] &&
          kapp.attributesMap[name][0]) ||
        (space &&
          space.attributesMap &&
          space.attributesMap[name] &&
          space.attributesMap[name][0]),
      10,
    ) || defaultValue
  );
};

export const isLockable = (submission, options = {}) =>
  submission &&
  submission.coreState === 'Draft' &&
  submission.values &&
  submission.form &&
  submission.form.fields &&
  submission.form.fields.find(
    f => f.name === (options.lockedByField || LOCKED_BY_FIELD),
  ) &&
  submission.form.fields.find(
    f => f.name === (options.lockedUntilField || LOCKED_UNTIL_FIELD),
  )
    ? true
    : false;

export const isLocked = (submission, options = {}) => {
  if (!isLockable(submission, options)) {
    return false;
  }
  const lockedUntilDate = new Date(
    submission.values[options.lockedUntilField || LOCKED_UNTIL_FIELD],
  ).getTime();
  return lockedUntilDate > 0 && lockedUntilDate > new Date().getTime();
};

export const isLockedByMe = (submission, options = {}) => {
  if (!isLockable(submission, options) || !isLocked(submission, options)) {
    return false;
  }
  return (
    submission.values[options.lockedByField || LOCKED_BY_FIELD] ===
    bundle.identity()
  );
};

export const getLockedBy = (submission, options = {}) => {
  if (!isLockable(submission, options) || !isLocked(submission, options)) {
    return '';
  }
  return submission.values[options.lockedByField || LOCKED_BY_FIELD] || '';
};

export const getTimeLeft = (submission, options = {}) => {
  if (!isLockable(submission, options) || !isLocked(submission, options)) {
    return 0;
  }
  const lockedUntilDate = new Date(
    submission.values[options.lockedUntilField || LOCKED_UNTIL_FIELD],
  ).getTime();
  return lockedUntilDate - new Date().getTime();
};

export const lockSubmission = ({ id, datastore, options = {} }) => {
  return fetchSubmission({
    id,
    datastore: !!datastore,
    include: submissionIncludes,
  }).then(({ submission, error }) => {
    if (error) {
      return { error };
    } else if (!isLockable(submission, options)) {
      return {
        submission,
        error: { message: 'Submission is not lockable.' },
      };
    } else if (
      isLocked(submission, options) &&
      !isLockedByMe(submission, options)
    ) {
      return {
        submission,
        error: { message: 'Submission is locked by another user.' },
      };
    }

    const lockTime = getNumericAttributeValue(
      submission.form,
      options.lockTimeAttribute || LOCK_TIME_ATTRIBUTE,
      LOCK_TIME_DEFAULT_VALUE,
    );

    return updateSubmission({
      id: submission.id,
      include: submissionIncludes,
      values: {
        [options.lockedByField || LOCKED_BY_FIELD]: bundle.identity(),
        [options.lockedUntilField || LOCKED_UNTIL_FIELD]: new Date(
          new Date().getTime() + lockTime * 1000,
        ).toISOString(),
      },
    }).then(response => ({ submission, ...response }));
  });
};

export const unlockSubmission = ({
  id,
  datastore,
  options = {},
  adminLockOverride,
}) => {
  return fetchSubmission({
    id,
    datastore: !!datastore,
    include: submissionIncludes,
  }).then(({ submission, error }) => {
    if (error) {
      return { error };
    } else if (!isLockable(submission, options)) {
      return {
        submission,
        error: { message: 'Submission is not lockable.' },
      };
    } else if (!isLocked(submission, options)) {
      return {
        submission,
        error: { message: 'Submission is not locked.' },
      };
    } else if (!isLockedByMe(submission, options) && !adminLockOverride) {
      return {
        submission,
        error: { message: 'Submission is locked by another user.' },
      };
    }

    return updateSubmission({
      id: submission.id,
      include: submissionIncludes,
      values: {
        [options.lockedByField || LOCKED_BY_FIELD]: '',
        [options.lockedUntilField || LOCKED_UNTIL_FIELD]: '',
      },
    }).then(response => ({ submission, ...response }));
  });
};

export const queryString = ({ review, values }) => {
  const parameters = [];
  if (review === true) {
    parameters.push('review');
  } else if (isString(review)) {
    parameters.push(`review=${encodeURIComponent(review)}`);
  }
  if (isPlainObject(values)) {
    Object.keys(values).forEach(field => {
      parameters.push(
        `${encodeURIComponent(`values[${field}]`)}=${encodeURIComponent(
          values[field],
        )}`,
      );
    });
  }
  return parameters.join('&');
};

export const applyGuard = (func, context, args) =>
  typeof func === 'function' && func.apply(context, args);

const defaultState = {
  pending: true,
  submission: null,
  form: null,
  error: false,
  lock: null,
};

export class CoreFormComponent extends Component {
  constructor(props) {
    super(props);
    this.state = { ...defaultState };
  }

  setStateSafe = (...args) =>
    !this._unmounted ? this.setState(...args) : undefined;

  componentDidMount() {
    if (this.props.submission && this.props.lock) {
      this.obtainLock();
    } else {
      this.fetchData();
    }
  }

  resetComponent() {
    this.closeForm();
    this.setStateSafe({ ...defaultState });
    if (this.props.submission && this.props.lock) {
      this.obtainLock();
    } else {
      this.fetchData();
    }
  }

  componentDidUpdate(prevProps, prevState) {
    // If props changed, reset component
    if (!deepEqual(this.props, prevProps)) {
      if (prevState.lock && prevState.lock.isLockedByMe) {
        this.releaseLock({ state: prevState, props: prevProps }).then(() => {
          this.resetComponent();
        });
      } else {
        this.resetComponent();
      }
    }

    // If pending and submission or form state has just been set, load form
    if (
      this.state.pending &&
      (this.state.submission || this.state.form) &&
      !prevState.submission &&
      !prevState.form
    ) {
      this.loadForm({
        ...this.props,
        // If locking is enabled and form is locked by someone else, open in review mode
        review:
          this.props.review ||
          (this.state.lock && !this.state.lock.isLockedByMe),
      });
    }
    // If pending and error state has just been set, call error callback
    else if (this.state.pending && this.state.error && !prevState.error) {
      if (this.state.error.statusCode === 401) {
        applyGuard(this.props.onUnauthorized || this.props.unauthorized);
      } else if (this.state.error.statusCode === 403) {
        applyGuard(this.props.onForbidden || this.props.forbidden);
      } else if (this.state.error.statusCode === 404) {
        applyGuard(this.props.onNotFound || this.props.onNotFound);
      } else {
        applyGuard(this.props.onError || this.props.error);
      }
    }

    // If locking is turned on and has been initalized
    if (this.state.lock && this.state.lock.init) {
      const lockPromptTime = getNumericAttributeValue(
        this.state.form,
        this.props.lockPromptTimeAttribute || LOCK_PROMPT_TIME_ATTRIBUTE,
        LOCK_PROMPT_TIME_DEFAULT_VALUE,
      );

      // If I obtained the lock, start the poller
      if (this.state.lock.isLockedByMe && !this.state.lock.poller) {
        const lockCheckInterval = getNumericAttributeValue(
          this.state.form,
          this.props.lockCheckIntervalAttribute ||
            LOCK_CHECK_INTERVAL_ATTRIBUTE,
          LOCK_CHECK_INTERVAL_DEFAULT_VALUE,
        );
        this.setStateSafe({
          lock: {
            ...this.state.lock,
            poller: setInterval(() => {
              this.pollSubmission();
            }, lockCheckInterval * 1000),
            isExpiring: false,
            lockLost: false,
          },
        });
        // If form is loaded and is in review mode but should be editable, close and re-load it
        this.form &&
          !this.props.review &&
          this.form.then(form => {
            if (form && form.reviewMode()) {
              this.closeForm();
              this.loadForm(this.props);
            }
          });
      }

      // If lock has been renewed, reset poller
      if (
        this.state.lock.isLockedByMe &&
        this.state.lock.poller &&
        prevState.lock &&
        prevState.lock.isLockedByMe &&
        this.state.lock.timeLeft > prevState.lock.timeLeft
      ) {
        const lockCheckInterval = getNumericAttributeValue(
          this.state.form,
          this.props.lockCheckIntervalAttribute ||
            LOCK_CHECK_INTERVAL_ATTRIBUTE,
          LOCK_CHECK_INTERVAL_DEFAULT_VALUE,
        );

        clearInterval(this.state.lock.poller);
        this.setStateSafe({
          lock: {
            ...this.state.lock,
            poller: setInterval(() => {
              this.pollSubmission();
            }, lockCheckInterval * 1000),
          },
        });
      }

      // If I lost the lock, stop the poller
      if (!this.state.lock.isLockedByMe && this.state.lock.poller) {
        clearInterval(this.state.lock.poller);
        this.setStateSafe({
          lock: {
            ...this.state.lock,
            poller: null,
            isExpiring: false,
            lockLost: true,
          },
        });
      }

      // If remaining lock time is less than lock prompt time, prompt user
      if (
        this.state.lock.isLockedByMe &&
        this.state.lock.timeLeft <= lockPromptTime * 1000 &&
        prevState.lock &&
        prevState.lock.timeLeft > lockPromptTime * 1000
      ) {
        this.setStateSafe({ lock: { ...this.state.lock, isExpiring: true } });
      }
    }

    // If submission is no longer lockable, stop poller
    if (!this.state.lock && prevState.lock && prevState.lock.poller) {
      clearInterval(prevState.lock.poller);
    }
  }

  componentWillUnmount() {
    this._unmounted = true;
    if (this.state.lock) {
      this.releaseLock(undefined, true).then(() => {
        this.closeForm();
      });
    } else {
      this.closeForm();
    }
  }

  fetchData() {
    return this.props.submission
      ? fetchSubmission({
          id: this.props.submission,
          datastore: !!this.props.datastore,
          include: submissionIncludes,
          public: this.props.public,
        }).then(({ submission, error }) => {
          this.setStateSafe({
            submission,
            form: submission ? submission.form : null,
            error,
          });
        })
      : fetchForm({
          datastore: !!this.props.datastore,
          kappSlug: this.props.kapp,
          formSlug: this.props.form,
          include: formIncludes,
          public: this.props.public,
        }).then(({ form, error }) => {
          this.setStateSafe({
            form,
            error,
          });
        });
  }

  pollSubmission() {
    return this.props.submission
      ? fetchSubmission({
          id: this.props.submission,
          datastore: !!this.props.datastore,
          include: submissionIncludes,
        }).then(({ submission, error }) => {
          this.setStateSafe({
            submission,
            form: submission ? submission.form : null,
            error,
            lock: isLockable(submission, this.props)
              ? {
                  ...this.state.lock,
                  isLocked: isLocked(submission, this.props),
                  isLockedByMe: isLockedByMe(submission, this.props),
                  lockedBy: getLockedBy(submission, this.props),
                  timeLeft: getTimeLeft(submission, this.props),
                }
              : null,
          });
        })
      : new Promise(resolve =>
          resolve({
            error: { message: 'Submission Id was not provided to CoreForm.' },
          }),
        );
  }

  obtainLock() {
    return this.props.submission
      ? lockSubmission({
          id: this.props.submission,
          datastore: this.props.datastore,
          options: this.props,
        }).then(({ submission, error }) => {
          if (submission) {
            this.setStateSafe({
              submission,
              form: submission ? submission.form : null,
              lock: isLockable(submission, this.props)
                ? {
                    ...this.state.lock,
                    init: true,
                    isExpiring: false,
                    lockLost: false,
                    isLocked: isLocked(submission, this.props),
                    isLockedByMe: isLockedByMe(submission, this.props),
                    lockedBy: getLockedBy(submission, this.props),
                    timeLeft: getTimeLeft(submission, this.props),
                    lockError: error,
                  }
                : null,
            });
          } else {
            this.setStateSafe({ error });
          }
        })
      : new Promise(resolve =>
          resolve({
            error: { message: 'Submission Id was not provided to CoreForm.' },
          }),
        );
  }

  releaseLock(
    { state = this.state, props = this.props, adminLockOverride = false } = {},
    unmounting,
  ) {
    return this.props.submission
      ? unlockSubmission({
          id: props.submission,
          options: props,
          adminLockOverride,
        }).then((submission, error) => {
          clearInterval(state.lock.poller);
          if (!unmounting) {
            this.setStateSafe({
              submission,
              lock: isLockable(submission, props)
                ? {
                    ...state.lock,
                    poller: null,
                    isExpiring: false,
                    isLocked: isLocked(submission, props),
                    isLockedByMe: isLockedByMe(submission, props),
                    lockedBy: getLockedBy(submission, props),
                    timeLeft: getTimeLeft(submission, props),
                    lockError: error,
                  }
                : null,
            });
          }
        })
      : new Promise(resolve =>
          resolve({
            error: { message: 'Submission Id was not provided to CoreForm.' },
          }),
        );
  }

  getGlobalsPromise() {
    if (!this.globalsPromise) {
      if (typeof this.props.globals === 'function') {
        this.globalsPromise = this.props.globals();
      } else if (this.props.globals instanceof Promise) {
        this.globalsPromise = this.props.globals;
      } else {
        this.globalsPromise = Promise.resolve();
      }
    }
    return this.globalsPromise;
  }

  closeForm() {
    if (this.form) {
      this.form.then(form => form.close());
    }
  }

  loadForm(props) {
    this.setStateSafe({ pending: true, error: null });
    this.form = new Promise(resolve => {
      this.getGlobalsPromise().then(() => {
        K.load({
          path: `${corePath(props)}?${queryString(props)}`,
          container: this.container,
          loaded: form => {
            resolve(form);
            this.setStateSafe({ pending: false, error: null });
            applyGuard(props.onLoaded || props.loaded, undefined, [form]);
          },
          unauthorized: (...args) => {
            this.setStateSafe({ pending: false, error: { statusCode: 401 } });
            applyGuard(
              props.onUnauthorized || props.unauthorized,
              undefined,
              args,
            );
          },
          forbidden: (...args) => {
            this.setStateSafe({ pending: false, error: { statusCode: 403 } });
            applyGuard(props.onForbidden || props.forbidden, undefined, args);
          },
          notFound: (...args) => {
            this.setStateSafe({ pending: false, error: { statusCode: 404 } });
            applyGuard(props.onNotFound || props.notFound, undefined, args);
          },
          error: (...args) => {
            this.setStateSafe({
              pending: false,
              error: this.state.error || {},
            });
            applyGuard(props.onError || props.error, undefined, args);
          },
          created: props.onCreated || props.created,
          updated: props.onUpdated || props.updated,
          completed: props.onCompleted || props.completed,
          originId: props.originId,
          parentId: props.parentId,
          csrfToken: props.csrfToken,
        });
      });
    });
  }

  handleRef = element => {
    this.container = element;
  };

  render() {
    const {
      pendingComponent: Pending = DefaultLoadingComponent,
      unauthorizedComponent: Unauthorized = DefaultErrorComponent,
      forbiddenComponent: Forbidden = DefaultErrorComponent,
      notFoundComponent: NotFound = DefaultErrorComponent,
      unexpectedErrorComponent: Unexpected = DefaultErrorComponent,
      lockMessageComponent: LockMessage = DefaultLockMessage,
      layoutComponent: Layout,
    } = this.props;
    const { init, poller, ...lockProps } = this.state.lock || {};
    const actions = {
      refreshSubmission: () => this.pollSubmission(),
      releaseLock: this.state.lock
        ? adminLockOverride => this.releaseLock({ adminLockOverride })
        : undefined,
      obtainLock: this.state.lock ? () => this.obtainLock() : undefined,
    };
    const lockMessage = (
      <LockMessage lock={init ? lockProps : undefined} actions={actions} />
    );
    const content = (
      <div className="embedded-core-form">
        {!Layout && lockMessage}
        <div
          ref={this.handleRef}
          style={
            this.state.pending || this.state.error ? { display: 'none' } : {}
          }
        />
        {this.state.pending && !this.state.error && <Pending />}
        {this.state.error &&
          (this.state.error.statusCode === 401 ? (
            <Unauthorized message="You are unauthorized" />
          ) : this.state.error.statusCode === 403 ? (
            <Forbidden message="You do not have access" />
          ) : this.state.error.statusCode === 404 ? (
            <NotFound
              message={`${
                this.props.submission ? 'Submission' : 'Form'
              } not found`}
            />
          ) : (
            <Unexpected />
          ))}
      </div>
    );
    return Layout ? (
      <Layout
        submission={this.state.submission}
        form={this.state.form}
        error={this.state.error}
        content={content}
        actions={actions}
        lockMessage={lockMessage}
        lock={init ? lockProps : undefined}
      />
    ) : (
      content
    );
  }
}

const GlobalsCoreFormComponent = props => (
  <GlobalsContext.Consumer>
    {value => <CoreFormComponent {...props} globals={value} />}
  </GlobalsContext.Consumer>
);

export const CoreForm = connect(state => ({
  csrfToken: state.getIn(['session', 'csrfToken']),
}))(GlobalsCoreFormComponent);

const DefaultLoadingComponent = () => (
  <div className="text-center p-3">
    <div>
      <span className="fa fa-spinner fa-spin fa-lg fa-fw" />
    </div>
  </div>
);

const DefaultErrorComponent = ({ message }) => (
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

const DefaultLockMessage = ({ lock, actions }) => {
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

CoreForm.propTypes = {
  /** Code to load prior to loading the form. */
  globals: t.oneOfType([t.func, t.instanceOf(Promise)]),
  /** Id of the submission to load. */
  submission: t.string,
  /** Slug of the form to load if submission id is not provided. */
  formSlug: t.string,
  /** Slug of the kapp which contains the form defined by formSlug. */
  kappSlug: t.string,
  /** Boolean determining if the form defined by formSlug is a datastore form. */
  datastore: t.bool,
  /** Map of field values to pass to the form. */
  values: t.object,
  /** Boolean determining if the form should be opened in review mode. */
  review: t.bool,
  /** Boolean determining if the submission should be locked when opened. */
  lock: t.bool,
  /** Callback function that will execute when the form is loaded. */
  onLoaded: t.func,
  loaded: t.func,
  /** Callback function that will execute when the form returns a 401 error. */
  onUnauthorized: t.func,
  unauthorized: t.func,
  /** Callback function that will execute when the form returns a 403 error. */
  onForbidden: t.func,
  forbidden: t.func,
  /** Callback function that will execute when the form returns a 404 error. */
  onNotFound: t.func,
  notFound: t.func,
  /** Callback function that will execute when the form returns any error. */
  onError: t.func,
  error: t.func,
  /** Callback function that will execute when a submission is created. */
  onCreated: t.func,
  created: t.func,
  /** Callback function that will execute when a submission is updated. */
  onUpdated: t.func,
  updated: t.func,
  /** Callback function that will execute when a submission is completed. */
  onCompleted: t.func,
  completed: t.func,
  /**  */
  originId: t.string,
  parentId: t.string,
  /** Component to display when the form is loading. */
  pendingComponent: t.func,
  /** Component to display when the form returns a 401 error. */
  unauthorizedComponent: t.func,
  /** Component to display when the form returns a 403 error. */
  forbiddenComponent: t.func,
  /** Component to display when the form returns a 404 error. */
  notFoundComponent: t.func,
  /** Component to display when the form returns any other error. */
  unexpectedErrorComponent: t.func,
  /** Component used to display the locking messages. */
  lockMessageComponent: t.func,
  /** Component used to display the entire content of the CoreForm. */
  layoutComponent: t.func,
  /** Name of field which should be used to store the locked by username. */
  lockedByField: t.string,
  /** Name of field which should be used to store the locked until value. */
  lockedUntilField: t.string,
  /** Name of attribute which stores the lock time value in seconds. */
  lockTimeAttribute: t.string,
  /** Name of attribute which stores the lock prompt time value in seconds. */
  lockPromptTimeAttribute: t.string,
  /** Name of attribute which stores the lock check interval value in seconds. */
  lockCheckIntervalAttribute: t.string,
};

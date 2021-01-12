import React, { Component } from 'react';
import t from 'prop-types';
import isPlainObject from 'lodash.isplainobject';
import isString from 'lodash.isstring';
import deepEqual from 'deepequal';
import { Map, get } from 'immutable';
import { connect } from '../../../store';
import { K, bundle } from '../../../helpers';
import { corePath } from '../../../apis/http';
import { fetchSubmission, updateSubmission, fetchForm } from '../../../apis';
import { GlobalsContext } from './globals';
import { ComponentConfigContext } from '../../common/ComponentConfigContext';
import {
  LOCKED_BY_FIELD,
  LOCKED_UNTIL_FIELD,
  LOCK_TIME_ATTRIBUTE,
  LOCK_TIME_DEFAULT_VALUE,
  LOCK_CHECK_INTERVAL_ATTRIBUTE,
  LOCK_CHECK_INTERVAL_DEFAULT_VALUE,
  LOCK_PROMPT_TIME_ATTRIBUTE,
  LOCK_PROMPT_TIME_DEFAULT_VALUE,
  DefaultCoreFormConfig,
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

export const queryString = (
  { review, values },
  { reviewPages, reviewPageIndex },
) => {
  const parameters = [];
  if (!!review) {
    if (typeof reviewPageIndex === 'number') {
      parameters.push(
        `review=${encodeURIComponent(reviewPages[reviewPageIndex])}`,
      );
    } else if (isString(review)) {
      parameters.push(`review=${encodeURIComponent(review)}`);
    } else {
      parameters.push('review');
    }
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
  reviewPageIndex: null,
  reviewPages: [],
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

    // If in review mode and page index changes, close and reload form
    if (
      !!this.props.review &&
      typeof prevState.reviewPageIndex === 'number' &&
      typeof this.state.reviewPageIndex === 'number' &&
      this.state.reviewPageIndex !== prevState.reviewPageIndex
    ) {
      this.closeForm();
      this.loadForm(this.props);
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

  previousReviewPage() {
    this.setStateSafe({
      reviewPageIndex: Math.max(this.state.reviewPageIndex - 1, 0),
    });
  }

  nextReviewPage() {
    this.setStateSafe({
      reviewPageIndex: Math.min(
        this.state.reviewPageIndex + 1,
        Math.max(this.state.reviewPages.length - 1, 0),
      ),
    });
  }

  goToReviewPage(page) {
    this.setStateSafe({
      reviewPageIndex: Math.max(
        Math.min(page, Math.max(this.state.reviewPages.length - 1, 0)),
        0,
      ),
    });
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
          path: `${corePath(props)}?${queryString(props, this.state)}`,
          container: this.container,
          loaded: form => {
            resolve(form);
            const reviewState = !!props.review
              ? {
                  reviewPageIndex: form
                    .displayablePages()
                    .findIndex(
                      currentPage => currentPage === form.page().name(),
                    ),
                  reviewPages: form.displayablePages(),
                }
              : {};
            this.setStateSafe({
              pending: false,
              error: null,
              ...reviewState,
            });
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
      Pending,
      Unauthorized,
      Forbidden,
      NotFound,
      Unexpected,
      LockMessage,
      ReviewPaginationControl,
      Layout,
    } = this.props.components;
    const { init, poller, ...lockProps } = this.state.lock || {};
    const actions = {
      refreshSubmission: () => this.pollSubmission(),
      releaseLock: this.state.lock
        ? adminLockOverride => this.releaseLock({ adminLockOverride })
        : undefined,
      obtainLock: this.state.lock ? () => this.obtainLock() : undefined,
      previousPage:
        !!this.props.review && this.state.reviewPageIndex > 0
          ? () => this.previousReviewPage()
          : undefined,
      nextPage:
        !!this.props.review &&
        this.state.reviewPageIndex < this.state.reviewPages.length - 1
          ? () => this.nextReviewPage()
          : undefined,
      goToPage: !!this.props.review
        ? page => this.goToReviewPage(page)
        : undefined,
    };
    const lockMessage = (
      <LockMessage lock={init ? lockProps : undefined} actions={actions} />
    );
    const reviewPaginationControl =
      !!this.props.review &&
      !this.state.pending &&
      !this.state.error &&
      this.state.reviewPages.length > 1 ? (
        <ReviewPaginationControl
          pages={this.state.reviewPages}
          index={this.state.reviewPageIndex}
          actions={actions}
        />
      ) : null;
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
        {!Layout && reviewPaginationControl}
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
        reviewPaginationControl={reviewPaginationControl}
        lock={init ? lockProps : undefined}
      />
    ) : (
      content
    );
  }
}

const ContextCoreFormComponent = ({ components, ...props }) => {
  // Components passed in via deprecated props
  const deprecatedComponents = {
    Pending: props.pendingComponent,
    Unauthorized: props.unauthorizedComponent,
    Forbidden: props.forbiddenComponent,
    Unexpected: props.unexpectedErrorComponent,
    NotFound: props.notFoundComponent,
    LockMessage: props.lockMessageComponent,
    ReviewPaginationControl: props.reviewPaginationControlComponent,
    Layout: props.layoutComponent,
  };

  return (
    <GlobalsContext.Consumer>
      {globals => (
        <ComponentConfigContext.Consumer>
          {config => (
            <CoreFormComponent
              {...props}
              globals={globals}
              // Override components. Start with RKL defaults, merge in defaults
              // passed into KineticLib, then merge in deprecated components,
              // and lastly merge in components prop.
              components={DefaultCoreFormConfig.merge(
                Map(get(config, 'coreForm', {})),
              )
                .merge(Map(deprecatedComponents).filter(Boolean))
                .merge(Map(components || {}).filter(Boolean))
                .toObject()}
            />
          )}
        </ComponentConfigContext.Consumer>
      )}
    </GlobalsContext.Consumer>
  );
};

export const CoreForm = connect(state => ({
  csrfToken: state.getIn(['session', 'csrfToken']),
}))(ContextCoreFormComponent);

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
  /** Boolean determining if the form should be opened in review mode, or name of the page to open in review mode */
  review: t.oneOfType([t.bool, t.string]),
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
  /** Component to display when the form is loading. (Deprecated: Use components prop.) */
  pendingComponent: t.func,
  /** Component to display when the form returns a 401 error. (Deprecated: Use components prop.) */
  unauthorizedComponent: t.func,
  /** Component to display when the form returns a 403 error. (Deprecated: Use components prop.) */
  forbiddenComponent: t.func,
  /** Component to display when the form returns a 404 error. (Deprecated: Use components prop.) */
  notFoundComponent: t.func,
  /** Component to display when the form returns any other error. (Deprecated: Use components prop.) */
  unexpectedErrorComponent: t.func,
  /** Component used to display the locking messages. (Deprecated: Use components prop.) */
  lockMessageComponent: t.func,
  /** Component used to display the review pagination control. (Deprecated: Use components prop.) */
  reviewPaginationControlComponent: t.func,
  /** Component used to display the entire content of the CoreForm. (Deprecated: Use components prop.) */
  layoutComponent: t.func,
  /** Map of component overrides. */
  components: t.shape({
    /** Override the loading state message. */
    Pending: t.func,
    /** Override the unauthorized error state message. */
    Unauthorized: t.func,
    /** Override the forbidden error state message. */
    Forbidden: t.func,
    /** Override the unexpected error state message. */
    Unexpected: t.func,
    /** Override the not found error state message. */
    NotFound: t.func,
    /** Override the lockMessage component shown when a form is lockable. */
    LockMessage: t.func,
    /** Override the reviewPaginationControl component shown when a form in review has multiple displayable pages. */
    ReviewPaginationControl: t.func,
    /** Override the default form layout. */
    Layout: t.func,
  }),
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

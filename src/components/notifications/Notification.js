import React, { Fragment } from 'react';
import {
  compose,
  withHandlers,
  withProps,
  withState,
  lifecycle,
} from 'recompose';
import { connect } from '../../redux/store';
import { Link } from '@reach/router';
import { Map, Seq } from 'immutable';
import { I18n, refetchTable } from '@kineticdata/react';
import { addToast, addToastAlert } from '@kineticdata/bundle-common';
import { PageTitle } from '../shared/PageTitle';
import { actions } from '../../redux/modules/settingsNotifications';
import { NotificationMenu } from './NotificationMenu';

const fields = {
  Name: {
    required: true,
  },
  Status: {
    required: true,
  },
  Subject: {
    required: values => values.get('Type') === 'Template',
    visible: values => values.get('Type') === 'Template',
  },
  'HTML Content': {
    required: true,
  },
  'Text Content': {
    required: true,
  },
  Type: {
    required: true,
  },
};

const evaluate = (condition, values) =>
  typeof condition === 'boolean'
    ? condition
    : typeof condition === 'function'
      ? condition(values)
      : false;

const isRequired = (name, values) => evaluate(fields[name].required, values);

const isVisible = (name, values) => evaluate(fields[name].visible, values);

const isValid = values =>
  !Object.entries(fields).some(
    ([name, _]) => isRequired(name, values) && !values.get(name),
  );

const NotificationComponent = ({
  submissionId,
  loading,
  submission,
  type,
  title,
  dirty,
  values,
  selection,
  handleFieldChange,
  handleFieldBlur,
  handleSubmit,
  handleVariableSelection,
}) => (
  <div className="page-container page-container--panels">
    <PageTitle
      parts={[`${submissionId ? 'Edit' : 'New'} ${title}`, 'Notifications']}
    />
    <div className="page-panel page-panel--white">
      <div className="page-title">
        <div
          role="navigation"
          aria-label="breadcrumbs"
          className="page-title__breadcrumbs"
        >
          <span className="breadcrumb-item">
            <Link to="../../..">
              <I18n>settings</I18n>
            </Link>
          </span>{' '}
          <span aria-hidden="true">/ </span>
          <span className="breadcrumb-item">
            <Link to={`..`}>
              <I18n>notification {type}</I18n>
            </Link>
          </span>{' '}
          <span aria-hidden="true">/ </span>
          {!loading && (
            <h1>
              {submission ? submission.label : <I18n>{`New ${title}`}</I18n>}
            </h1>
          )}
        </div>
      </div>
      {!loading &&
        values && (
          <form onSubmit={handleSubmit}>
            <Fragment>
              <NotificationMenu
                selection={selection}
                onSelect={handleVariableSelection}
              />
            </Fragment>
            <div className="form-group required">
              <label className="field-label" htmlFor="name">
                <I18n>Name</I18n>
              </label>
              <input
                type="text"
                id="name"
                name="Name"
                onChange={handleFieldChange}
                onBlur={handleFieldBlur}
                value={values.get('Name')}
              />
            </div>

            <div className="radio required">
              <label className="field-label">
                <I18n>Status</I18n>
              </label>
              <label>
                <input
                  type="radio"
                  name="Status"
                  value="Active"
                  onChange={handleFieldChange}
                  onBlur={handleFieldBlur}
                  checked={values.get('Status') === 'Active'}
                />
                Active
              </label>
              <label>
                <input
                  type="radio"
                  name="Status"
                  value="Inactive"
                  onChange={handleFieldChange}
                  onBlur={handleFieldBlur}
                  checked={values.get('Status') === 'Inactive'}
                />
                Inactive
              </label>
            </div>
            {isVisible('Subject', values) && (
              <div className="form-group required">
                <label className="field-label" htmlFor="subject">
                  <I18n>Subject</I18n>
                </label>
                <textarea
                  id="subject"
                  name="Subject"
                  rows="2"
                  onChange={handleFieldChange}
                  onBlur={handleFieldBlur}
                  value={values.get('Subject')}
                />
              </div>
            )}
            <div className="form-group required">
              <label className="field-label" htmlFor="htmlContent">
                <I18n>HTML Content</I18n>
              </label>
              <textarea
                id="htmlContent"
                name="HTML Content"
                rows="8"
                onChange={handleFieldChange}
                onBlur={handleFieldBlur}
                value={values.get('HTML Content')}
              />
            </div>
            <div
              className={`form-group ${
                isRequired('Text Content', values) ? 'required' : ''
              }`}
            >
              <label className="field-label" htmlFor="textContent">
                <I18n>Text Content</I18n>
              </label>
              <textarea
                id="textContent"
                name="Text Content"
                rows="8"
                onChange={handleFieldChange}
                onBlur={handleFieldBlur}
                value={values.get('Text Content')}
              />
            </div>
            <div className="form__footer">
              <div className="form__footer__right">
                <Link
                  to="/settings/notifications"
                  className="btn btn-link mb-0"
                >
                  <I18n>Cancel</I18n>
                </Link>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={!dirty || !isValid(values)}
                >
                  {submission ? (
                    <I18n>Save Changes</I18n>
                  ) : (
                    <I18n>{`Create ${title}`}</I18n>
                  )}
                </button>
              </div>
            </div>
          </form>
        )}
    </div>
  </div>
);

export const mapStateToProps = (state, props) => ({
  submission: state.settingsNotifications.notification,
  type: props.type,
  title: props.type === 'templates' ? 'Template' : 'Snippet',
  loading:
    props.id !== 'new' &&
    !state.settingsNotifications.notification &&
    !state.settingsNotifications.notificationError,
});

export const mapDispatchToProps = {
  fetchNotification: actions.fetchNotificationRequest,
  saveNotification: actions.saveNotificationRequest,
};

export const handleSubmit = props => event => {
  event.preventDefault();
  props.saveNotification({
    id: props.submission ? props.submission.id : undefined,
    values: props.values.toJS(),
    success: () => {
      addToast(
        `${props.title} ${
          props.submission ? 'updated' : 'created'
        } successfully`,
      );
      refetchTable(props.tableKey);
      props.navigate('..');
    },
    failure: error =>
      addToastAlert({ title: 'Save Failed', message: error.message }),
  });
};

export const handleFieldChange = props => event => {
  props.setDirty(true);
  props.setValues(props.values.set(event.target.name, event.target.value));
};

export const handleFieldBlur = props => event => {
  const { name, selectionStart: start, selectionEnd: end } = event.target;
  if (['Subject', 'HTML Content', 'Text Content'].includes(name)) {
    props.setCursorPosition({ name, start, end });
    props.setSelection(props.values.get(name).substring(start, end));
  } else {
    props.setCursorPosition(null);
    props.setSelection(null);
  }
};

export const handleVariableSelection = props => variable => {
  if (props.cursorPosition) {
    const { name, start, end } = props.cursorPosition;
    const value = props.values.get(name);
    const newValue = Seq(value || [])
      .take(start)
      .concat(Seq(variable))
      .concat(Seq(value || []).skip(end))
      .join('');
    props.setValues(props.values.set(name, newValue));
  }
};

export const Notification = compose(
  connect(
    mapStateToProps,
    mapDispatchToProps,
  ),
  withState('dirty', 'setDirty', false),
  withState('values', 'setValues', props =>
    Map(Object.keys(fields).map(field => [field, ''])).set('Type', props.title),
  ),
  withState('cursorPosition', 'setCursorPosition', null),
  withState('selection', 'setSelection', null),
  withProps(props => ({
    submissionId: props.id !== 'new' ? props.id : null,
  })),
  withHandlers({
    handleSubmit,
    handleFieldChange,
    handleFieldBlur,
    handleVariableSelection,
  }),
  lifecycle({
    componentDidMount() {
      this.props.fetchNotification(this.props.id);
    },
    componentDidUpdate(prevProps) {
      if (this.props.id !== prevProps.id) {
        this.props.fetchNotification(this.props.id);
      }
      if (
        this.props.submission &&
        (!prevProps.submission ||
          prevProps.submission.id !== this.props.submission.id)
      ) {
        this.props.setValues(
          Object.keys(fields).reduce(
            (values, field) =>
              values.set(field, this.props.submission.values[field] || ''),
            Map(),
          ),
        );
        this.props.setDirty(false);
      }
    },
  }),
)(NotificationComponent);

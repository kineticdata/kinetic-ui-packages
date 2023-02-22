import React from 'react';
import { connect } from 'react-redux';
import { push } from 'redux-first-history';
import { compose, withHandlers, withState, lifecycle } from 'recompose';
import { parse } from 'query-string';
import { CoreForm, I18n } from '@kineticdata/react';
import { addSuccess, addError } from '@kineticdata/bundle-common';
import { PageTitle } from '../shared/PageTitle';
import {
  selectPrevAndNext,
  selectFormBySlug,
  actions,
} from '../../redux/modules/settingsDatastore';
import { context } from '../../redux/store';

const DatastoreSubmissionComponent = ({
  form,
  showPrevAndNext,
  prevAndNext,
  submissionId,
  handleCreated,
  handleUpdated,
  handleError,
  values,
  submission,
  formKey,
  profile,
}) => (
  <I18n context={`kapps.datastore.forms.${form.slug}`}>
    <div className="page-container">
      <div className="page-panel">
        <PageTitle
          parts={[
            submissionId ? (submission ? submission.handle : '') : 'New Record',
            form && form.name,
            'Datastore',
          ]}
          breadcrumbs={[
            { label: 'Home', to: '/' },
            { label: 'Settings', to: '../../..' },
            { label: 'Datastore Forms', to: '../..' },
            { label: form.name, to: `..` },
          ]}
          title={
            submissionId ? (
              submission ? (
                submission.label
              ) : (
                ''
              )
            ) : (
              <I18n>New Record</I18n>
            )
          }
          actions={[
            ...(submissionId && submission && showPrevAndNext
              ? [
                  {
                    icon: 'caret-left',
                    aria: 'Previous Record',
                    to: prevAndNext.prev || '',
                    disabled: !prevAndNext.prev,
                    className: 'btn-outline-dark',
                  },
                  {
                    icon: 'caret-right',
                    aria: 'Next Record',
                    to: prevAndNext.next || '',
                    disabled: !prevAndNext.next,
                    className: 'btn-outline-dark',
                  },
                ]
              : []),
          ]}
        />
        <div className="form-unstyled mb-5">
          {submissionId ? (
            <CoreForm
              submission={submissionId}
              updated={handleUpdated}
              error={handleError}
            />
          ) : (
            <CoreForm
              key={formKey}
              form={form.slug}
              kapp="datastore"
              onCreated={handleCreated}
              error={handleError}
              values={values}
            />
          )}
        </div>
      </div>
    </div>
  </I18n>
);

const valuesFromQueryParams = queryParams => {
  const params = parse(queryParams);
  return Object.entries(params).reduce((values, [key, value]) => {
    if (key.startsWith('values[')) {
      const vk = key.match(/values\[(.*?)\]/)[1];
      return { ...values, [vk]: value };
    }
    return values;
  }, {});
};

export const getRandomKey = () =>
  Math.floor(Math.random() * (100000 - 100 + 1)) + 100;

export const shouldPrevNextShow = state =>
  state.settingsDatastore.submission !== null &&
  state.settingsDatastore.submissions.size > 0;

export const handleUpdated = props => response => {
  if (props.submissionId) {
    addSuccess(
      `Successfully updated submission (${response.submission.handle})`,
      'Submission Updated!',
    );
    props.navigate('..');
  }
};

export const handleError = props => response => {
  addError(response.error, 'Error');
};

export const handleCreated = props => (response, actions) => {
  addSuccess(
    `Successfully created submission (${response.submission.handle})`,
    'Submission Created!',
  );
  props.setFormKey(getRandomKey());
};

export const mapStateToProps = (state, { id, slug }) => ({
  submissionId: id,
  submission: state.settingsDatastore.submission,
  showPrevAndNext: shouldPrevNextShow(state),
  prevAndNext: selectPrevAndNext(state),
  form: selectFormBySlug(state, slug),
  values: valuesFromQueryParams(state.router.location.search),
  isSmallLayout: state.app.layoutSize === 'small',
  profile: state.app.profile,
});

export const mapDispatchToProps = {
  push,
  fetchSubmission: actions.fetchSubmission,
  resetSubmission: actions.resetSubmission,
};

export const DatastoreSubmission = compose(
  connect(
    mapStateToProps,
    mapDispatchToProps,
    null,
    { context },
  ),
  withState('formKey', 'setFormKey', getRandomKey),
  withHandlers({
    handleUpdated,
    handleCreated,
    handleError,
  }),
  lifecycle({
    componentWillMount() {
      if (this.props.id) {
        this.props.fetchSubmission(this.props.id);
      }
    },
    componentWillReceiveProps(nextProps) {
      if (nextProps.id && this.props.id !== nextProps.id) {
        this.props.fetchSubmission(nextProps.id);
      }
    },
    componentWillUnmount() {
      this.props.resetSubmission();
    },
  }),
)(DatastoreSubmissionComponent);

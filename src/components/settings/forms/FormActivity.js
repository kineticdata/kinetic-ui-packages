import React, { Fragment } from 'react';
import moment from 'moment';
import { compose, lifecycle } from 'recompose';
import {
  ErrorMessage,
  LoadingMessage,
  TimeAgo,
} from '@kineticdata/bundle-common';
import { actions } from '../../../redux/modules/settingsForms';
import { connect } from '../../../redux/store';
import { I18n } from '@kineticdata/react';
import { PageTitle } from '../../shared/PageTitle';

export const FormActivityContainer = ({
  kapp,
  form,
  submission,
  submissionError,
}) => (
  <div className="page-container">
    <div className="page-panel">
      <PageTitle
        parts={[submission && submission.handle, form && form.name, 'Forms']}
        settings
        breadcrumbs={[
          { label: 'Home', to: '/' },
          { label: `${kapp.name} Settings`, to: '../../../..' },
          { label: 'Forms', to: '../../..' },
          { label: form.name, to: '../..' },
        ]}
        title={submission && submission.handle}
      />
      {submissionError ? (
        <ErrorMessage message={submissionError.message} />
      ) : !submission ? (
        <LoadingMessage />
      ) : (
        <div>
          <div className="data-list data-list--fourths">
            <dl>
              <dt>Submission Label</dt>
              <dd>{submission.label}</dd>
            </dl>
            <dl>
              <dt>Submission Id</dt>
              <dd>{submission.id}</dd>
            </dl>
            <dl>
              <dt>Core State</dt>
              <dd>{submission.coreState}</dd>
            </dl>
            <dl>
              <dt>Time to Close</dt>
              <dd>
                {submission.closedAt ? (
                  moment
                    .duration(
                      moment(submission.submittedAt).valueOf() -
                        moment(submission.closedAt).valueOf(),
                    )
                    .humanize()
                ) : (
                  <I18n>Not closed yet</I18n>
                )}
              </dd>
            </dl>
            <dl>
              <dt>Created</dt>
              <dd>
                <TimeAgo timestamp={submission.createdAt} />
                <br />
                <small>
                  <I18n>by</I18n> {submission.createdBy}
                </small>
              </dd>
            </dl>
            <dl>
              <dt>Submitted</dt>
              <dd>
                {submission.submittedAt ? (
                  <Fragment>
                    <TimeAgo timestamp={submission.submittedAt} />
                    <br />
                    <small>
                      <I18n>by</I18n> {submission.submittedBy}
                    </small>
                  </Fragment>
                ) : (
                  <I18n>N/A</I18n>
                )}
              </dd>
            </dl>
            <dl>
              <dt>Updated</dt>
              <dd>
                <TimeAgo timestamp={submission.updatedAt} />
                <br />
                <small>
                  <I18n>by</I18n> {submission.updatedBy}
                </small>
              </dd>
            </dl>
            <dl>
              <dt>Closed</dt>
              <dd>
                {submission.closedAt ? (
                  <Fragment>
                    <TimeAgo timestamp={submission.closedAt} />
                    <br />
                    <small>
                      <I18n>by</I18n> {submission.closedBy}
                    </small>
                  </Fragment>
                ) : (
                  <I18n>N/A</I18n>
                )}
              </dd>
            </dl>
          </div>
          <h3 className="section__title">
            <span className="title">
              <I18n>Fulfillment Process</I18n>
            </span>
          </h3>
          <div className="section__content scroll-wrapper-h">
            {submission.activities.filter(activity => activity.type === 'Task')
              .length > 0 ? (
              <table className="table table-sm table-striped table--settings">
                <thead className="header">
                  <tr>
                    <th scope="col">
                      <I18n>Type</I18n>
                    </th>
                    <th scope="col">
                      <I18n>Label</I18n>
                    </th>
                    <th scope="col">
                      <I18n>Description</I18n>
                    </th>
                    <th scope="col">
                      <I18n>Data</I18n>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {submission.activities
                    .filter(activity => activity.type === 'Task')
                    .map((activity, index) => {
                      const data = activity.data
                        ? JSON.parse(activity.data)
                        : {};
                      return (
                        <tr key={`task-activity-${index}`}>
                          <td>{activity.type}</td>
                          <td>{activity.label}</td>
                          <td>{activity.description}</td>
                          <td>
                            {Object.keys(data).map(key => (
                              <div key={key}>
                                {key}: {data[key]}
                              </div>
                            ))}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            ) : (
              <I18n>There are no fulfillment steps</I18n>
            )}
          </div>
          <h3 className="section__title">
            <span className="title">
              <I18n>Submission Activity</I18n>
            </span>
          </h3>
          <div className="section__content scroll-wrapper-h">
            {submission.activities.filter(activity => activity.type !== 'Task')
              .length > 0 ? (
              <table className="table table-sm table-striped table--settings">
                <thead className="header">
                  <tr>
                    <th scope="col">
                      <I18n>Type</I18n>
                    </th>
                    <th scope="col">
                      <I18n>Label</I18n>
                    </th>
                    <th scope="col">
                      <I18n>Description</I18n>
                    </th>
                    <th scope="col">
                      <I18n>Data</I18n>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {submission.activities
                    .filter(activity => activity.type !== 'Task')
                    .map((activity, index) => {
                      const data = activity.data
                        ? JSON.parse(activity.data)
                        : {};
                      return (
                        <tr key={`activity-${index}`}>
                          <td>{activity.type}</td>
                          <td>{activity.label}</td>
                          <td>{activity.description}</td>
                          <td>
                            {Object.keys(data).map(key => (
                              <div key={key}>
                                {key}: {data[key]}
                              </div>
                            ))}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            ) : (
              <I18n>There is no submission activity</I18n>
            )}
          </div>
          <h3 className="section__title">
            <span className="title">
              <I18n>Values</I18n>
            </span>
          </h3>
          <div className="section__content scroll-wrapper-h">
            <table className="table table-sm table-striped table--settings">
              <thead className="header">
                <tr>
                  <th scope="col">
                    <I18n>Field</I18n>
                  </th>
                  <th scope="col">
                    <I18n>Value</I18n>
                  </th>
                </tr>
              </thead>
              <tbody>
                {submission.form.fields.map(field => (
                  <tr key={field.name}>
                    <td>
                      <I18n>{field.name}</I18n>
                    </td>
                    <td>{submission.values[field.name]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  </div>
);

const mapStateToProps = state => ({
  kapp: state.app.kapp,
  submission: state.settingsForms.submission,
  submissionError: state.settingsForms.submissionError,
});

const mapDispatchToProps = {
  fetchSubmissionRequest: actions.fetchSubmissionRequest,
};

export const FormActivity = compose(
  connect(
    mapStateToProps,
    mapDispatchToProps,
  ),
  lifecycle({
    componentWillMount() {
      this.props.fetchSubmissionRequest({
        id: this.props.id,
      });
    },
  }),
)(FormActivityContainer);

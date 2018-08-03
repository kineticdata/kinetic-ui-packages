import React from 'react';
import { Link } from 'react-router-dom';
import { connect } from 'react-redux';
import { compose, lifecycle, withState, withHandlers } from 'recompose';
import { PageTitle } from 'common';
import {
  Dropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
  Modal,
} from 'reactstrap';
import { actions } from '../../../redux/modules/settingsForms';

export const FormActivityContainer = ({ loading, submission, space }) =>
  !loading && (
    <div>
      {console.log(submission)}
      <PageTitle parts={['Services Settings']} />
      <div className="page-container  page-container--space-settings">
        <div className="page-panel">
          <div className="page-title">
            <div className="page-title__wrapper">
              <h3>
                <Link to="/kapps/services">services</Link> /{` `}
                <Link to="/kapps/services/settings">settings</Link> /{` `}
                <Link to="/kapps/services/settings/forms">forms</Link> /{` `}
              </h3>
              <h1>
                {submission.form.name} ({submission.handle})
              </h1>
            </div>
            {space.attributes
              .filter(attribute => attribute.name === 'Task Server Url')
              .map(attribute => (
                <a
                  href={`${attribute.values[0]}/app/runs?sourceId=${
                    submission.id
                  }`}
                  target="_blank"
                >
                  <button className="btn btn-primary pull-right">
                    <i className="fa fa-sitemap" /> View Runs
                  </button>
                </a>
              ))}
          </div>
          <section>
            <div className="settings-flex">
              <div className="col-sm-6">
                <label>Submission Label</label>
                <p>{submission.label}</p>
              </div>
              <div className="col-sm-6">
                <label>Submission Id</label>
                <p>{submission.id}</p>
              </div>
              <div className="col-sm-6">
                <label>Status</label>
                <p>{submission.coreState}</p>
              </div>
              <div className="col-sm-6">
                <label>Time to Close</label>
                <p>
                  {submission.closedAt
                    ? moment
                        .duration(
                          moment(submission.submittedAt).valueOf() -
                            moment(submission.closedAt).valueOf(),
                        )
                        .humanize()
                    : 'Not closed yet'}
                </p>
              </div>
              <div className="col-sm-6">
                <label>Created</label>
                <p>
                  {moment(submission.createdAt).fromNow()} by{' '}
                  {submission.createdBy}
                </p>
              </div>
              <div className="col-sm-6">
                <label>Submitted</label>
                <p>
                  {moment(submission.submittedAt).fromNow()} by{' '}
                  {submission.submittedBy}
                </p>
              </div>
              <div className="col-sm-6">
                <label>Created</label>
                <p>
                  {moment(submission.updatedAt).fromNow()} by{' '}
                  {submission.updatedBy}
                </p>
              </div>
              <div className="col-sm-6">
                <label>Closed</label>
                <p>
                  {submission.closedAt
                    ? moment(submission.closedAt).fromNow()
                    : 'N/A'}
                </p>
              </div>
            </div>

            <h3>Fulfillment Process</h3>
            {submission.activities.filter(activity => activity.type === 'Task')
              .length > 0 ? (
              <table className="table table-sm table-striped table-datastore table-submissions">
                <thead className="header">
                  <tr>
                    <th>Type</th>
                    <th>Lable</th>
                    <th>Description</th>
                    <th>Data</th>
                  </tr>
                </thead>
                <tbody>
                  {submission.activities
                    .filter(activity => activity.type === 'Task')
                    .map(activity => {
                      const data = JSON.parse(activity.data);
                      return (
                        <tr>
                          <td>{activity.type}</td>
                          <td>{activity.label}</td>
                          <td>{activity.description}</td>
                          <td>
                            {Object.keys(data).map(key => (
                              <div>
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
              'There are no fulfillment steps'
            )}

            <h3>Submission Activity</h3>
            {submission.activities.filter(activity => activity.type !== 'Task')
              .length > 0 ? (
              <table className="table table-sm table-striped table-datastore table-submissions">
                <thead className="header">
                  <tr>
                    <th>Type</th>
                    <th>Lable</th>
                    <th>Description</th>
                    <th>Data</th>
                  </tr>
                </thead>
                <tbody>
                  {submission.activities
                    .filter(activity => activity.type !== 'Task')
                    .map(activity => {
                      const data = JSON.parse(activity.data);
                      return (
                        <tr>
                          <td>{activity.type}</td>
                          <td>{activity.label}</td>
                          <td>{activity.description}</td>
                          <td>
                            {Object.keys(data).map(key => (
                              <div>
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
              'There is no submission activity'
            )}

            <h3>Values</h3>
            <table className="table table-sm table-striped table-datastore table-submissions">
              <thead className="header">
                <tr>
                  <th>Field</th>
                  <th>Value</th>
                </tr>
              </thead>
              <tbody>
                {submission.form.fields.map(field => (
                  <tr>
                    <td>{field.name}</td>
                    <td>{submission.values[field.name]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </div>
      </div>
    </div>
  );

const mapStateToProps = (state, { match: { params } }) => ({
  loading: state.services.settingsForms.submissionLoading,
  submission: state.services.settingsForms.formSubmission,
  space: state.app.space,
  activityLoading: state.services.settingsForms.submissionActivityLoading,
});

const mapDispatchToProps = {
  fetchFormSubmission: actions.fetchFormSubmission,
};

export const FormActivity = compose(
  connect(
    mapStateToProps,
    mapDispatchToProps,
  ),
  lifecycle({
    componentWillMount() {
      this.props.fetchFormSubmission({
        id: this.props.match.params.id,
      });
    },
  }),
)(FormActivityContainer);

import React, { Fragment } from 'react';
import { compose, lifecycle, withProps } from 'recompose';
import { connect } from '../../redux/store';
import { Link } from '@reach/router';
import { refetchActivityFeed } from '@kineticdata/bundle-common';
import { RequestActivity } from '../shared/RequestActivity';
import { PageTitle } from '../shared/PageTitle';
import * as constants from '../../constants';
import { actions as submissionCountActions } from '../../redux/modules/submissionCounts';
import { I18n } from '@kineticdata/react';
import classNames from 'classnames';

const SubmissionCount = props => {
  const count =
    props.counts && props.coreState && props.counts[props.coreState];
  return !count ? (
    ''
  ) : (
    <small className={`badge badge-${props.color} badge-muted`}>
      {count >= 1000 ? '999+' : count}
    </small>
  );
};

export const RequestListComponent = ({
  type,
  appLocation,
  feedKey,
  counts,
  fetchSubmissionCountsRequest,
}) => (
  <Fragment>
    <div className="page-container">
      <div className="page-panel">
        <PageTitle
          parts={['My Requests']}
          breadcrumbs={[
            { label: 'Home', to: '/' },
            type && { label: 'My Requests', to: `${appLocation}/requests` },
          ].filter(Boolean)}
          title={type ? `${type} Requests` : 'All Requests'}
          actions={[
            {
              icon: 'refresh',
              onClick: () => {
                refetchActivityFeed(feedKey);
                fetchSubmissionCountsRequest();
              },
              aria: 'Refresh Requests',
            },
          ]}
        />

        <div className="nav-tabs__side-container">
          <div className="nav nav-tabs">
            <span className="nav-item">
              <Link
                className={classNames('nav-link', { active: !type })}
                to={`${appLocation}/requests`}
              >
                <I18n>All</I18n>
              </Link>
            </span>
            <span className="nav-item">
              <Link
                className={classNames('nav-link', { active: type === 'Open' })}
                to={`${appLocation}/requests/Open`}
              >
                <I18n>Open</I18n>
                <SubmissionCount
                  counts={counts}
                  coreState="Submitted"
                  color="info"
                />
              </Link>
            </span>
            <span className="nav-item">
              <Link
                className={classNames('nav-link', {
                  active: type === 'Closed',
                })}
                to={`${appLocation}/requests/Closed`}
              >
                <I18n>Closed</I18n>
                <SubmissionCount
                  counts={counts}
                  coreState="Closed"
                  color="dark"
                />
              </Link>
            </span>
            <span className="nav-item">
              <Link
                className={classNames('nav-link', { active: type === 'Draft' })}
                to={`${appLocation}/requests/Draft`}
              >
                <I18n>Draft</I18n>
                <SubmissionCount
                  counts={counts}
                  coreState="Draft"
                  color="warning"
                />
              </Link>
            </span>
          </div>

          <div className="cards">
            <RequestActivity type={type} feedKey={feedKey} />
          </div>
        </div>
      </div>
    </div>
  </Fragment>
);

const mapStateToProps = (state, props) => ({
  type: props.type,
  appLocation: state.app.location,
  counts: state.submissionCounts.data,
});

const mapDispatchToProps = {
  fetchSubmissionCountsRequest:
    submissionCountActions.fetchSubmissionCountsRequest,
};

const enhance = compose(
  connect(
    mapStateToProps,
    mapDispatchToProps,
  ),
  withProps(props => ({
    coreState:
      props.type === 'Open' ? constants.CORE_STATE_SUBMITTED : props.type,
  })),
  lifecycle({
    componentDidMount() {
      this.props.fetchSubmissionCountsRequest();
    },
    componentDidUpdate(prevProps) {
      if (this.props.coreState !== prevProps.coreState) {
        this.props.fetchSubmissionCountsRequest();
      }
    },
  }),
);

export const RequestList = enhance(RequestListComponent);

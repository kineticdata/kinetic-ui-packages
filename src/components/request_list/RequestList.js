import React, { Fragment } from 'react';
import { compose, lifecycle, withProps } from 'recompose';
import { connect } from '../../redux/store';
import { refetchActivityFeed } from '@kineticdata/bundle-common';
import { RequestActivity } from '../shared/RequestActivity';
import { PageTitle } from '../shared/PageTitle';
import * as constants from '../../constants';
import { actions as submissionCountActions } from '../../redux/modules/submissionCounts';

export const RequestListComponent = ({
  type,
  appLocation,
  feedKey,
  fetchSubmissionCountsRequest,
}) => (
  <Fragment>
    <div className="page-container">
      <div className="page-panel">
        <PageTitle
          parts={['My Requests']}
          breadcrumbs={[
            { label: 'services', to: appLocation },
            type && { label: 'requests', to: `${appLocation}/requests` },
          ].filter(Boolean)}
          title={type || 'All Requests'}
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
        <div className="cards">
          <RequestActivity type={type} feedKey={feedKey} />
        </div>
      </div>
    </div>
  </Fragment>
);

const mapStateToProps = (state, props) => ({
  type: props.type,
  appLocation: state.app.location,
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
      window.fetchSubmissionCountsRequest = this.props.fetchSubmissionCountsRequest;
    },
    componentDidUpdate(prevProps) {
      if (this.props.coreState !== prevProps.coreState) {
        this.props.fetchSubmissionCountsRequest();
      }
    },
  }),
);

export const RequestList = enhance(RequestListComponent);

import React from 'react';
import { compose, withHandlers, withProps } from 'recompose';
import { connect } from '../../redux/store';
import { ActivityFeed } from '@kineticdata/bundle-common';
import { searchSubmissions, SubmissionSearch } from '@kineticdata/react';
import { getSubmissionPath } from '../../utils';
import * as constants from '../../constants';
import { SurveyCard } from '../shared/SurveyCard';

const emptyStateMessage = () => {
  return {
    title: 'No surveys found.',
    message: '',
  };
};

const buildSearch = (coreState, username) => {
  const searchBuilder = new SubmissionSearch()
    .type(constants.SUBMISSION_FORM_TYPE)
    .coreState(coreState)
    .includes([
      'details',
      'values',
      'form',
      'form.attributes',
      'form.kapp',
      'form.kapp.attributes',
    ])
    .eq(`values[${constants.ASSIGNED_INDIVIDUAL}]`, username)
    .end();

  return searchBuilder.build();
};

const SurveyActivityComponent = props => (
  <ActivityFeed
    feedKey={props.feedKey}
    pageSize={props.pageSize || 10}
    joinByDirection="DESC"
    joinBy="createdAt"
    dataSources={props.dataSources}
    contentProps={{
      hidePaging: props.hidePaging,
      emptyMessage: emptyStateMessage,
    }}
  />
);

export const SurveyActivity = compose(
  connect((state, props) => ({
    kappSlug: state.app.kapp.slug,
    username: state.app.profile.username,
    appLocation: state.app.location,
    coreState: constants.CORE_STATE_DRAFT,
  })),
  withHandlers({
    buildRequestCard: props => record => (
      <SurveyCard
        key={record.id}
        submission={record}
        path={getSubmissionPath(props.appLocation, record, null)}
      />
    ),
  }),
  withProps(props => ({
    // The sources for the data shown in the activity feed
    dataSources: {
      requests: {
        fn: searchSubmissions,
        params: (prevParams, prevResult) =>
          prevParams && prevResult
            ? prevResult.nextPageToken
              ? { ...prevParams, pageToken: prevResult.nextPageToken }
              : null
            : {
                kapp: props.kappSlug,
                limit: props.chunkSize || 25,
                search: buildSearch(props.coreState, props.username),
              },
        transform: result => ({
          data: result.submissions,
          nextPageToken: result.nextPageToken,
        }),
        component: props.buildRequestCard,
      },
    },
  })),
)(SurveyActivityComponent);

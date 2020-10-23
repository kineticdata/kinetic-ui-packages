import React from 'react';
import { connect } from '../../redux/store';
import { compose, withHandlers, withProps } from 'recompose';
import { RequestCard } from '../shared/RequestCard';
import { get } from 'immutable';
import { ActivityFeed, services } from '@kineticdata/bundle-common';
import { searchSubmissions, SubmissionSearch } from '@kineticdata/react';
import * as constants from '../../constants';
import { getSubmissionPath } from '../../utils';

const emptyStateMessage = ({ type }) => {
  switch (type) {
    case 'Draft': {
      return {
        title: 'You have no draft requests.',
        message:
          "Draft services are forms you started but haven't submitted yet.",
      };
    }
    case 'Open': {
      return {
        title: 'You have no open requests.',
        message: 'If you request something, it will show up here.',
      };
    }
    case 'Closed': {
      return {
        title: 'You have no closed requests.',
        message:
          "Closed requests are services you've requested that have been completed or canceled.",
      };
    }
    default: {
      return {
        title: 'No requests found.',
        message: 'Submit a service and it will show up here!',
      };
    }
  }
};

const buildSearch = (coreState, username) => {
  const searchBuilder = new SubmissionSearch()
    .type(constants.SUBMISSION_FORM_TYPE)
    .includes([
      'details',
      'values',
      'form',
      'form.attributes',
      'form.kapp',
      'form.kapp.attributes',
    ]);

  if (coreState === 'Draft') {
    searchBuilder
      .or()
      .eq('createdBy', username)
      .eq(`values[${constants.REQUESTED_BY_FIELD}]`, username)
      .end();
  } else {
    searchBuilder
      .or()
      .eq(`values[${constants.REQUESTED_FOR_FIELD}]`, username)
      .eq(`values[${constants.REQUESTED_BY_FIELD}]`, username)
      .eq('submittedBy', username)
      .eq('createdBy', username)
      .end();
  }
  if (coreState) searchBuilder.coreState(coreState);

  return searchBuilder.build();
};

const RequestActivityComponent = props => (
  <ActivityFeed
    feedKey={props.feedKey}
    pageSize={props.pageSize || 10}
    joinByDirection="DESC"
    joinBy="createdAt"
    options={{ type: props.type }}
    dataSources={{
      ...props.submissionsDataSource,
    }}
    contentProps={{
      hidePaging: props.hidePaging,
      emptyMessage: emptyStateMessage,
    }}
  />
);

export const RequestActivity = get(
  services,
  'RequestActivity',
  compose(
    connect((state, props) => ({
      kappSlug: state.app.kapp.slug,
      username: state.app.profile.username,
      appLocation: state.app.location,
      coreState:
        props.type === 'Draft'
          ? constants.CORE_STATE_DRAFT
          : props.type === 'Open'
            ? constants.CORE_STATE_SUBMITTED
            : props.type === 'Closed'
              ? constants.CORE_STATE_CLOSED
              : null,
    })),
    withHandlers({
      buildRequestCard: props => record => (
        <RequestCard
          key={record.id}
          submission={record}
          path={getSubmissionPath(props.appLocation, record, null, props.type)}
        />
      ),
    }),
    withProps(props => ({
      submissionsDataSource: {
        requests: {
          fn: searchSubmissions,
          params: (prevParams, prevResult) =>
            prevParams && prevResult
              ? prevResult.nextPageToken
                ? { ...prevParams, pageToken: prevResult.nextPageToken }
                : null
              : {
                  kapp: props.kappSlug,
                  limit: props.chunkSize || props.pageSize || 10,
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
  )(get(services, 'RequestActivityComponent', RequestActivityComponent)),
);

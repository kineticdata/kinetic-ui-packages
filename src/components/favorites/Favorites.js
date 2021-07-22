import React, { Fragment } from 'react';
import { connect } from '../../redux/store';
import { compose, lifecycle, withHandlers, withProps } from 'recompose';
import { FavoritesCard } from './FavoritesCard';
import { PageTitle } from '../shared/PageTitle';
import { I18n, fetchForms } from '@kineticdata/react';
import {
  ActivityFeed,
  mountActivityFeed,
  refetchActivityFeed,
  EmptyMessage,
} from '@kineticdata/bundle-common';

const feedKey = 'favorites-feed';

const FavoritesComponent = props => {
  return (
    <Fragment>
      <div className="page-container">
        <div className="page-panel">
          <PageTitle
            parts={['Favorites']}
            breadcrumbs={[{ label: 'services', to: '..' }]}
            title={<I18n>Favorites</I18n>}
            actions={[
              {
                icon: 'refresh',
                onClick: () => {
                  refetchActivityFeed(feedKey);
                },
                aria: 'Refresh Favorites',
              },
            ]}
          />
          <div className="cards">
            {props.favorites && props.favorites.length ? (
              <ActivityFeed
                feedKey={feedKey}
                pageSize={10}
                joinByDirection="ASC"
                joinBy="name"
                dataSources={props.dataSources}
                showCount={true}
              />
            ) : (
              <EmptyMessage title="No forms have been selected as favorites." />
            )}
          </div>
        </div>
      </div>
    </Fragment>
  );
};

const mapStateToProps = (state, props) => ({
  kappSlug: state.app.kapp.slug,
  appLocation: state.app.location,
  favorites: state.app.profile.profileAttributesMap['Services Favorites'],
});

export const Favorites = compose(
  connect(
    mapStateToProps,
    null,
  ),
  withHandlers({
    buildFormCard: props => record => (
      <FavoritesCard
        key={record.slug}
        feedKey={feedKey}
        form={record}
        path={`${props.appLocation}/forms/${record.slug}`}
      />
    ),
    buildQuery: props => () => {
      let q = '';
      props.favorites.map(fs => {
        q += `slug = "${fs}"`;
        if (props.favorites.indexOf(fs) !== props.favorites.length - 1) {
          q += ` OR `;
        }
        return q;
      });
      return q;
    },
  }),
  withProps(props => ({
    // The sources for the favorites data shown in the activity feed
    dataSources: {
      forms: {
        fn: fetchForms,
        params: (prevParams, prevResult) =>
          prevParams && prevResult
            ? prevResult.nextPageToken
              ? { ...prevParams, pageToken: prevResult.nextPageToken }
              : null
            : {
                kappSlug: props.kappSlug,
                include: 'details,categorizations,attributes,kapp',
                limit: props.chunkSize || 25,
                q: props.buildQuery(),
              },
        transform: result => ({
          data: result.forms,
          nextPageToken: result.nextPageToken,
        }),
        component: props.buildFormCard,
      },
    },
  })),
  lifecycle({
    componentDidMount() {
      mountActivityFeed(feedKey);
    },
    componentDidUpdate(prevProps) {
      if (this.props.favorites !== prevProps.favorites) {
        refetchActivityFeed(feedKey);
      }
    },
  }),
)(FavoritesComponent);

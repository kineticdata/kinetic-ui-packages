import React from 'react';
import { connect } from '../../redux/store';
import { compose, lifecycle, withHandlers, withProps } from 'recompose';
// import { ServiceCard } from '../shared/ServiceCard';
import { FavoriteCard } from './FavoritesCard';
import { PageTitle } from '../shared/PageTitle';
import { I18n, fetchForms } from '@kineticdata/react';
import {
  ActivityFeed,
  mountActivityFeed,
  EmptyMessage,
} from '@kineticdata/bundle-common';

const feedKey = 'favorites-feed';

const buildQuery = formList => {
  let q = '';
  formList.map(fs => {
    q += `slug = "${fs}"`;
    if (formList.indexOf(fs) !== formList.length - 1) {
      q += ` OR `;
    }
  });
  return q;
};

const FavoritesComponent = props => {
  return (
    <div>
      <div className="page-container">
        <div className="page-panel">
          <div className="page-panel__header">
            <PageTitle
              parts={['Favorites']}
              breadcrumbs={[{ label: 'services', to: '..' }]}
              title={<I18n>Favorites</I18n>}
            />
          </div>
          <div className="page-panel__body">
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
      </div>
    </div>
  );
};

const mapStateToProps = (state, props) => ({
  kappSlug: state.app.kapp.slug,
  appLocation: state.app.location,
  favorites: state.app.profile.profileAttributesMap['Services Favorites'],
});

const mapDispatchToProps = {};

export const Favorites = compose(
  connect(
    mapStateToProps,
    mapDispatchToProps,
  ),
  withHandlers({
    buildFormCard: props => record => (
      <FavoriteCard
        key={record.slug}
        form={record}
        path={`${props.appLocation}/forms/${record.slug}`}
      />
    ),
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
                q: buildQuery(props.favorites),
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
  }),
)(FavoritesComponent);

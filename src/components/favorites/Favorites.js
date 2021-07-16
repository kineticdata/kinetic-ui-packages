import React from 'react';
import { connect } from '../../redux/store';
import { compose, lifecycle, withHandlers } from 'recompose';
import { ServiceCard } from '../shared/ServiceCard';
import { PageTitle } from '../shared/PageTitle';
import { I18n } from '@kineticdata/react';
import { ActivityFeed, EmptyMessage } from '@kineticdata/bundle-common';
import { actions } from '../../redux/modules/forms';

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
              {!!props.favorites ? (
                <ActivityFeed
                  pageSize={10}
                  joinByDirection="ASC"
                  joinBy="name"
                  dataSources={{
                    forms: {
                      data: props.favorites.toJS(),
                      component: props.buildFormCard,
                      joinBy: 'name',
                    },
                  }}
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
  profileAttributesMap: state.app.profile.profileAttributesMap,
  favorites: state.forms.favorites,
});

const mapDispatchToProps = {
  fetchFavoriteForms: actions.fetchFavoriteFormsRequest,
};

export const Favorites = compose(
  connect(
    mapStateToProps,
    mapDispatchToProps,
  ),
  withHandlers({
    buildFormCard: props => record => (
      <ServiceCard
        key={record.slug}
        form={record}
        path={`${props.appLocation}/forms/${record.slug}`}
      />
    ),
  }),
  lifecycle({
    componentDidMount() {
      this.props.fetchFavoriteForms(
        this.props.profileAttributesMap['Services Favorites'],
      );
    },
  }),
)(FavoritesComponent);

import React from 'react';
import { compose, withHandlers } from 'recompose';
import { connect } from '../../redux/store';
import { Link } from '@reach/router';
import { I18n } from '@kineticdata/react';
import { get } from 'immutable';
import {
  Card,
  CardCol,
  CardRow,
  CardCorner,
  services,
  Utils,
} from '@kineticdata/bundle-common';
import { Form } from '../../models';
import { actions } from '../../redux/modules/forms';

export const ServiceCardComponent = get(services, 'ServiceCard', props => {
  const { path, form, favoritesEnabled, favorites, components = {} } = props;
  return (
    <Card to={path} components={{ Link, ...components }}>
      {favoritesEnabled && (
        <CardCorner
          tag="button"
          icon="fa fa-star"
          active={favorites.includes(form.slug)}
          hover
          onClick={
            favorites.includes(form.slug)
              ? props.handleRemoveFavorite
              : props.handleAddFavorite
          }
          title="Toggle Favorite"
        />
      )}
      <CardCol>
        <CardRow type="title">
          <span
            className={`fa fa-${(
              form.icon ||
              Form(form).icon ||
              'circle'
            ).replace(/^fa-/i, '')} fa-fw`}
          />
          <span>
            <I18n>{form.name}</I18n>
          </span>
        </CardRow>
        <CardRow className="text-muted">
          <I18n
            context={`kapps.${form.kapp && form.kapp.slug}.forms.${form.slug}`}
          >
            {form.description}
          </I18n>
        </CardRow>
      </CardCol>
    </Card>
  );
});

const mapStateToProps = state => ({
  favoritesEnabled: Utils.hasProfileAttributeDefinition(
    state.app.space,
    'Services Favorites',
  ),
  favorites: state.app.profile.profileAttributesMap['Services Favorites'],
});

const mapDispatchToProps = {
  addFavoriteForm: actions.addFavoriteForm,
  removeFavoriteForm: actions.removeFavoriteForm,
};

export const ServiceCard = compose(
  connect(
    mapStateToProps,
    mapDispatchToProps,
  ),
  withHandlers({
    handleAddFavorite: props => e => {
      e.preventDefault();
      props.addFavoriteForm(props.form.slug);
    },
    handleRemoveFavorite: props => e => {
      e.preventDefault();
      props.removeFavoriteForm(props.form.slug);
    },
  }),
)(ServiceCardComponent);

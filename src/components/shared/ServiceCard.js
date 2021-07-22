import React from 'react';
import { compose, withHandlers } from 'recompose';
import { connect } from '../../redux/store';
import { Link } from '@reach/router';
import { I18n } from '@kineticdata/react';
import { get } from 'immutable';
import { Card, CardCol, CardRow, services } from '@kineticdata/bundle-common';
import { Form } from '../../models';
import { actions } from '../../redux/modules/forms';

export const Star = ({ filled }) => (
  <svg height="24" viewBox="0 0 24 24" width="24">
    <path
      fill={filled ? '#095482' : 'none'}
      stroke={filled ? '#095482' : 'black'}
      strokeWidth="1.5"
      d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
    />
  </svg>
);

export const ServiceCardComponent = get(services, 'ServiceCard', props => {
  const { path, form, favorites, components = {} } = props;
  return (
    <Card
      to={path}
      bar="left"
      barSize="xs"
      components={{ Link, ...components }}
    >
      <CardCol>
        <CardRow type="title">
          <span
            className={`fa fa-${(
              form.icon ||
              Form(form).icon ||
              'circle'
            ).replace(/^fa-/i, '')} fa-fw fa-rounded`}
          />
          <span>
            <I18n>{form.name}</I18n>
          </span>
          <span
            onClick={
              favorites.includes(form.slug)
                ? props.handleRemoveFavorite
                : props.handleAddFavorite
            }
            className="toggle"
          >
            <Star filled={favorites.includes(form.slug)} />
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

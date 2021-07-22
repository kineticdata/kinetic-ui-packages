import React from 'react';
import { compose, withHandlers } from 'recompose';
import { connect } from '../../redux/store';
import { Link } from '@reach/router';
import { I18n } from '@kineticdata/react';
import { get } from 'immutable';
import { Card, CardCol, CardRow, services } from '@kineticdata/bundle-common';
import { Form } from '../../models';
import { actions } from '../../redux/modules/forms';

export const FavoritesCardComponent = get(services, 'ServiceCard', props => {
  const { path, form, components = {} } = props;
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
            onClick={props.handleRemoveFavorite}
            className="toggle fa fa-fw fa-trash"
          />
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
  removeFavoriteForm: actions.removeFavoriteForm,
};

export const FavoritesCard = compose(
  connect(
    mapStateToProps,
    mapDispatchToProps,
  ),
  withHandlers({
    handleRemoveFavorite: props => e => {
      e.preventDefault();
      props.removeFavoriteForm(props.form.slug);
    },
  }),
)(FavoritesCardComponent);

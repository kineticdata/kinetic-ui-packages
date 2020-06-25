import React from 'react';
import { Link } from '@reach/router';
import { I18n } from '@kineticdata/react';
import { get } from 'immutable';
import { Card, CardCol, CardRow, services } from '@kineticdata/bundle-common';

export const CategoryCard = get(services, 'CategoryCard', props => (
  <Card
    to={props.path}
    bar="left"
    barSize="sm"
    barIcon={props.category.icon}
    components={{ Link }}
  >
    <CardCol middle={true}>
      <CardRow type="title">{props.category.name}</CardRow>
      <CardRow className="text-muted">{props.category.description}</CardRow>
      {props.countOfMatchingForms > 0 && (
        <CardRow>
          <small>
            {props.countOfMatchingForms} <I18n>Services</I18n>
          </small>
        </CardRow>
      )}
    </CardCol>
  </Card>
));

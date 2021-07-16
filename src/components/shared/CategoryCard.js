import React from 'react';
import { Link } from '@reach/router';
import { I18n } from '@kineticdata/react';
import { get } from 'immutable';
import { Card, CardCol, CardRow, services } from '@kineticdata/bundle-common';

export const CategoryCard = get(services, 'CategoryCard', props => (
  <Card to={props.path} components={{ Link, ...(props.components || {}) }}>
    <CardRow>
      <CardCol type={['prepend', 'icon']}>
        <span className={`fa fa-fw fa-${props.category.icon} text-muted`} />
      </CardCol>
      <CardCol>
        <CardRow type="subtitle">{props.category.name}</CardRow>
        {props.countOfMatchingForms > 0 && (
          <CardRow>
            <small className="text-muted">
              {props.countOfMatchingForms} <I18n>Services</I18n>
            </small>
          </CardRow>
        )}
      </CardCol>
    </CardRow>
  </Card>
));

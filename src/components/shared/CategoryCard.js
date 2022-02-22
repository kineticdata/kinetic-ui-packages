import React from 'react';
import { Link } from '@reach/router';
import { I18n } from '@kineticdata/react';
import { get } from 'immutable';
import { Card, CardCol, CardRow, services } from '@kineticdata/bundle-common';

export const CategoryCard = get(
  services,
  'CategoryCard',
  ({ category, path, countOfMatchingForms, components, ...props }) => (
    <Card
      color="dark"
      {...props}
      to={path}
      components={{ Link, ...(components || {}) }}
    >
      <CardRow>
        <CardCol type={['prepend', 'icon']}>
          <span className={`fa fa-fw fa-${category.icon} text-muted`} />
        </CardCol>
        <CardCol>
          <CardRow type="subtitle">{category.name}</CardRow>
          {countOfMatchingForms > 0 && (
            <CardRow>
              <small className="text-muted">
                {countOfMatchingForms} <I18n>Services</I18n>
              </small>
            </CardRow>
          )}
        </CardCol>
      </CardRow>
    </Card>
  ),
);

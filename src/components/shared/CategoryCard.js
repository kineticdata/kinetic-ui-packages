import React from 'react';
import { Link } from '@reach/router';
import { I18n } from '@kineticdata/react';

export const CategoryCard = props => (
  <Link to={props.path} className="card card--left-bar">
    <div className="card__bar card__bar--sm">
      <div className="card__bar-icon">
        <span
          className={`fa fa-${(props.category.icon || 'circle').replace(
            /^fa-/i,
            '',
          )} fa-fw`}
        />
      </div>
    </div>
    <div className="card__col card__col--middle">
      <div className="card__row-title">
        <I18n>{props.category.name}</I18n>
      </div>
      <div className="card__row text-muted">
        <I18n>{props.category.description}</I18n>
      </div>
      {props.countOfMatchingForms > 0 && (
        <div className="card__row">
          <small>
            {props.countOfMatchingForms} <I18n>Services</I18n>
          </small>
        </div>
      )}
    </div>
  </Link>
);

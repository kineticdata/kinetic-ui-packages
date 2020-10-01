import React from 'react';
import { Link } from '@reach/router';
import { I18n } from '@kineticdata/react';

export const ServiceCard = ({ path, form }) => (
  <I18n context={`kapps.${form.kapp && form.kapp.slug}.forms.${form.slug}`}>
    <Link to={path} className="card card--left-bar">
      <div className="card__bar card__bar--xs" />
      <div className="card__col card__col--middle">
        <div className="card__row-title">
          <span
            className={`fa fa-${(form.icon || 'circle').replace(
              /^fa-/i,
              '',
            )} fa-fw`}
          />
          <span>
            <I18n>{form.name}</I18n>
          </span>
        </div>
        <div className="card__row text-muted">
          <I18n>{form.description}</I18n>
        </div>
      </div>
    </Link>
  </I18n>
);

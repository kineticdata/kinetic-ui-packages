import React, { Fragment } from 'react';
import { Link } from '@reach/router';
import { ServiceCard } from '../shared/ServiceCard';
import { CategoryCard } from '../shared/CategoryCard';
import { I18n } from '@kineticdata/react';
import { PageTitle } from '../shared/PageTitle';

export const Category = ({ category }) => (
  <Fragment>
    <PageTitle parts={[category.name, 'Categories']} />
    <div className="page-container page-container--color-bar">
      <div className="page-panel">
        <div className="page-title">
          <div
            role="navigation"
            aria-label="breadcrumbs"
            className="page-title__breadcrumbs"
          >
            <span className="breadcrumb-item">
              <Link to="../..">
                <I18n>services</I18n>
              </Link>{' '}
              /{' '}
              <Link to="..">
                <I18n>categories</I18n>
              </Link>{' '}
              /{' '}
              {category
                .getTrail()
                .skipLast(1)
                .map(ancestorCategory => (
                  <Fragment key={ancestorCategory.slug}>
                    <Link to={`../${ancestorCategory.slug}`}>
                      <I18n>{ancestorCategory.name}</I18n>
                    </Link>{' '}
                    /{' '}
                  </Fragment>
                ))}
            </span>
            <h1>
              <I18n>{category.name}</I18n>
            </h1>
          </div>
        </div>
        {category.hasChildren() && (
          <section>
            <div className="section__title">
              <I18n>Subcategories</I18n>
            </div>
            <div className="cards__wrapper cards__wrapper--thirds">
              {category
                .getChildren()
                .map(childCategory => (
                  <CategoryCard
                    key={childCategory.slug}
                    category={childCategory}
                    path={`../${childCategory.slug}`}
                    countOfMatchingForms={childCategory.getTotalFormCount()}
                  />
                ))}
            </div>
          </section>
        )}
        <section>
          <div className="section__title">
            <I18n>Services</I18n>
          </div>
          <div className="cards__wrapper cards__wrapper--seconds">
            {category.forms
              .sort((a, b) => a.name.localeCompare(b.name))
              .map(form => ({
                form,
                path: form.slug,
                key: form.slug,
              }))
              .map(props => <ServiceCard {...props} />)}
          </div>
        </section>
      </div>
    </div>
  </Fragment>
);

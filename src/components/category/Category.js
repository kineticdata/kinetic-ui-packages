import React, { Fragment } from 'react';
import { ServiceCard } from '../shared/ServiceCard';
import { CategoryCard } from '../shared/CategoryCard';
import { I18n } from '@kineticdata/react';
import { PageTitle } from '../shared/PageTitle';

export const Category = ({ category }) => (
  <Fragment>
    <div className="page-container">
      <div className="page-panel">
        <div className="page-panel__header">
          <PageTitle
            parts={[category.name, 'Categories']}
            breadcrumbs={[
              { label: 'services', to: '../..' },
              { label: 'categories', to: '..' },
              ...category
                .getTrail()
                .skipLast(1)
                .map(ancestorCategory => ({
                  label: ancestorCategory.name,
                  to: `../${ancestorCategory.slug}`,
                })),
            ]}
            title={category.name}
          />
        </div>
        <div className="page-panel__body">
          {category.hasChildren() && (
            <section>
              <div className="section__title">
                <I18n>Subcategories</I18n>
              </div>
              <div className="cards cards--thirds">
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
            <div className="cards">
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
    </div>
  </Fragment>
);

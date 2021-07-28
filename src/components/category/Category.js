import React, { Fragment } from 'react';
import { connect } from '../../redux/store';
import { ServiceCard } from '../shared/ServiceCard';
import { CategoryCard } from '../shared/CategoryCard';
import { I18n } from '@kineticdata/react';
import { PageTitle } from '../shared/PageTitle';
import { EmptyMessage } from '@kineticdata/bundle-common';
import classNames from 'classnames';

const CategoryComponent = ({
  category,
  subcategories,
  services,
  appLocation,
  layoutSize,
}) => (
  <Fragment>
    <div className="page-container">
      <div className="page-panel">
        <PageTitle
          parts={[category.name, 'Categories']}
          breadcrumbs={[
            { label: 'Home', to: '/' },
            {
              label: 'Service Catalog',
              to: `${appLocation}/categories`,
            },
            ...category
              .getTrail()
              .skipLast(1)
              .map(ancestorCategory => ({
                label: ancestorCategory.name,
                to: `${appLocation}/categories/${ancestorCategory.slug}`,
              })),
          ]}
          title={category.name}
        />

        <div className="column-container">
          {subcategories &&
            subcategories.size > 0 && (
              <section
                className={classNames('column-panel column-panel--one-third', {
                  'order-lg-1': services && services.size > 0,
                })}
              >
                {services &&
                  services.size > 0 && (
                    <div className="section__title">
                      <span className="title">
                        <I18n>Subcategories</I18n>
                      </span>
                    </div>
                  )}
                <div
                  className={classNames('cards', {
                    'cards--thirds': !services || services.size === 0,
                  })}
                >
                  {category
                    .getChildren()
                    .filterNot(c => c.isEmpty())
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

          {((services && services.size > 0) ||
            !subcategories ||
            subcategories.size === 0) && (
            <section
              className={classNames('column-panel column-panel--two-thirds', {
                // 'column-panel': subcategories && subcategories.size > 0,
              })}
            >
              <div className="section__title">
                <span className="title">
                  <I18n>Services</I18n>
                </span>
              </div>
              <div className="cards">
                {services
                  .map(form => ({
                    form,
                    path: form.slug,
                    key: form.slug,
                  }))
                  .map(props => <ServiceCard {...props} />)}
                {category.formCount === 0 && (
                  <EmptyMessage title="There are no services in this category." />
                )}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  </Fragment>
);

const mapStateToProps = (state, props) => {
  const category = state.servicesApp.categoryGetter(props.categorySlug);
  return {
    category,
    subcategories: category
      ? category.getChildren().filterNot(c => c.isEmpty())
      : null,
    services: category
      ? category.forms.sort((a, b) => a.name.localeCompare(b.name))
      : null,
    appLocation: state.app.location,
    layoutSize: state.app.layoutSize,
  };
};

export const Category = connect(mapStateToProps)(CategoryComponent);

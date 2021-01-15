import React, { Fragment } from 'react';
import { connect } from '../../redux/store';
import { CategoryCard } from '../shared/CategoryCard';
import { PageTitle } from '../shared/PageTitle';

const CategoryListComponent = ({ categories }) => (
  <Fragment>
    <div className="page-container">
      <div className="page-panel">
        <div className="page-panel__header">
          <PageTitle
            parts={['Categories']}
            breadcrumbs={[{ label: 'services', to: '..' }]}
            title="All Categories"
          />
        </div>
        <div className="page-panel__body">
          <div className="cards cards--thirds">
            {categories
              .filter(category => category.slug !== 'home-page-services')
              .map(category => (
                <CategoryCard
                  key={category.slug}
                  category={category}
                  path={category.slug}
                  countOfMatchingForms={category.getTotalFormCount()}
                />
              ))}
          </div>
        </div>
      </div>
    </div>
  </Fragment>
);

const mapStateToProps = state => ({
  categories: state.servicesApp.categories,
});

export const CategoryList = connect(mapStateToProps)(CategoryListComponent);

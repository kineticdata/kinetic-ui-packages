import React, { Fragment } from 'react';
import { compose } from 'recompose';
import { connect } from '../../redux/store';
import { Link } from '@reach/router';
import {
  Card,
  CardCol,
  CardRow,
  selectCurrentKapp,
} from '@kineticdata/bundle-common';
import { CatalogSearchContainer } from '../shared/CatalogSearchContainer';
import { CategoryCard } from '../shared/CategoryCard';
import { ServiceCard } from '../shared/ServiceCard';
import { RequestActivity } from '../shared/RequestActivity';
import { PageTitle } from '../shared/PageTitle';
import { I18n } from '@kineticdata/react';

const CatalogComponent = ({
  navigate,
  kapp,
  forms,
  featuredServices,
  homePageMode,
  homePageItems,
  appLocation,
}) => {
  return (
    <Fragment>
      <div className="page-container">
        <div className="page-panel">
          <div className="page-panel__header">
            <PageTitle
              center={true}
              container={true}
              title="Welcome, how can we help?"
            />
            <div className="container search-box">
              <CatalogSearchContainer onSearch={q => navigate(`search/${q}`)} />
            </div>
          </div>
          <div className="page-panel__body">
            {featuredServices &&
              featuredServices.allForms &&
              featuredServices.allForms.size > 0 && (
                <div className="cards cards--seconds">
                  {featuredServices.allForms.map(form => (
                    <Card
                      key={form.slug}
                      className="p-4"
                      to={`forms/${form.slug}`}
                      color={form.featuredColor}
                      components={{ Link }}
                    >
                      <CardRow>
                        <CardRow type="prepend">
                          <span className={`fa fa-${form.icon} fa-4x mr-4`} />
                        </CardRow>
                        <CardCol>
                          <CardRow type="title">{form.name}</CardRow>
                          <CardRow>{form.description}</CardRow>
                        </CardCol>
                      </CardRow>
                    </Card>
                  ))}
                </div>
              )}

            <div className="column-container">
              <div className="column-panel column-panel--two-thirds">
                <div className="nav nav-tabs mb-3">
                  <span className="nav-item">
                    <span className="nav-link active h5 m-0">
                      <I18n>Recent Requests</I18n>
                    </span>
                  </span>
                  <div className="ml-auto d-flex align-items-center">
                    <Link className="btn btn-link" to="requests">
                      <I18n>View All</I18n>
                    </Link>
                  </div>
                </div>
                <div className="cards">
                  <RequestActivity pageSize={5} hidePaging={true} />
                </div>
              </div>
              <div className="column-panel column-panel--thirds">
                <div className="nav nav-tabs mb-3">
                  <span className="nav-item">
                    <span className="nav-link active h5 m-0">
                      <I18n>{homePageMode}</I18n>
                    </span>
                  </span>
                  <div className="ml-auto d-flex align-items-center">
                    <Link
                      className="btn btn-link"
                      to={
                        homePageMode === 'Categories' ? 'categories' : 'forms'
                      }
                    >
                      <I18n>View All</I18n>
                    </Link>
                  </div>
                </div>
                <div className="cards">
                  {homePageItems.map(
                    item =>
                      homePageMode === 'Categories' ? (
                        <CategoryCard
                          key={item.slug}
                          category={item}
                          path={`categories/${item.slug}`}
                          countOfMatchingForms={item.getTotalFormCount()}
                        />
                      ) : (
                        <ServiceCard
                          key={item.slug}
                          form={item}
                          path={`forms/${item.slug}`}
                        />
                      ),
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Fragment>
  );
};

const mapStateToProps = state => ({
  kapp: selectCurrentKapp(state),
  forms: state.forms.data,
  featuredServices: state.servicesApp.categoryGetter('featured-services'),
  appLocation: state.app.location,
});

export const Catalog = compose(connect(mapStateToProps))(CatalogComponent);

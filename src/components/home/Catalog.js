import React, { Fragment } from 'react';
import { Link } from '@reach/router';
import { CatalogSearchContainer } from '../shared/CatalogSearchContainer';
import { CategoryCard } from '../shared/CategoryCard';
import { ServiceCard } from '../shared/ServiceCard';
import { RequestCard } from '../shared/RequestCard';
import { PageTitle } from '../shared/PageTitle';
import { StateListWrapper } from '@kineticdata/bundle-common';
import { getSubmissionPath } from '../../utils';
import { I18n } from '@kineticdata/react';

export const Catalog = ({
  navigate,
  kapp,
  forms,
  submissions,
  submissionsError,
  featuredServices,
  homePageMode,
  homePageItems,
  fetchSubmissions,
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
                    <Link
                      to={`forms/${form.slug}`}
                      className={`card card--${form.featuredColor}`}
                      key={form.slug}
                    >
                      <div className="card__col">
                        <div className="card__row p-4">
                          <span className={`fa fa-${form.icon} fa-4x mr-5`} />
                          <div className="card__col">
                            <div className="card__row-title">{form.name}</div>
                            <div className="card__row">{form.description}</div>
                          </div>
                        </div>
                      </div>
                    </Link>
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
                  <StateListWrapper
                    data={submissions}
                    error={submissionsError}
                    emptyTitle="You have no requests yet"
                    emptyMessage="As you request new services, they’ll appear here"
                  >
                    {data =>
                      data
                        .take(5)
                        .map(submission => ({
                          submission,
                          forms,
                          key: submission.id,
                          path: getSubmissionPath(appLocation, submission),
                          deleteCallback: fetchSubmissions,
                        }))
                        .map(props => <RequestCard {...props} />)
                    }
                  </StateListWrapper>
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

import React, { Fragment } from 'react';
import { StateListWrapper } from '@kineticdata/bundle-common';
import { ServiceCard } from '../shared/ServiceCard';
import { PageTitle } from '../shared/PageTitle';
import { CatalogSearchContainer } from '../shared/CatalogSearchContainer';
import { I18n } from '@kineticdata/react';

export const CatalogSearchResults = ({
  navigate,
  query,
  error,
  forms,
  appLocation,
  paging,
  hasNextPage,
  hasPreviousPage,
  pageIndexStart,
  pageIndexEnd,
  loadPreviousHandler,
  loadNextHandler,
  clientSideSearch,
}) => (
  <div>
    <div className="page-container">
      <div className="page-panel">
        <div className="page-panel__header">
          <PageTitle
            parts={[query, 'Search']}
            breadcrumbs={[{ label: 'services', to: `..${query ? '/..' : ''}` }]}
            title={
              <>
                <I18n>Search Results</I18n>
                {query && <small className="ml-2">({query})</small>}
              </>
            }
          />
          <div className="search-box">
            <CatalogSearchContainer
              onSearch={q => navigate(`${query ? '../' : ''}${q}`)}
            />
          </div>
        </div>
        <div className="page-panel__body">
          <div className="search-results">
            {!clientSideSearch && (
              <div className="mb-4 text-info">
                <em>
                  <I18n>Searching by name and keywords only.</I18n>
                </em>
              </div>
            )}
            <StateListWrapper
              data={clientSideSearch ? clientSideSearch.data : forms}
              error={error}
              loadingTitle="Searching"
              emptyTitle="No results found"
              emptyMessage="Make sure words are spelled correctly, use less specific or different keywords"
            >
              {data => (
                <Fragment>
                  <div>
                    <ul className="cards">
                      {data.map(form => (
                        <li key={form.slug}>
                          <ServiceCard
                            path={`${appLocation}/forms/${form.slug}`}
                            form={form}
                          />
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="pagination-bar">
                    <I18n
                      render={translate => (
                        <button
                          className="btn btn-icon"
                          onClick={loadPreviousHandler}
                          disabled={paging || !hasPreviousPage}
                          title={translate('Previous Page')}
                        >
                          <span className="icon">
                            <span className="fa fa-fw fa-caret-left" />
                          </span>
                        </button>
                      )}
                    />
                    <small>
                      {paging ? (
                        <span className="fa fa-spinner fa-spin" />
                      ) : (
                        <strong>{`${pageIndexStart}-${pageIndexEnd}`}</strong>
                      )}
                    </small>
                    <I18n
                      render={translate => (
                        <button
                          className="btn btn-icon"
                          onClick={loadNextHandler}
                          disabled={paging || !hasNextPage}
                          title={translate('Next Page')}
                        >
                          <span className="icon">
                            <span className="fa fa-fw fa-caret-right" />
                          </span>
                        </button>
                      )}
                    />
                  </div>
                </Fragment>
              )}
            </StateListWrapper>
          </div>
        </div>
      </div>
    </div>
  </div>
);

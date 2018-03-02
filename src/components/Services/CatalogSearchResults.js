import React from 'react';
import { KappLink as Link } from 'common';
import { ServiceCard } from '../ServiceCard';
import { CatalogSearchContainer } from './CatalogSearchContainer';
import { PageTitle } from '../Shared/PageTitle';

export const CatalogSearchResults = ({ query, forms }) => (
  <div>
    <PageTitle parts={[`Search: ${query}`]} />
    <div className="services-bar">
      <span className="bordercolor" />
    </div>

    <div className="search-results-container container">
      <div className="page-title-wrapper">
        <div className="page-title">
          <h3>
            <Link to="/">services</Link> / search results
          </h3>
          <h1>{query}</h1>
        </div>
      </div>
      <div className="search-results-wrapper">
        <div className="select">
          <CatalogSearchContainer />
        </div>
        <div className="search-results-list">
          <ul>
            {forms.map(form => (
              <li key={form.slug}>
                <ServiceCard path={`/forms/${form.slug}`} form={form} />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  </div>
);

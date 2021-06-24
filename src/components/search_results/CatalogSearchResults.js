import React from 'react';
import { connect } from '../../redux/store';
import { compose, withHandlers, withProps } from 'recompose';
import { ServiceCard } from '../shared/ServiceCard';
import { PageTitle } from '../shared/PageTitle';
import { CatalogSearchContainer } from '../shared/CatalogSearchContainer';
import { I18n, fetchForms } from '@kineticdata/react';
import { ActivityFeed, EmptyMessage } from '@kineticdata/bundle-common';
import {
  SUBMISSION_FORM_STATUSES,
  SUBMISSION_FORM_TYPES,
} from '../../constants';

// Available search fields: attributes[*], category, createdAt, createdBy,
// description, name, slug, status, type, updatedAt, updatedBy
const SEARCH_FIELDS = ['name', 'description', 'attributes[Keyword]'];

const CatalogSearchResultsComponent = props => (
  <div>
    <div className="page-container">
      <div className="page-panel">
        <div className="page-panel__header">
          <PageTitle
            parts={[props.query, 'Search']}
            breadcrumbs={[
              { label: 'services', to: `..${props.query ? '/..' : ''}` },
            ]}
            title={
              <>
                <I18n>Search Results</I18n>
                {props.query && <small className="ml-2">({props.query})</small>}
              </>
            }
          />
          <div className="search-box">
            <CatalogSearchContainer
              onSearch={q => props.navigate(`${props.query ? '../' : ''}${q}`)}
            />
          </div>
        </div>
        <div className="page-panel__body">
          <div className="cards">
            {!!props.query ? (
              <ActivityFeed
                pageSize={10}
                joinByDirection="ASC"
                joinBy="name"
                options={{ query: props.query }}
                dataSources={{
                  ...props.formsDataSource,
                }}
                contentProps={{
                  emptyMessage: {
                    title: 'No forms found.',
                    message:
                      'Make sure words are spelled correctly or use a less specific search term.',
                  },
                }}
                showCount={true}
              />
            ) : (
              <EmptyMessage title="Enter a search term to find matching forms by name, description, or keyword." />
            )}
          </div>
        </div>
      </div>
    </div>
  </div>
);

export const CatalogSearchResults = compose(
  connect((state, props) => ({
    kappSlug: state.app.kapp.slug,
    appLocation: state.app.location,
  })),
  withHandlers({
    buildFormCard: props => record => (
      <ServiceCard
        key={record.slug}
        form={record}
        path={`${props.appLocation}/forms/${record.slug}`}
      />
    ),
  }),
  withProps(props => ({
    formsDataSource: {
      forms: {
        fn: fetchForms,
        params: (prevParams, prevResult, options) =>
          prevParams && prevResult
            ? prevResult.nextPageToken
              ? { ...prevParams, pageToken: prevResult.nextPageToken }
              : null
            : {
                kappSlug: props.kappSlug,
                q: `type IN (${SUBMISSION_FORM_TYPES.map(
                  t => `"${t}"`,
                )}) AND status IN (${SUBMISSION_FORM_STATUSES.map(
                  s => `"${s}"`,
                )}) AND (${SEARCH_FIELDS.map(
                  f => `${f} *=* "${options.query}"`,
                ).join(' OR ')})`,
                include: 'details,categorizations,attributesMap,kapp',
                limit: 50,
              },
        transform: result => ({
          data: result.forms,
          nextPageToken: result.nextPageToken,
        }),
        component: props.buildFormCard,
      },
    },
  })),
)(CatalogSearchResultsComponent);

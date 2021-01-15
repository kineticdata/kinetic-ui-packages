import React, { Fragment } from 'react';
import { connect } from '../../redux/store';
import { compose, withHandlers, withProps } from 'recompose';
import { ServiceCard } from '../shared/ServiceCard';
import { PageTitle } from '../shared/PageTitle';
import { ActivityFeed } from '@kineticdata/bundle-common';
import { fetchForms } from '@kineticdata/react';
import {
  SUBMISSION_FORM_STATUSES,
  SUBMISSION_FORM_TYPES,
} from '../../constants';

const FormListComponent = props => (
  <Fragment>
    <div className="page-container">
      <div className="page-panel">
        <div className="page-panel__header">
          <PageTitle
            parts={['Forms']}
            breadcrumbs={[{ label: 'services', to: '..' }]}
            title="All Forms"
          />
        </div>
        <div className="page-panel__body">
          <div className="cards">
            <ActivityFeed
              pageSize={10}
              joinByDirection="ASC"
              joinBy="name"
              options={{ query: props.query }}
              dataSources={{
                ...props.formsDataSource,
              }}
              contentProps={{
                emptyMessage: { title: 'No forms to display.' },
              }}
              showCount={true}
            />
          </div>
        </div>
      </div>
    </div>
  </Fragment>
);

export const FormList = compose(
  connect((state, props) => ({
    kappSlug: state.app.kapp.slug,
    appLocation: state.app.location,
  })),
  withHandlers({
    buildFormCard: props => record => (
      <ServiceCard key={record.slug} form={record} path={record.slug} />
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
                )})`,
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
)(FormListComponent);

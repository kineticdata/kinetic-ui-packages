import React, { Fragment } from 'react';
import { compose } from 'recompose';
import { connect } from '../../redux/store';
import { refetchActivityFeed } from '@kineticdata/bundle-common';
import { PageBanner } from '../shared/PageBanner';
import { SurveyActivity } from './SurveyActivity';

export const MySurveysComponent = ({ appLocation, feedKey }) => (
  <Fragment>
    <div className="page-container">
      <div className="page-panel">
        <div className="page-panel__header">
          <PageBanner
            parts={['My Surveys']}
            breadcrumbs={[{ label: 'survey', to: appLocation }].filter(Boolean)}
            title={'My Surveys'}
            actions={[
              {
                icon: 'refresh',
                onClick: () => {
                  refetchActivityFeed(feedKey);
                },
                aria: 'Refresh Surveys',
              },
            ]}
          />
        </div>
        <div className="page-panel__body">
          <div className="cards">
            <SurveyActivity feedKey={feedKey} />
          </div>
        </div>
      </div>
    </div>
  </Fragment>
);

const mapStateToProps = (state, props) => ({
  appLocation: state.app.location,
});

export const MySurveys = compose(connect(mapStateToProps))(MySurveysComponent);

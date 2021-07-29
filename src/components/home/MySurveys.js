import React, { Fragment } from 'react';
import { compose } from 'recompose';
import { connect } from '../../redux/store';
import { refetchActivityFeed } from '@kineticdata/bundle-common';
import { PageTitle } from '../shared/PageTitle';
import { SurveyActivity } from './SurveyActivity';

const feedKey = 'my-surveys-feed';

export const MySurveysComponent = ({ appLocation }) => (
  <Fragment>
    <div className="page-container">
      <div className="page-panel">
        <PageTitle
          parts={['My Surveys']}
          breadcrumbs={[{ label: 'Home', to: '/' }].filter(Boolean)}
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
        <div className="cards">
          <SurveyActivity feedKey={feedKey} />
        </div>
      </div>
    </div>
  </Fragment>
);

const mapStateToProps = (state, props) => ({
  appLocation: state.app.location,
});

export const MySurveys = compose(connect(mapStateToProps))(MySurveysComponent);

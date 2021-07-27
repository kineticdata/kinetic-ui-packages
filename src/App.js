import React from 'react';
import { Router, Redirect } from '@reach/router';
import { compose, lifecycle } from 'recompose';
import { ErrorUnexpected, Loading } from '@kineticdata/bundle-common';
import { I18n } from '@kineticdata/react';
import { connect } from './redux/store';
import { PageTitle } from './components/shared/PageTitle';
import { Survey } from './components/shared/Survey';
import { SurveyConfirmation } from './components/shared/SurveyConfirmation';
import { SurveyPreview } from './components/shared/SurveyPreview';
import { SurveyAdminList } from './components/admin/SurveyAdminList';
import { SurveySubmissions } from './components/admin/submissions/SurveySubmissions';
import { SubmissionDetails } from './components/admin/submissions/SubmissionDetails';
import { SurveySettings } from './components/admin/settings/SurveySettings';
import { CreateSurvey } from './components/admin/CreateSurvey';
import { MySurveys } from './components/home/MySurveys';
import { actions as appActions } from './redux/modules/surveyApp';

const SurveyError = () => (
  <h1>
    <I18n>Error loading Survey</I18n>
  </h1>
);

/*****************************************************************************
 *** PRIVATE APP
 *****************************************************************************/

const AppComponent = props => {
  if (props.error) {
    return <ErrorUnexpected />;
  } else if (props.loading) {
    return <Loading text="App is loading ..." />;
  } else {
    return props.render({
      main: (
        <I18n>
          <main className={`package-layout package-layout--survey`}>
            <PageTitle parts={['Loading...']} />
            <Router>
              {/* home */}
              <Redirect from="/" to="my-surveys" noThrow />
              <MySurveys path="my-surveys" />
              {/* admin */}
              <SurveyAdminList path="admin" />
              <CreateSurvey path="admin/new" />
              <SurveySubmissions path="admin/:slug/submissions" />
              <SubmissionDetails path="admin/:slug/submissions/:submissionId/details" />
              <SurveySettings path="admin/:slug/settings" />
              {/* survey */}
              <Survey path=":slug/submissions/:submissionId" />
              <Redirect
                from="forms/:slug/submissions/:submissionId"
                to="../../../../:slug/submissions/:submissionId"
                noThrow
              />
              <SurveyConfirmation path="forms/:slug/confirmation" />
              <SurveyConfirmation path="survey-opt-out/confirmation" />
              <SurveyConfirmation path=":slug/submissions/:submissionId/confirmation" />
              <SurveyPreview path="forms/:slug" />
              <Redirect from=":slug" to="../forms/:slug" noThrow />
              <Survey path="survey-opt-out" />
              <SurveyError path="error" />
            </Router>
          </main>
        </I18n>
      ),
    });
  }
};

const mapStateToProps = (state, props) => ({
  loading: state.surveyApp.loading,
  error: state.surveyApp.error,
  surveys: state.surveyApp.forms,
  required: state.surveyApp.required,
});

const mapDispatchToProps = {
  fetchAppDataRequest: appActions.fetchAppDataRequest,
};

const enhance = compose(
  connect(
    mapStateToProps,
    mapDispatchToProps,
  ),
  lifecycle({
    componentDidMount() {
      this.props.fetchAppDataRequest();
    },
  }),
);

export const App = enhance(AppComponent);

/*****************************************************************************
 *** PUBLIC APP
 *****************************************************************************/

export const PublicAppComponent = props => {
  if (props.error) {
    return <ErrorUnexpected />;
  } else if (props.loading) {
    return <Loading text="App is loading ..." />;
  } else {
    return props.render({
      main: (
        <I18n>
          <main className="package-layout package-layout--services">
            <PageTitle parts={['Loading...']} />
            <Router>
              <MySurveys path="/" />
              <Survey path=":slug/submissions/:submissionId" />
              <Redirect
                from="forms/:slug/submissions/:submissionId"
                to="../../../../:slug/submissions/:submissionId"
                noThrow
              />
              <Survey path="survey-opt-out" />
              <SurveyError path="error" />
              <SurveyConfirmation path="survey-opt-out/confirmation" />
              <SurveyConfirmation path=":slug/submissions/:submissionId/confirmation" />
              <Redirect from="*" to={props.authRoute} noThrow />
            </Router>
          </main>
        </I18n>
      ),
    });
  }
};

const mapStateToPropsPublic = state => ({
  authRoute: state.app.authRoute,
  loading: state.surveyApp.loading,
  error: state.surveyApp.error,
});

const enhancePublic = compose(
  connect(
    mapStateToPropsPublic,
    mapDispatchToProps,
  ),
  lifecycle({
    componentDidMount() {
      this.props.fetchAppDataRequest();
    },
  }),
);

export const PublicApp = enhancePublic(PublicAppComponent);

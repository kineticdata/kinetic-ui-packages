import React, { Fragment } from 'react';
import { connect } from '../../redux/store';
import { actions } from '../../redux/modules/surveys';
import { compose, lifecycle, withHandlers, withProps } from 'recompose';
import { I18n, CoreForm } from '@kineticdata/react';
import {
  ErrorNotFound,
  ErrorUnauthorized,
  ErrorUnexpected,
  LoadingMessage,
  InfoMessage,
} from '@kineticdata/bundle-common';
import { PageTitle } from '../shared/PageTitle';
import { parse } from 'query-string';

export const SurveyComponent = ({
  authenticated,
  loading,
  submission,
  slug,
  kappSlug,
  values,
  optOutFormSlug,
  handleCompleted,
}) => (
  <Fragment>
    <PageTitle parts={[submission && submission.form.name]} />
    {loading ? (
      <LoadingMessage />
    ) : (
      <div className="page-container page-container--color-bar">
        <div className="page-panel">
          <I18n
            context={`kapps.${kappSlug}.forms.${slug}`}
            public={!authenticated}
          >
            <div className="embedded-core-form--wrapper">
              {submission ? (
                submission.coreState !== 'Draft' ? (
                  <InfoMessage title="This survey has already been completed." />
                ) : (
                  <CoreForm
                    submission={submission.id}
                    public={!authenticated}
                    review={submission.coreState !== 'Draft'}
                    form={submission.form.slug}
                    values={values}
                    completed={handleCompleted}
                    notFoundComponent={ErrorNotFound}
                    unauthorizedComponent={ErrorUnauthorized}
                    unexpectedErrorComponent={ErrorUnexpected}
                  />
                )
              ) : (
                <CoreForm
                  public={!authenticated}
                  kapp={kappSlug}
                  form={optOutFormSlug}
                  values={values}
                  completed={handleCompleted}
                  notFoundComponent={ErrorNotFound}
                  unauthorizedComponent={ErrorUnauthorized}
                  unexpectedErrorComponent={ErrorUnexpected}
                />
              )}
            </div>
          </I18n>
        </div>
      </div>
    )}
  </Fragment>
);

const valuesFromQueryParams = queryParams => {
  const params = parse(queryParams);
  return Object.entries(params).reduce((values, [key, value]) => {
    if (key.startsWith('values[')) {
      const vk = key.match(/values\[(.*?)\]/)[1];
      return { ...values, [vk]: value };
    }
    return values;
  }, {});
};

export const handleCompleted = props => response => {
  if (!response.submission.currentPage) {
    props.navigate(`confirmation`);
  }
};

export const mapStateToProps = state => ({
  authenticated: state.app.authenticated,
  kappSlug: state.app.kappSlug,
  loading: state.surveyApp.loading,
  submission: state.surveys.submission,
  optOutFormSlug: 'survey-opt-out',
  values: valuesFromQueryParams(state.router.location.search),
});

export const mapDispatchToProps = {
  fetchSubmission: actions.fetchSubmissionRequest,
};

const enhance = compose(
  connect(
    mapStateToProps,
    mapDispatchToProps,
  ),
  withProps(props => ({
    slug: props.submission ? props.submission.form.slug : props.optOutFormSlug,
  })),
  withHandlers({ handleCompleted }),
  lifecycle({
    componentWillMount() {
      this.props.submissionId &&
        this.props.fetchSubmission({
          id: this.props.submissionId,
        });
    },
  }),
);

export const Survey = enhance(SurveyComponent);

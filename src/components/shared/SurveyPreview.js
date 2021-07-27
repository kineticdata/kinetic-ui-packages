import React from 'react';
import { connect } from '../../redux/store';
import { actions } from '../../redux/modules/surveys';
import { compose, withHandlers, withProps } from 'recompose';
import { I18n, CoreForm } from '@kineticdata/react';
import {
  ErrorNotFound,
  ErrorUnauthorized,
  ErrorUnexpected,
  LoadingMessage,
} from '@kineticdata/bundle-common';
import { handleCompleted } from './Survey';
import { PageTitle } from './PageTitle';
import { parse } from 'query-string';

export const SurveyPreviewComponent = ({
  authenticated,
  loading,
  slug,
  form,
  kapp,
  kappSlug,
  values,
  handleCompleted,
}) => (
  <div className="page-container page-container--color-bar">
    <div className="page-panel">
      <PageTitle
        parts={['Preview', form && form.name]}
        title={form && form.name}
        breadcrumbs={[
          { label: 'survey', to: '../../' },
          { label: 'admin', to: '../../admin' },
        ]}
      />

      {!loading && form ? (
        <I18n
          context={`kapps.${kappSlug}.forms.${slug}`}
          public={!authenticated}
        >
          <div className="embedded-core-form--wrapper">
            <CoreForm
              kapp={kappSlug}
              form={slug}
              values={values}
              completed={handleCompleted}
              notFoundComponent={ErrorNotFound}
              unauthorizedComponent={ErrorUnauthorized}
              unexpectedErrorComponent={ErrorUnexpected}
              public={!authenticated}
            />
          </div>
        </I18n>
      ) : (
        <LoadingMessage />
      )}
    </div>
  </div>
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

export const mapStateToProps = state => ({
  authenticated: state.app.authenticated,
  kapp: state.app.kapp,
  kappSlug: state.app.kappSlug,
  loading: state.surveyApp.loading,
  submission: state.surveys.submission,
  forms: state.surveyApp.forms,
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
    form: props.forms && props.forms.find(form => form.slug === props.slug),
    relativeHomePath: `../../${props.submissionId ? '../../' : ''}`,
  })),
  withHandlers({ handleCompleted }),
);

export const SurveyPreview = enhance(SurveyPreviewComponent);

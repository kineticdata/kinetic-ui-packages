import React, { Fragment } from 'react';
import { connect } from '../redux/store';
import { compose, withHandlers, withProps } from 'recompose';
import { CoreForm } from '@kineticdata/react';
import {
  ErrorNotFound,
  ErrorUnauthorized,
  ErrorUnexpected,
} from '@kineticdata/bundle-common';
import { PageTitle } from './shared/PageTitle';
import { Link } from '@reach/router';
import { parse } from 'query-string';

import { I18n } from '@kineticdata/react';

export const FormComponent = ({
  formSlug,
  id,
  form,
  relativeHomePath,
  handleCreated,
  handleCompleted,
  handleLoaded,
  handleDelete,
  values,
  kappSlug,
}) => (
  <Fragment>
    <PageTitle parts={[form ? form.name : '']} />
    <div className="page-container page-container--tech-bar container">
      <div className="page-panel">
        <div className="page-title">
          <div
            role="navigation"
            aria-label="breadcrumbs"
            className="page-title__breadcrumbs"
          >
            <span className="breadcrumb-item">
              <Link to={relativeHomePath}>
                <I18n>tech bar</I18n>
              </Link>{' '}
              /{' '}
            </span>
            {form && (
              <h1>
                <I18n context={`kapps.${kappSlug}.forms.${formSlug}`}>
                  {form.name}
                </I18n>
              </h1>
            )}
          </div>
        </div>
        <div className="form-description">
          {form &&
            form.description && (
              <p>
                <I18n context={`kapps.${kappSlug}.forms.${formSlug}`}>
                  {form.description}
                </I18n>
              </p>
            )}
        </div>
        <I18n context={`kapps.${kappSlug}.forms.${formSlug}`}>
          <div className="embedded-core-form--wrapper">
            {id ? (
              <CoreForm
                submission={id}
                loaded={handleLoaded}
                completed={handleCompleted}
              />
            ) : (
              <CoreForm
                kapp={kappSlug}
                form={formSlug}
                loaded={handleLoaded}
                created={handleCreated}
                completed={handleCompleted}
                values={values}
                notFoundComponent={ErrorNotFound}
                unauthorizedComponent={ErrorUnauthorized}
                unexpectedErrorComponent={ErrorUnexpected}
              />
            )}
          </div>
        </I18n>
      </div>
    </div>
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
  // Check if either currentPage is null (pre form consolidation) or
  // displayedPage.type is not 'confirmation' (post form-consolidation)
  // to determine that there is no confirmation page and we should redirect.
  if (
    !response.submission.currentPage ||
    (response.submission.displayedPage &&
      response.submission.displayedPage.type !== 'confirmation')
  ) {
    props.navigate(props.relativeHomePath);
  }
};

export const handleCreated = props => response => {
  props.navigate(
    response.submission.coreState === 'Submitted'
      ? props.relativeHomePath
      : `submissions/${response.submission.id}`,
  );
};

export const mapStateToProps = state => ({
  kappSlug: state.app.kappSlug,
  forms: state.techBarApp.forms,
  values: valuesFromQueryParams(state.router.location.search),
});

const enhance = compose(
  connect(mapStateToProps),
  withProps(props => ({
    form: props.forms.find(form => form.slug === props.formSlug),
    relativeHomePath: `../../${props.id ? '../../' : ''}`,
  })),
  withHandlers({ handleCompleted, handleCreated }),
);

export const Form = enhance(FormComponent);

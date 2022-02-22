import React from 'react';
import { connect } from '../redux/store';
import { compose, withHandlers } from 'recompose';
import { CoreForm, I18n } from '@kineticdata/react';
import {
  ErrorNotFound,
  ErrorUnauthorized,
  ErrorUnexpected,
} from '@kineticdata/bundle-common';
import { PageTitle } from './shared/PageTitle';
import { APPOINTMENT_FORM_SLUG } from '../constants';

export const AppointmentFormComponent = ({
  techBarId,
  id,
  techBar,
  past,
  relativeHomePath,
  handleCreated,
  handleCompleted,
  handleLoaded,
  handleDelete,
  kappSlug,
}) => (
  <div className="page-container page-container--tech-bar page-container-lg">
    <div className="page-panel">
      <PageTitle
        parts={['Appointment']}
        breadcrumbs={[
          { label: 'Home', to: '/' },
          { label: 'Tech Bar', to: relativeHomePath },
          past && { label: 'Past Appointments', to: `${relativeHomePath}past` },
        ]}
        title={
          techBar && (
            <>
              <I18n>{techBar.values['Name']}</I18n>{' '}
              <small>
                <I18n>Appointment</I18n>
              </small>
            </>
          )
        }
      />
      {techBar ? (
        <I18n context={`kapps.${kappSlug}.forms.${APPOINTMENT_FORM_SLUG}`}>
          <div className="embedded-core-form--wrapper">
            {id ? (
              <CoreForm
                submission={id}
                review={true}
                loaded={handleLoaded}
                completed={handleCompleted}
              />
            ) : (
              <CoreForm
                kapp={kappSlug}
                form={APPOINTMENT_FORM_SLUG}
                loaded={handleLoaded}
                created={handleCreated}
                completed={handleCompleted}
                values={{ 'Scheduler Id': techBar.values['Id'] }}
                notFoundComponent={ErrorNotFound}
                unauthorizedComponent={ErrorUnauthorized}
                unexpectedErrorComponent={ErrorUnexpected}
              />
            )}
          </div>
        </I18n>
      ) : (
        <ErrorNotFound />
      )}
    </div>
  </div>
);

export const handleCompleted = props => response => {
  // Check if either currentPage is null (pre form consolidation) or
  // displayedPage.type is not 'confirmation' (post form-consolidation)
  // to determine that there is no confirmation page and we should redirect.
  if (
    !response.submission.currentPage ||
    (response.submission.displayedPage &&
      response.submission.displayedPage.type !== 'confirmation')
  ) {
    props.navigate(`/kapps/${props.kappSlug}`);
  }
};

export const handleCreated = props => response => {
  props.navigate(
    response.submission.coreState === 'Submitted'
      ? `/kapps/${props.kappSlug}`
      : response.submission.id,
  );
};

export const mapStateToProps = (state, props) => {
  const past = !!props.path.match(/^\/past/);
  const relativeHomePath = `../${props.techBarId ? '../' : ''}${
    props.id ? '../' : ''
  }${past ? '../' : ''}`;
  return {
    kappSlug: state.app.kappSlug,
    techBar: state.techBarApp.schedulers.find(
      scheduler => scheduler.values['Id'] === props.techBarId,
    ),
    past,
    relativeHomePath,
  };
};

const enhance = compose(
  connect(mapStateToProps),
  withHandlers({ handleCompleted, handleCreated }),
);

export const AppointmentForm = enhance(AppointmentFormComponent);

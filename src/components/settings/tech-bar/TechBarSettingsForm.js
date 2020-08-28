import React, { Fragment } from 'react';
import { connect } from '../../../redux/store';
import { compose, withHandlers } from 'recompose';
import {
  Utils,
  ErrorNotFound,
  ErrorUnauthorized,
  selectHasRoleSchedulerAdmin,
} from '@kineticdata/bundle-common';
import { PageTitle } from '../../shared/PageTitle';
import { Link } from '@reach/router';
import { CoreForm } from '@kineticdata/react';
import { actions } from '../../../redux/modules/techBarApp';
import { TECH_BAR_SETTINGS_FORM_SLUG } from '../../../constants';
import { I18n } from '@kineticdata/react';

export const TechBarSettingsFormComponent = ({
  techBar,
  handleSaved,
  hasManagerAccess,
}) => {
  return techBar ? (
    hasManagerAccess ? (
      <Fragment>
        <PageTitle parts={['Settings', techBar.values['Name']]} settings />
        <div className="page-container">
          <div className="page-panel page-panel--white">
            <div className="page-title">
              <div
                role="navigation"
                aria-label="breadcrumbs"
                className="page-title__breadcrumbs"
              >
                <span className="breadcrumb-item">
                  <Link to="../../../../">
                    <I18n>tech bar</I18n>
                  </Link>
                </span>{' '}
                <span aria-hidden="true">/ </span>
                <span className="breadcrumb-item">
                  <Link to="../../../">
                    <I18n>settings</I18n>
                  </Link>
                </span>{' '}
                <span aria-hidden="true">/ </span>
                <span className="breadcrumb-item">
                  <Link to="../../">
                    <I18n>tech bars</I18n>
                  </Link>
                </span>{' '}
                <span aria-hidden="true">/ </span>
                <span className="breadcrumb-item">
                  <Link to="../">
                    <I18n>{techBar.values['Name']}</I18n>
                  </Link>
                </span>{' '}
                <span aria-hidden="true">/ </span>
                <h1>
                  <I18n>Edit Settings</I18n>
                </h1>
              </div>
              <Link to={`../`} className="btn btn-secondary">
                <I18n>Cancel Edit</I18n>
              </Link>
            </div>
            <div className="content-wrapper form-unstyled">
              <I18n context={`datastore.forms.${TECH_BAR_SETTINGS_FORM_SLUG}`}>
                {techBar.settings.submissionId ? (
                  <CoreForm
                    datastore
                    submission={techBar.settings.submissionId}
                    created={handleSaved}
                    updated={handleSaved}
                  />
                ) : (
                  <CoreForm
                    datastore
                    form={TECH_BAR_SETTINGS_FORM_SLUG}
                    created={handleSaved}
                    updated={handleSaved}
                    values={{ 'Scheduler Id': techBar.values['Id'] }}
                  />
                )}
              </I18n>
            </div>
          </div>
        </div>
      </Fragment>
    ) : (
      <ErrorUnauthorized />
    )
  ) : (
    <ErrorNotFound />
  );
};

export const mapStateToProps = (state, props) => {
  const isSchedulerAdmin = selectHasRoleSchedulerAdmin(state.app.profile);
  const techBar = state.techBarApp.schedulers.find(
    scheduler =>
      scheduler.id === props.techBarId &&
      (isSchedulerAdmin ||
        Utils.isMemberOf(
          state.app.profile,
          `Role::Scheduler::${scheduler.values['Name']}`,
        ) ||
        Utils.isMemberOf(
          state.app.profile,
          `Scheduler::${scheduler.values['Name']}`,
        )),
  );
  return {
    kapp: state.app.kapp,
    techBar,
    hasManagerAccess:
      isSchedulerAdmin ||
      (techBar &&
        Utils.isMemberOf(
          state.app.profile,
          `Role::Scheduler::${techBar.values['Name']}`,
        )),
  };
};

export const mapDispatchToProps = {
  updateTechBarSettingsSuccess: actions.updateTechBarSettingsSuccess,
};

export const TechBarSettingsForm = compose(
  connect(
    mapStateToProps,
    mapDispatchToProps,
  ),
  withHandlers({
    handleSaved: ({
      navigate,
      kapp,
      techBarId,
      updateTechBarSettingsSuccess,
    }) => ({ submission }) => {
      updateTechBarSettingsSuccess({
        techBarId,
        submission,
      });
      navigate(`../`);
    },
  }),
)(TechBarSettingsFormComponent);

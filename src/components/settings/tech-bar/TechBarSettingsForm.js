import React from 'react';
import { connect } from '../../../redux/store';
import { compose, withHandlers } from 'recompose';
import {
  Utils,
  ErrorNotFound,
  ErrorUnauthorized,
  selectHasRoleSchedulerAdmin,
} from '@kineticdata/bundle-common';
import { PageTitle } from '../../shared/PageTitle';
import { CoreForm } from '@kineticdata/react';
import { actions } from '../../../redux/modules/techBarApp';
import { TECH_BAR_SETTINGS_FORM_SLUG } from '../../../constants';
import { I18n } from '@kineticdata/react';

export const TechBarSettingsFormComponent = ({
  kapp,
  techBar,
  handleSaved,
  hasManagerAccess,
}) => {
  return (
    <div className="page-container">
      <div className="page-panel">
        <PageTitle
          parts={[techBar && `${techBar.values['Name']} Settings`]}
          settings
          breadcrumbs={[
            { label: 'Home', to: '/' },
            { label: `${kapp.name} Settings`, to: '../../..' },
            { label: 'Tech Bars', to: '../..' },
            techBar && { label: techBar.values['Name'], to: '..' },
          ]}
          title={techBar && techBar.values['Name']}
          actions={[
            techBar && {
              label: 'Cancel Edit',
              to: '..',
              className: 'btn-outline-danger',
            },
          ]}
        />
        {techBar ? (
          hasManagerAccess ? (
            <div className="content-wrapper form-unstyled">
              <I18n context={`kapps.datastore.forms.${TECH_BAR_SETTINGS_FORM_SLUG}`}>
                {techBar.settings.submissionId ? (
                  <CoreForm
                    submission={techBar.settings.submissionId}
                    created={handleSaved}
                    updated={handleSaved}
                  />
                ) : (
                  <CoreForm
                    kapp="datastore"
                    form={TECH_BAR_SETTINGS_FORM_SLUG}
                    created={handleSaved}
                    updated={handleSaved}
                    values={{ 'Scheduler Id': techBar.values['Id'] }}
                  />
                )}
              </I18n>
            </div>
          ) : (
            <ErrorUnauthorized />
          )
        ) : (
          <ErrorNotFound />
        )}
      </div>
    </div>
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

import React from 'react';
import { connect } from '../../../redux/store';
import { compose } from 'recompose';
import {
  Utils,
  ErrorNotFound,
  selectHasRoleSchedulerAdmin,
} from '@kineticdata/bundle-common';
import { PageTitle } from '../../shared/PageTitle';
import { Link } from '@reach/router';
import { CoreForm, I18n } from '@kineticdata/react';

export const AppointmentFormComponent = ({ id, kapp, techBar }) => {
  return (
    <div className="page-container">
      <div className="page-panel">
        <PageTitle
          parts={['Appointment Details', techBar.values['Name']]}
          settings
          breadcrumbs={[
            { label: 'Home', to: '/' },
            { label: `${kapp.name} Settings`, to: '../../../..' },
            { label: 'Tech Bars', to: '../../..' },
            techBar && { label: techBar.values['Name'], to: '../..' },
          ]}
          title="Appointment Details"
        />

        {techBar ? (
          <div className="content-wrapper form-unstyled">
            <I18n context={`kapps.${kapp.slug}.forms.appointment`}>
              <CoreForm submission={id} review={true} />
            </I18n>
          </div>
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
  };
};

export const AppointmentForm = compose(connect(mapStateToProps))(
  AppointmentFormComponent,
);

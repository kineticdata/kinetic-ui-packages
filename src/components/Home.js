import React, { Fragment } from 'react';
import { connect } from 'react-redux';
import { push } from 'connected-react-router';
import { compose, lifecycle, withHandlers, withState } from 'recompose';
import { Dropdown, DropdownToggle, DropdownMenu } from 'reactstrap';
import {
  KappLink as Link,
  PageTitle,
  selectCurrentKapp,
  Moment,
  Constants,
  Utils,
} from 'common';
import { actions } from '../redux/modules/appointments';
import moment from 'moment';
import { I18n } from '../../../app/src/I18nProvider';
import { DATE_FORMAT, TIME_FORMAT } from '../App';

export const HomeComponent = ({
  kapp,
  techBars,
  loadingUpcoming,
  upcomingErrors,
  upcomingAppointments,
  loadingPast,
  pastErrors,
  pastAppointments,
  openDropdown,
  toggleDropdown,
  hasTechBarDisplayRole,
}) => (
  <Fragment>
    <PageTitle parts={[]} />
    <div className="page-container page-container--tech-bar">
      <div className="home-title">
        <I18n>Welcome to {kapp ? kapp.name : 'Tech Bar'}</I18n>
      </div>
      <section className="mb-4">
        <h2 className="section__title">
          <I18n>Tech Bars</I18n>
        </h2>
        <div className="cards__wrapper--tech-bar">
          {techBars.map(techBar => (
            <div className="card card--tech-bar" key={techBar.id}>
              <div className="card-body">
                <h3 className="card-title">
                  <span>
                    <I18n>{techBar.values['Name']}</I18n>
                  </span>
                  {hasTechBarDisplayRole && (
                    <span>
                      <Dropdown
                        toggle={toggleDropdown(techBar.id)}
                        isOpen={openDropdown === techBar.id}
                      >
                        <DropdownToggle color="link" className="btn-sm">
                          <span className="fa fa-ellipsis-v fa-2x" />
                        </DropdownToggle>
                        <DropdownMenu right>
                          <Link
                            to={`/display/${techBar.values['Id']}/checkin`}
                            className="dropdown-item"
                            target="_blank"
                          >
                            <span className="fa fa-external-link fa-fw mr-2" />
                            <span>
                              <I18n>Check In</I18n>
                            </span>
                          </Link>
                          <Link
                            to={`/display/${techBar.values['Id']}/feedback`}
                            className="dropdown-item"
                            target="_blank"
                          >
                            <span className="fa fa-external-link fa-fw mr-2" />
                            <span>
                              <I18n>Feedback</I18n>
                            </span>
                          </Link>
                          <Link
                            to={`/display/${techBar.values['Id']}/overhead`}
                            className="dropdown-item"
                            target="_blank"
                          >
                            <span className="fa fa-external-link fa-fw mr-2" />
                            <span>
                              <I18n>Overhead</I18n>
                            </span>
                          </Link>
                        </DropdownMenu>
                      </Dropdown>
                    </span>
                  )}
                </h3>
                <div className="card-subtitle">
                  <I18n>{techBar.values['Location']}</I18n>
                </div>
                <p className="card-text">
                  <I18n>{techBar.values['Description']}</I18n>
                </p>
                <Link
                  to={`/forms/appointment?values[Scheduler Id]=${
                    techBar.values['Id']
                  }`}
                  className="btn btn-primary card-button"
                >
                  <I18n>Schedule</I18n>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>
      <section className="mb-4">
        <h2 className="section__title">
          <I18n>Upcoming Appointments</I18n>
        </h2>
        <div className="cards__wrapper--tech-bar">
          {upcomingAppointments.map(appt => {
            const date = moment.utc(appt.values['Event Date'], DATE_FORMAT);
            const start = moment.utc(appt.values['Event Time'], TIME_FORMAT);
            const end = start.clone().add(appt.values['Duration'], 'minute');
            return (
              <div className="card card--tech-bar" key={appt.id}>
                <div className="card-body">
                  <h5 className="card-title">
                    <Moment
                      timestamp={date}
                      format={Constants.MOMENT_FORMATS.dateWithDay}
                    />
                  </h5>
                  <div className="card-subtitle">
                    <Moment
                      timestamp={start}
                      format={Constants.MOMENT_FORMATS.time}
                    />
                    {` - `}
                    <Moment
                      timestamp={end}
                      format={Constants.MOMENT_FORMATS.time}
                    />
                  </div>
                  <p className="card-text">{appt.values['Summary']}</p>
                  <Link
                    to={`/forms/appointment/${appt.id}`}
                    className="btn btn-dark card-button"
                  >
                    <I18n>View Details</I18n>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
        {upcomingAppointments.size === 0 &&
          !loadingUpcoming &&
          upcomingErrors.length === 0 && (
            <h6 className="text-muted">
              <em>
                <I18n>You do not have any upcoming appointments.</I18n>
              </em>
            </h6>
          )}
      </section>
      <section className="mb-4">
        <h2 className="section__title">
          <I18n>Past Appointments</I18n>
        </h2>
        <div className="cards__wrapper--tech-bar">
          {pastAppointments.map(appt => {
            const date = moment.utc(appt.values['Event Date'], DATE_FORMAT);
            const start = moment.utc(appt.values['Event Time'], TIME_FORMAT);
            const end = start.clone().add(appt.values['Duration'], 'minute');
            return (
              <div className="card card--tech-bar" key={appt.id}>
                <div className="card-body">
                  <h5 className="card-title">
                    <Moment
                      timestamp={date}
                      format={Constants.MOMENT_FORMATS.dateWithDay}
                    />
                  </h5>
                  <div className="card-subtitle">
                    <Moment
                      timestamp={start}
                      format={Constants.MOMENT_FORMATS.time}
                    />
                    {` - `}
                    <Moment
                      timestamp={end}
                      format={Constants.MOMENT_FORMATS.time}
                    />
                  </div>
                  <p className="card-text">{appt.values['Summary']}</p>
                  <Link
                    to={`/forms/appointment/${appt.id}`}
                    className="btn btn-subtle card-button"
                  >
                    <I18n>View Details</I18n>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
        {pastAppointments.size === 0 &&
          !loadingPast &&
          pastErrors.length === 0 && (
            <h6 className="text-muted">
              <em>
                <I18n>You do not have any past appointments.</I18n>
              </em>
            </h6>
          )}
      </section>
    </div>
  </Fragment>
);

export const mapStateToProps = state => ({
  kapp: selectCurrentKapp(state),
  techBars: state.techBar.techBarApp.schedulers.filter(
    s => s.values['Status'] === 'Active',
  ),
  loadingUpcoming: state.techBar.appointments.upcoming.loading,
  upcomingErrors: state.techBar.appointments.upcoming.errors,
  upcomingAppointments: state.techBar.appointments.upcoming.data,
  loadingPast: state.techBar.appointments.past.loading,
  pastErrors: state.techBar.appointments.past.errors,
  pastAppointments: state.techBar.appointments.past.data,
  hasTechBarDisplayRole: Utils.isMemberOf(
    state.app.profile,
    'Role::Tech Bar Display',
  ),
});

export const mapDispatchToProps = {
  push,
  fetchUpcomingAppointments: actions.fetchUpcomingAppointments,
  fetchPastAppointments: actions.fetchPastAppointments,
};

const toggleDropdown = ({
  setOpenDropdown,
  openDropdown,
}) => dropdownSlug => () =>
  setOpenDropdown(dropdownSlug === openDropdown ? false : dropdownSlug);

export const Home = compose(
  connect(
    mapStateToProps,
    mapDispatchToProps,
  ),
  withState('openDropdown', 'setOpenDropdown', false),
  withHandlers({ toggleDropdown }),
  lifecycle({
    componentDidMount() {
      if (!this.props.loadingUpcoming) {
        this.props.fetchUpcomingAppointments();
      }
      this.props.fetchPastAppointments();
    },
  }),
)(HomeComponent);

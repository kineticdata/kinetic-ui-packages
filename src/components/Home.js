import React, { Fragment } from 'react';
import { connect } from '../redux/store';
import { compose, lifecycle, withHandlers, withState } from 'recompose';
import { Modal, ModalBody } from 'reactstrap';
import {
  Card,
  CardCol,
  CardRow,
  Utils,
  openModalForm,
  StateListWrapper,
} from '@kineticdata/bundle-common';
import { PageTitle } from './shared/PageTitle';
import { Link } from '@reach/router';
import { actions } from '../redux/modules/appointments';
import { actions as walkInActions } from '../redux/modules/walkIns';
import {
  enableLocationServices,
  mapTechBarsForDistance,
  sortTechBarsByDistance,
} from '../redux/modules/techBarApp';
import {
  SESSION_ITEM_USER_LOCATION,
  SESSION_ITEM_CURRENT_TECH_BAR,
  DATE_FORMAT,
  TIME_FORMAT,
} from '../constants';
import moment from 'moment';
import { I18n, Moment } from '@kineticdata/react';

import heroImage from '../../assets/images/tech-bar-hero.jpg';

export const HomeComponent = ({
  kapp,
  techBars,
  upcomingAppointments,
  error,
  modalOpen,
  setModalOpen,
  currentTechBar,
  selectCurrentTechBar,
  useLocationServices,
  userLocation,
  getUserLocation,
  openDropdown,
  toggleDropdown,
  hasTechBarDisplayRole,
  waitingUsers,
}) => {
  const selectedTechBar = currentTechBar || techBars.get(0);
  return (
    <Fragment>
      <div className="page-container page-container--lg">
        <div className="page-panel">
          <PageTitle
            hero={true}
            image={true}
            heroImage={heroImage}
            overlayColor="rgba(0,0,0,0.6)"
            center={true}
            title={`Welcome to ${
              selectedTechBar
                ? selectedTechBar.values['Name']
                : kapp
                  ? kapp.name
                  : 'Tech Bar'
            }`}
            subtitle={
              selectedTechBar
                ? selectedTechBar.values['Description']
                : 'We deliver in-person service that gets people back on track.'
            }
            withCard={true}
          >
            <Card bar={true} barColor="warning" barSize="xs">
              <CardCol className="overflow-auto">
                <CardRow>
                  <CardRow type="prepend">
                    <span className="fa fa-map-marker fa-3x" />
                  </CardRow>
                  <CardCol>
                    <CardRow>
                      <strong>
                        <I18n>{selectedTechBar.values['Name']}</I18n>
                      </strong>
                      {techBars.size > 1 && (
                        <button
                          className="btn btn-inverse btn-sm ml-auto"
                          onClick={() => setModalOpen(true)}
                        >
                          <I18n>Change</I18n>
                        </button>
                      )}
                    </CardRow>
                    {selectedTechBar.values['Location'] && (
                      <CardRow type="meta" className="text-muted p-0">
                        <I18n>{selectedTechBar.values['Location']}</I18n>
                      </CardRow>
                    )}
                  </CardCol>
                </CardRow>

                <CardRow
                  type="meta"
                  className="flex-grow-1 flex-shrink-1 overflow-auto my-2"
                >
                  {selectedTechBar.values['Details'] && (
                    <p>
                      <I18n>{selectedTechBar.values['Details']}</I18n>
                    </p>
                  )}
                </CardRow>

                <CardCol className="flex-grow-0 flex-shrink-0">
                  <CardRow>
                    <Link
                      to={`appointment/${selectedTechBar.values['Id']}`}
                      className="btn btn-primary flex-grow-1"
                    >
                      <I18n>Schedule Now</I18n> →
                    </Link>
                  </CardRow>
                  <CardRow type="meta" className="pt-0">
                    <em
                      className={`text-muted ${waitingUsers === 0 ? '' : ''}`}
                    >
                      <I18n>Currently awaiting assistance</I18n>: {waitingUsers}{' '}
                      <I18n
                        render={translate =>
                          waitingUsers === 1
                            ? translate('person')
                            : translate('people')
                        }
                      />
                    </em>
                  </CardRow>
                </CardCol>
              </CardCol>
            </Card>
          </PageTitle>

          <section className="mt-4">
            {selectedTechBar ? (
              <div className="info-tile__wrapper">
                <Link
                  to={`appointment/${selectedTechBar.values['Id']}`}
                  className="info-tile"
                >
                  <div className="icon">
                    <span className="fa fa-calendar-o fa-fw" />
                  </div>
                  <div className="title">
                    <span className="fa fa-calendar-o fa-fw" />
                    <I18n>Schedule</I18n>
                  </div>
                  <p className="description">
                    <I18n>Schedule an appointment.</I18n>
                  </p>
                </Link>
                <Link to="past" className="info-tile">
                  <div className="icon">
                    <span className="fa fa-clock-o fa-fw" />
                  </div>
                  <div className="title">
                    <span className="fa fa-clock-o fa-fw" />
                    <I18n>History</I18n>
                  </div>
                  <p className="description">
                    <I18n>View all of your past appointments.</I18n>
                  </p>
                </Link>
                <I18n
                  render={translate => (
                    <div
                      className="info-tile actionable"
                      onClick={() =>
                        openModalForm({
                          formSlug: 'general-feedback',
                          kappSlug: kapp.slug,
                          values: {
                            'Scheduler Id': selectedTechBar.values['Id'],
                          },
                          title: `${translate(
                            selectedTechBar.values['Name'],
                          )} ${translate('Feedback')}`,
                          confirmationMessage: translate(
                            'Thank you for your feedback.',
                          ),
                        })
                      }
                    >
                      <div className="icon">
                        <span className="fa fa-comment-o fa-fw" />
                      </div>
                      <div className="title">
                        <span className="fa fa-comment-o fa-fw" />
                        <I18n>Feedback</I18n>
                      </div>
                      <p className="description">
                        <I18n>Questions, comments, or concerns.</I18n>
                      </p>
                    </div>
                  )}
                />
              </div>
            ) : (
              <div className="alert alert-warning alert-bar">
                <div className="h5">There are no Tech Bars configured.</div>
                <div>Please contact an administrator.</div>
              </div>
            )}
          </section>
          <section className="mt-4">
            <h2 className="section__title">
              <span className="title">
                <I18n>Upcoming Appointments</I18n>
              </span>
            </h2>
            <StateListWrapper
              data={upcomingAppointments}
              error={error}
              emptyTitle="You have no upcoming appointments."
              emptyMessage="As you schedule appointments, they'll appear here."
            >
              {data => (
                <div className="cards mb-3">
                  {data.map(appt => {
                    const techBar = techBars.find(
                      t => t.values['Id'] === appt.values['Scheduler Id'],
                    );
                    const date = moment.utc(
                      appt.values['Event Date'],
                      DATE_FORMAT,
                    );
                    const start = moment.utc(
                      appt.values['Event Time'],
                      TIME_FORMAT,
                    );
                    const end = start
                      .clone()
                      .add(appt.values['Event Duration'], 'minute');
                    return (
                      <Card
                        key={appt.id}
                        to={`appointment/${appt.values['Scheduler Id']}/${
                          appt.id
                        }`}
                        components={{ Link }}
                      >
                        <CardRow>
                          <CardRow type="prepend">
                            <span
                              className="fa fa-calendar fa-rounded"
                              style={{ background: 'rgb(255, 74, 94)' }}
                            />
                          </CardRow>
                          <CardCol>
                            <CardRow type="multi">
                              <CardRow type="subtitle">
                                <Moment
                                  timestamp={date}
                                  format={Moment.formats.dateWithDay}
                                />
                              </CardRow>
                              <CardRow className="text-muted">
                                <Moment
                                  timestamp={start}
                                  format={Moment.formats.time}
                                />
                                {` - `}
                                <Moment
                                  timestamp={end}
                                  format={Moment.formats.time}
                                />
                              </CardRow>
                              <CardRow type="meta">
                                <strong>
                                  <I18n>{techBar.values['Name']}</I18n>
                                </strong>
                              </CardRow>
                              <CardRow type="meta">
                                {appt.values['Summary']}
                              </CardRow>
                            </CardRow>
                          </CardCol>
                          <CardRow type="append">
                            <span
                              className={`badge badge-stylized badge-${
                                appt.coreState === 'Closed' ? 'dark' : 'success'
                              }`}
                            >
                              <I18n>{appt.values['Status']}</I18n>
                            </span>
                          </CardRow>
                        </CardRow>
                      </Card>
                    );
                  })}
                </div>
              )}
            </StateListWrapper>
          </section>
        </div>
      </div>

      {modalOpen && (
        <Modal
          isOpen={!!modalOpen}
          toggle={() => setModalOpen(false)}
          size="sm"
          className="tech-bar-modal"
        >
          <div className="modal-header">
            <h4 className="modal-title">
              <button
                type="button"
                className="btn btn-link"
                onClick={() => setModalOpen(false)}
              >
                <I18n>Cancel</I18n>
              </button>
              <span>
                <I18n>Location</I18n>
              </span>
              <Link to="tech-bars" className="btn btn-link">
                <I18n>View All</I18n>
              </Link>
            </h4>
          </div>
          {useLocationServices &&
            !userLocation && (
              <div className="modal-header">
                <div className="px-3 py-1 text-center">
                  <button className="btn btn-link" onClick={getUserLocation}>
                    <span className="fa fa-fw fa-map-marker" />{' '}
                    <I18n>use my current location</I18n>
                  </button>
                </div>
              </div>
            )}
          <ModalBody>
            <ul>
              {techBars.map(techBar => (
                <li
                  key={techBar.id}
                  onClick={() => selectCurrentTechBar(techBar.id)}
                >
                  <span className="title">
                    <I18n>{techBar.values['Name']}</I18n>
                  </span>
                  {techBar.values['Location'] && (
                    <div className="subtitle">
                      <I18n>{techBar.values['Location']}</I18n>
                    </div>
                  )}
                  {userLocation && (
                    <div className="subtitle">
                      <I18n
                        render={translate =>
                          techBar.distance
                            ? `(${techBar.distance.toFixed(1)} ${translate(
                                'miles',
                              )})`
                            : `(${translate('Distance Unknown')})`
                        }
                      />
                    </div>
                  )}
                  <div className="details">
                    {techBar.values['Description'] && (
                      <p>
                        <I18n>{techBar.values['Description']}</I18n>
                      </p>
                    )}
                    {techBar.values['Details'] && (
                      <p>
                        <I18n>{techBar.values['Details']}</I18n>
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </ModalBody>
        </Modal>
      )}
    </Fragment>
  );
};

export const mapStateToProps = (state, props) => {
  const techBars = state.techBarApp.schedulers.filter(
    s => s.values['Status'] === 'Active',
  );
  const useLocationServices = enableLocationServices(techBars);
  return {
    kappSlug: state.app.kappSlug,
    kapp: state.app.kapp,
    profile: state.app.profile,
    techBars:
      useLocationServices && props.userLocation
        ? techBars
            .map(mapTechBarsForDistance(props.userLocation))
            .sort(sortTechBarsByDistance)
        : techBars,
    error: state.appointments.error,
    upcomingAppointments: state.appointments.upcoming,
    waitingUsers:
      (state.appointments.overview ? state.appointments.overview.size : 0) +
      (state.walkIns.overview ? state.walkIns.overview.size : 0),
    useLocationServices,
  };
};

export const mapDispatchToProps = {
  fetchUpcomingAppointmentsRequest: actions.fetchUpcomingAppointmentsRequest,
  fetchAppointmentsOverviewRequest: actions.fetchAppointmentsOverviewRequest,
  fetchWalkInsOverviewRequest: walkInActions.fetchWalkInsOverviewRequest,
};

const selectCurrentTechBar = ({
  techBars,
  setCurrentTechBar,
  setModalOpen,
}) => id => {
  setModalOpen(false);
  sessionStorage.setItem(SESSION_ITEM_CURRENT_TECH_BAR, id);
  setCurrentTechBar(techBars.find(t => t.id === id));
};

const getUserLocation = ({ setUserLocation }) => () => {
  navigator.geolocation.getCurrentPosition(position => {
    if (position && position.coords) {
      const userLocObj = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };
      setUserLocation(userLocObj);
      sessionStorage.setItem(
        SESSION_ITEM_USER_LOCATION,
        JSON.stringify(userLocObj),
      );
    }
  });
};

const toggleDropdown = ({
  setOpenDropdown,
  openDropdown,
}) => dropdownSlug => () =>
  setOpenDropdown(dropdownSlug === openDropdown ? false : dropdownSlug);

const hasTechBarDisplayRole = ({ profile }) => techBarName =>
  Utils.isMemberOf(profile, `Role::Tech Bar Display::${techBarName}`);

export const Home = compose(
  withState('userLocation', 'setUserLocation', () => {
    try {
      const locObj = JSON.parse(
        sessionStorage.getItem(SESSION_ITEM_USER_LOCATION),
      );
      if (locObj && locObj.latitude != null && locObj.longitude != null) {
        return locObj;
      }
    } catch (e) {}
    return null;
  }),
  connect(
    mapStateToProps,
    mapDispatchToProps,
  ),
  withState('currentTechBar', 'setCurrentTechBar', ({ techBars }) => {
    const techBarId = sessionStorage.getItem(SESSION_ITEM_CURRENT_TECH_BAR);
    return techBarId ? techBars.find(t => t.id === techBarId) : null;
  }),
  withState('modalOpen', 'setModalOpen', false),
  withState('openDropdown', 'setOpenDropdown', false),
  withHandlers({
    selectCurrentTechBar,
    getUserLocation,
    toggleDropdown,
    hasTechBarDisplayRole,
  }),
  lifecycle({
    componentDidMount() {
      // If not loading, fetch upcoming appointments
      this.props.fetchUpcomingAppointmentsRequest();
      // Ask for user location if enabled and not already saved
      if (this.props.useLocationServices && this.props.userLocation === null) {
        this.props.getUserLocation();
      }
      // Fetch count of checked in customers at the current techbar
      if (this.props.techBars.size > 0) {
        const selectedTechBar =
          this.props.currentTechBar || this.props.techBars.get(0);
        this.props.fetchAppointmentsOverviewRequest({
          id: selectedTechBar.values['Id'],
        });
        this.props.fetchWalkInsOverviewRequest({
          id: selectedTechBar.values['Id'],
        });
      }
    },
    componentDidUpdate(prevProps) {
      if (
        this.props.techBars.size > 0 &&
        this.props.currentTechBar !== prevProps.currentTechBar
      ) {
        const selectedTechBar =
          this.props.currentTechBar || this.props.techBars.get(0);
        this.props.fetchAppointmentsOverviewRequest({
          id: selectedTechBar.values['Id'],
        });
        this.props.fetchWalkInsOverviewRequest({
          id: selectedTechBar.values['Id'],
        });
      }
    },
  }),
)(HomeComponent);

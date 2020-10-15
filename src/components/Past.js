import React, { Fragment } from 'react';
import { connect } from '../redux/store';
import { compose, lifecycle } from 'recompose';
import { StateListWrapper } from '@kineticdata/bundle-common';
import { PageTitle } from './shared/PageTitle';
import { Link } from '@reach/router';
import { actions } from '../redux/modules/appointments';
import moment from 'moment';
import { I18n, Moment } from '@kineticdata/react';
import { DATE_FORMAT, TIME_FORMAT } from '../constants';

export const PastComponent = ({ techBars, error, pastAppointments }) => (
  <Fragment>
    <PageTitle parts={['Past Appointments']} />
    <div className="page-container page-container--tech-bar container">
      <div className="page-panel">
        <div className="page-title">
          <div
            role="navigation"
            aria-label="breadcrumbs"
            className="page-title__breadcrumbs"
          >
            <span className="breadcrumb-item">
              <Link to="../">
                <I18n>tech bar</I18n>
              </Link>{' '}
              /{' '}
            </span>
            <h1>
              <I18n>Past Appointments</I18n>
            </h1>
          </div>
        </div>
        <section className="mb-4">
          <StateListWrapper
            data={pastAppointments}
            error={error}
            emptyTitle="You have no past appointments."
            emptyMessage="Your completed and cancelled appointments will appear here."
          >
            {data => (
              <div className="cards">
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
                    <Link
                      to={`appointment/${appt.values['Scheduler Id']}/${
                        appt.id
                      }`}
                      className="card"
                      key={appt.id}
                    >
                      <div className="card__row">
                        <div className="card__row-prepend">
                          <span
                            className="fa fa-calendar fa-rounded"
                            style={{ background: 'rgb(255, 74, 94)' }}
                          />
                        </div>
                        <div className="card__col">
                          <div className="card__row-multi">
                            <div className="card__row-subtitle">
                              <Moment
                                timestamp={date}
                                format={Moment.formats.dateWithDay}
                              />
                            </div>
                            <div className="card__row text-muted">
                              <Moment
                                timestamp={start}
                                format={Moment.formats.time}
                              />
                              {` - `}
                              <Moment
                                timestamp={end}
                                format={Moment.formats.time}
                              />
                            </div>
                            <div className="card__row-meta">
                              <strong>
                                <I18n>{techBar.values['Name']}</I18n>
                              </strong>
                            </div>
                            <div className="card__row-meta">
                              {appt.values['Summary']}
                            </div>
                          </div>
                        </div>
                        <div className="card__row-append">
                          <span
                            className={`badge badge-pill badge-${
                              appt.coreState === 'Closed' ? 'dark' : 'success'
                            }`}
                          >
                            <I18n>{appt.values['Status']}</I18n>
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </StateListWrapper>
        </section>
      </div>
    </div>
  </Fragment>
);

export const mapStateToProps = state => ({
  techBars: state.techBarApp.schedulers.filter(
    s => s.values['Status'] === 'Active',
  ),
  error: state.appointments.error,
  pastAppointments: state.appointments.past,
});

export const mapDispatchToProps = {
  fetchPastAppointmentsRequest: actions.fetchPastAppointmentsRequest,
};

export const Past = compose(
  connect(
    mapStateToProps,
    mapDispatchToProps,
  ),
  lifecycle({
    componentDidMount() {
      this.props.fetchPastAppointmentsRequest();
    },
  }),
)(PastComponent);

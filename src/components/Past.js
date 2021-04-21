import React, { Fragment } from 'react';
import { connect } from '../redux/store';
import { compose, lifecycle } from 'recompose';
import {
  Card,
  CardCol,
  CardRow,
  StateListWrapper,
} from '@kineticdata/bundle-common';
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
                            className={`badge badge-pill badge-${
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

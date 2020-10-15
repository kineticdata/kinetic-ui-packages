import React, { Fragment } from 'react';
import { connect } from '../redux/store';
import { compose, withHandlers, withState } from 'recompose';
import {
  selectCurrentKapp,
  Constants,
  Utils,
} from '@kineticdata/bundle-common';
import { PageTitle } from './shared/PageTitle';
import { Link } from '@reach/router';
import { Dropdown, DropdownToggle, DropdownMenu } from 'reactstrap';
import {
  mapTechBarsForDistance,
  sortTechBarsByDistance,
} from '../redux/modules/techBarApp';
import {
  SESSION_ITEM_USER_LOCATION,
  SESSION_ITEM_CURRENT_TECH_BAR,
} from '../constants';

import { I18n } from '@kineticdata/react';

export const TechBarsComponent = ({
  kapp,
  techBars,
  openDropdown,
  toggleDropdown,
  hasTechBarDisplayRole,
  currentTechBar,
  selectCurrentTechBar,
}) => (
  <Fragment>
    <PageTitle parts={['All Tech Bars']} />
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
              <I18n>All Tech Bars</I18n>
            </h1>
          </div>
        </div>
        <section>
          <div className="cards cards--thirds">
            {techBars.map(techBar => (
              <div
                className="card"
                key={techBar.id}
                style={
                  currentTechBar && techBar.id === currentTechBar.id
                    ? { borderTopColor: Constants.COLORS.sunflower }
                    : undefined
                }
              >
                <div
                  className="card__bar card__bar--xs card__bar--subtle"
                  style={
                    currentTechBar && techBar.id === currentTechBar.id
                      ? { borderTopColor: Constants.COLORS.sunflower }
                      : undefined
                  }
                />
                <div className="card__row flex-grow-1">
                  <div className="card__row-prepend">
                    <span className="fa fa-map-marker fa-3x" />
                  </div>
                  <div className="card__col">
                    <div className="card__row">
                      <strong>
                        <I18n>{techBar.values['Name']}</I18n>
                      </strong>
                    </div>
                    {techBar.values['Location'] && (
                      <div className="card__row-meta text-muted pt-0">
                        <I18n>{techBar.values['Location']}</I18n>
                      </div>
                    )}
                    {techBar.values['Description'] && (
                      <div className="card__row-meta pt-1">
                        <I18n>{techBar.values['Description']}</I18n>
                      </div>
                    )}
                    {techBar.values['Details'] && (
                      <div className="card__row-meta pt-1">
                        <I18n>{techBar.values['Details']}</I18n>
                      </div>
                    )}
                  </div>
                  {hasTechBarDisplayRole(techBar.values['Name']) && (
                    <div className="card__row-append">
                      <Dropdown
                        toggle={toggleDropdown(techBar.id)}
                        isOpen={openDropdown === techBar.id}
                      >
                        <DropdownToggle color="link" className="btn-sm">
                          <span className="fa fa-ellipsis-v fa-2x" />
                        </DropdownToggle>
                        <DropdownMenu right>
                          <Link
                            to={`../display/${techBar.values['Id']}/checkin`}
                            onClick={toggleDropdown(techBar.id)}
                            className="dropdown-item"
                            target="_blank"
                          >
                            <span className="fa fa-fw fa-external-link mr-2" />
                            <span>
                              <I18n>Check In</I18n>
                            </span>
                          </Link>
                          <Link
                            to={`../display/${techBar.values['Id']}/feedback`}
                            onClick={toggleDropdown(techBar.id)}
                            className="dropdown-item"
                            target="_blank"
                          >
                            <span className="fa fa-external-link fa-fw mr-2" />
                            <span>
                              <I18n>Feedback</I18n>
                            </span>
                          </Link>
                          <Link
                            to={`../display/${
                              techBar.values['Id']
                            }/checkin?crosslink`}
                            onClick={toggleDropdown(techBar.id)}
                            className="dropdown-item"
                            target="_blank"
                          >
                            <span className="fa fa-external-link fa-fw mr-2" />
                            <span>
                              <I18n>Check In</I18n> / <I18n>Feedback</I18n>
                            </span>
                          </Link>
                          <Link
                            to={`../display/${techBar.values['Id']}/overhead`}
                            onClick={toggleDropdown(techBar.id)}
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
                    </div>
                  )}
                </div>
                <div className="card__col pt-0 flex-grow-0">
                  <div className="card__row">
                    <Link
                      to={`../appointment/${techBar.values['Id']}`}
                      className="btn btn-primary flex-grow-1"
                    >
                      <I18n>Schedule Now</I18n> →
                    </Link>
                  </div>
                  {techBars.size > 1 && (
                    <div className="card__row">
                      {currentTechBar && techBar.id === currentTechBar.id ? (
                        <button className="btn btn-sm btn-success" disabled>
                          <I18n>Current Tech Bar</I18n>
                        </button>
                      ) : (
                        <button
                          className="btn btn-link btn-sm"
                          onClick={() => selectCurrentTechBar(techBar.id)}
                        >
                          <I18n>Set as Current Tech Bar</I18n>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  </Fragment>
);

export const mapStateToProps = (state, props) => ({
  kapp: selectCurrentKapp(state),
  techBars: state.techBarApp.schedulers
    .filter(s => s.values['Status'] === 'Active')
    .map(
      props.userLocation ? mapTechBarsForDistance(props.userLocation) : t => t,
    )
    .sort(props.userLocation ? sortTechBarsByDistance : () => 0),
  profile: state.app.profile,
});

const toggleDropdown = ({
  setOpenDropdown,
  openDropdown,
}) => dropdownSlug => () =>
  setOpenDropdown(dropdownSlug === openDropdown ? false : dropdownSlug);

const hasTechBarDisplayRole = ({ profile }) => techBarName =>
  Utils.isMemberOf(profile, `Role::Tech Bar Display::${techBarName}`);

const selectCurrentTechBar = ({ techBars, setCurrentTechBar }) => id => {
  sessionStorage.setItem(SESSION_ITEM_CURRENT_TECH_BAR, id);
  setCurrentTechBar(techBars.find(t => t.id === id));
};

export const TechBars = compose(
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
  connect(mapStateToProps),
  withState('currentTechBar', 'setCurrentTechBar', ({ techBars }) => {
    const techBarId = sessionStorage.getItem(SESSION_ITEM_CURRENT_TECH_BAR);
    return techBarId ? techBars.find(t => t.id === techBarId) : null;
  }),
  withState('openDropdown', 'setOpenDropdown', false),
  withHandlers({ toggleDropdown, hasTechBarDisplayRole, selectCurrentTechBar }),
)(TechBarsComponent);

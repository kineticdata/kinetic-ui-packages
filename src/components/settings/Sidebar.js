import React from 'react';
import { Link } from '@reach/router';
import { connect } from 'react-redux';
import { compose } from 'recompose';

import { I18n } from '@kineticdata/react';
import { context } from '../../redux/store';
import { isActiveClass } from '../../utils';

export const SidebarComponent = ({
  settingsBackPath,
  loading,
  spaceAdmin,
  kapp,
}) => (
  <div className="sidebar space-sidebar">
    <Link to={settingsBackPath} className="nav-return">
      <span className="fa fa-fw fa-chevron-left" />
      <I18n>Return to</I18n> <I18n>{kapp.name}</I18n>
    </Link>
    <div className="sidebar-group--content-wrapper">
      {!loading && (
        <ul className="nav flex-column sidebar-group">
          <li className="nav-item">
            {spaceAdmin && (
              <Link to="general" getProps={isActiveClass('nav-link')}>
                <I18n>General</I18n>
                <span className="fa fa-fw fa-angle-right" />
              </Link>
            )}
            <Link to="forms" getProps={isActiveClass('nav-link')}>
              <I18n>Forms</I18n>
              <span className="fa fa-fw fa-angle-right" />
            </Link>
            {spaceAdmin && (
              <Link to="categories" getProps={isActiveClass('nav-link')}>
                <I18n>Categories</I18n>
                <span className="fa fa-fw fa-angle-right" />
              </Link>
            )}
          </li>
        </ul>
      )}
    </div>
  </div>
);

export const mapStateToProps = state => ({
  loading: state.servicesSettings.loading,
  forms: state.forms.data,
  spaceAdmin: state.app.profile.spaceAdmin,
  kapp: state.app.kapp,
});

export const Sidebar = compose(
  connect(
    mapStateToProps,
    null,
    null,
    { context },
  ),
)(SidebarComponent);

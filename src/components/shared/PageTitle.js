import React, { Fragment } from 'react';
import { Link } from '@reach/router';
import { connect } from '../../redux/store';
import { compose, withProps } from 'recompose';
import classNames from 'classnames';
import { get } from 'immutable';
import {
  PageTitle as CommonPageTitle,
  selectCurrentKapp,
  services,
} from '@kineticdata/bundle-common';
import { UncontrolledDropdown, DropdownToggle, DropdownMenu } from 'reactstrap';
import { I18n } from '@kineticdata/react';

import heroImage from '../../../assets/images/hero_geometry.jpg';

const PageTitleBreadcrumbs = get(services, 'PageTitleBreadcrumbs', props => {
  return props.breadcrumbs ? (
    <div
      role="navigation"
      aria-label="breadcrumbs"
      className="page-title__breadcrumbs"
    >
      {props.breadcrumbs.filter(b => !!b && b.label).map((b, i) => (
        <span key={`breadcrumb-${i}`}>
          {b.to ? (
            <Link to={b.to}>
              <I18n>{b.label}</I18n>
            </Link>
          ) : (
            <I18n>{b.label}</I18n>
          )}
        </span>
      ))}
    </div>
  ) : null;
});

const actionMapper = light => (a, i) => {
  const actionClass = classNames({
    'dropdown-item': a.menu,
    btn: !a.menu,
    'btn-icon-light': !a.menu && a.icon && !a.label && light,
    'btn-icon-primary': !a.menu && a.icon && !a.label && !light,
    'btn-outline-light': !a.menu && (!a.icon || a.label) && light,
    'btn-secondary': !a.menu && (!a.icon || a.label) && !light,
  });
  const iconClass = classNames(`fa fa-fw fa-${a.icon}`, {
    'fa-lg': !a.label,
  });
  const actionContent = (
    <>
      {a.icon && <span className={iconClass} />}
      {a.icon && a.label && ' '}
      {a.label && <I18n>{a.label}</I18n>}
    </>
  );
  return a.to ? (
    <Link
      key={`action-${i}`}
      to={a.to}
      className={actionClass}
      aria-label={a.aria || a.label}
    >
      {actionContent}
    </Link>
  ) : a.href ? (
    <a
      key={`action-${i}`}
      href={a.href}
      className={actionClass}
      aria-label={a.aria || a.label}
      target="_blank"
      rel="noopener noreferrer"
    >
      {actionContent}
    </a>
  ) : (
    <button
      key={`action-${i}`}
      onClick={a.onClick}
      className={actionClass}
      aria-label={a.aria || a.label}
    >
      {actionContent}
    </button>
  );
};

const Content = ({ title, actions, hero }) =>
  title || actions ? (
    <div className="page-title__content">
      {title && (
        <h1>
          <I18n>{title}</I18n>
        </h1>
      )}
      {actions && (
        <div className="page-title__actions">
          {actions.filter(a => !!a && !a.menu).map(actionMapper(hero))}
          {actions.some(a => !!a && a.menu) && (
            <UncontrolledDropdown>
              <DropdownToggle
                tag="button"
                className={`btn btn-icon${hero ? '-light' : ''}`}
                aria-label="More Actions"
              >
                <span className="fa fa-chevron-down fa-fw" />
              </DropdownToggle>
              <DropdownMenu right>
                {actions.filter(a => !!a && a.menu).map(actionMapper(hero))}
              </DropdownMenu>
            </UncontrolledDropdown>
          )}
        </div>
      )}
    </div>
  ) : null;

const Meta = ({ meta }) =>
  meta ? (
    <div className="page-title__meta">
      <dl>
        {meta.filter(m => !!m && m.label).map((m, i) => (
          <div key={`meta-${i}`}>
            <dt>
              <I18n>{m.label}</I18n>
            </dt>
            <dd>
              <I18n>{m.value}</I18n>
            </dd>
          </div>
        ))}
      </dl>
    </div>
  ) : null;

const mapStateToProps = state => ({
  space: state.app.space,
  kapp: selectCurrentKapp(state),
});

const PageTitleContainer = get(services, 'PageTitleContainer', props => {
  const {
    hero = true,
    image = hero,
    center = false,
    container = false,
    children,
  } = props;
  const Container = container
    ? ({ children }) => <div className="container">{children}</div>
    : Fragment;
  return (
    <div
      className={classNames({
        'page-title-heading': !hero,
        'page-title-hero': hero,
        'page-title-hero--image': hero && image,
        'page-title-hero--center': hero && center,
      })}
      style={hero && image ? { backgroundImage: `url(${heroImage})` } : {}}
    >
      <Container>{children}</Container>
    </div>
  );
});

const PageTitleComponent = props => {
  const {
    parts,
    breadcrumbs,
    title,
    actions,
    meta,
    hero = true,
    children,
  } = props;
  return (
    <>
      <CommonPageTitle parts={parts} />
      {(breadcrumbs || title || actions || meta || children) && (
        <PageTitleContainer {...props}>
          <PageTitleBreadcrumbs breadcrumbs={breadcrumbs} />
          <Content title={title} actions={actions} hero={hero} />
          <Meta meta={meta} />
          {children}
        </PageTitleContainer>
      )}
    </>
  );
};

export const PageTitle = compose(
  connect(mapStateToProps),
  withProps(({ parts = [], ...props }) => ({
    parts: parts.concat([
      [props.kapp && props.kapp.name, props.settings && 'Settings']
        .filter(Boolean)
        .join(' '),
      props.space && props.space.name,
    ]),
  })),
)(PageTitleComponent);

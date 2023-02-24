import React from 'react';
import { Redirect } from '@reach/router';
import { compose, withHandlers, withState } from 'recompose';
import { CoreForm, I18n } from '@kineticdata/react';
import { connect } from '../redux/store';
import { PageTitle } from './shared/PageTitle';
import classNames from 'classnames';

export const FormPreviewComponent = ({
  hasPreviewAccess,
  kappSlug,
  formSlug,
  id,
  appLocation,
  handleLoaded,
  handleCreated,
  formName,
}) => (
  <div className="page-container">
    <div className={classNames('page-panel')}>
      <PageTitle
        parts={['Form Preview']}
        breadcrumbs={[
          { label: 'Home', to: '/' },
          { label: 'Queue', to: appLocation },
        ]}
        title={
          <div>
            {formName && (
              <span>
                <I18n>{formName}</I18n>{' '}
              </span>
            )}
            <small>
              <I18n>(Form Preview)</I18n>
            </small>
          </div>
        }
      />
      {hasPreviewAccess ? (
        <CoreForm
          submission={id}
          kapp={kappSlug}
          form={formSlug}
          loaded={handleLoaded}
          created={handleCreated}
        />
      ) : (
        <Redirect to={appLocation} noThrow />
      )}
    </div>
  </div>
);

export const handleLoaded = props => form => {
  props.setFormName(form.name());
};

export const handleCreated = props => response => {
  props.navigate(response.submission.id);
};

export const mapStateToProps = (state, props) => ({
  kappSlug: state.app.kappSlug,
  appLocation: state.app.location,
  hasPreviewAccess:
    state.app.profile.spaceAdmin ||
    state.app.kapp.authorization['Form Creation'] ||
    state.app.kapp.authorization['Modification'],
});

export const FormPreview = compose(
  connect(mapStateToProps),
  withState('formName', 'setFormName', ''),
  withHandlers({
    handleLoaded,
    handleCreated,
  }),
)(FormPreviewComponent);

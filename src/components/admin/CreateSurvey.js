import React from 'react';
import { Link } from '@reach/router';
import { connect } from '../../redux/store';
import { push } from 'redux-first-history';
import { compose, withHandlers, withState } from 'recompose';
import { Survey } from '../../models';
import { actions } from '../../redux/modules/surveys';
import { actions as appActions } from '../../redux/modules/surveyApp';
import { PageTitle } from '../shared/PageTitle';
import { I18n } from '@kineticdata/react';

const CreateSurveyComponent = ({
  setNewForm,
  kapp,
  kappSlug,
  newForm,
  creating,
  handleSave,
  handleNameChange,
  templates,
}) => (
  <div className="page-container page-container--panels">
    <PageTitle parts={['New Survey']} />
    <div className="page-panel page-panel--two-thirds page-panel--white">
      <div className="page-title">
        <div
          role="navigation"
          aria-label="breadcrumbs"
          className="page-title__breadcrumbs"
        >
          <span className="breadcrumb-item">
            <Link to="../../">
              <I18n>survey</I18n>
            </Link>
          </span>{' '}
          <span aria-hidden="true">/ </span>
          <span className="breadcrumb-item">
            <Link to="../">
              <I18n>admin</I18n>
            </Link>
          </span>{' '}
          <span aria-hidden="true">/ </span>
          <h1>
            <I18n>New Survey</I18n>
          </h1>
        </div>
      </div>
      <div className="datastore-settings">
        <h3 className="section__title">
          <I18n>General Settings</I18n>
        </h3>
        <div className="settings form">
          <div className="form-group">
            <label htmlFor="template">
              <I18n>Survey Template</I18n>{' '}
              <small>
                <I18n>
                  (Kapp form of type "Template" to clone for new survey)
                </I18n>
              </small>
            </label>
            <select
              id="template"
              className="form-control"
              onChange={e =>
                setNewForm(newForm.set('template', e.target.value))
              }
              value={newForm.template}
              name="template"
            >
              <option value="" />
              {!!templates &&
                templates.map(t => (
                  <option key={t.slug} value={t.slug}>
                    {t.name}
                  </option>
                ))}
            </select>
          </div>
          <div className="form-row">
            <div className="col">
              <div className="form-group required">
                <label htmlFor="name">
                  <I18n>Survey Name</I18n>
                </label>
                <input
                  id="name"
                  name="name"
                  onChange={e => handleNameChange(e.target.value)}
                  value={newForm.name}
                  className="form-control"
                />
              </div>
            </div>
            <div className="col">
              <div className="form-group required">
                <label htmlFor="slug">
                  <I18n>Survey Slug</I18n>
                </label>
                <input
                  id="slug"
                  name="slug"
                  onChange={e =>
                    setNewForm(newForm.set('slug', e.target.value))
                  }
                  value={newForm.slug}
                  className="form-control"
                />
              </div>
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="name">
              <I18n>Survey Description</I18n>{' '}
              <small>
                <I18n>(optional)</I18n>
              </small>
            </label>
            <textarea
              id="description"
              className="form-control"
              onChange={e =>
                setNewForm(newForm.set('description', e.target.value))
              }
              value={newForm.description || ''}
              rows="3"
              name="description"
            />
          </div>
          <div className="mb-4 text-right">
            <button
              disabled={
                newForm.template === '' ||
                newForm.name === '' ||
                newForm.slug === '' ||
                creating
              }
              type="button"
              onClick={handleSave()}
              className="btn btn-secondary"
            >
              <I18n>Create Survey</I18n>
            </button>
            <Link to="../" className="btn btn-link ml-2">
              <I18n>Cancel</I18n>
            </Link>
          </div>
        </div>
      </div>
    </div>
    <div className="page-panel page-panel--one-thirds page-panel--transparent page-panel--sidebar py-4">
      <h3>
        <I18n>New Survey</I18n>
      </h3>
      <p>
        <I18n>
          Creating a new Survey will create a Kapp form with the same survey
          configuration as the selected template.
        </I18n>
      </p>
    </div>
  </div>
);

const handleSave = ({
  createForm,
  fetchAppDataRequest,
  newForm,
  push,
  setCreating,
  kapp,
}) => () => () => {
  setCreating(true);
  createForm({
    kappSlug: kapp.slug,
    form: newForm,
    callback: () => {
      fetchAppDataRequest();
      push(`${newForm.slug}/settings`);
    },
  });
};

const handleNameChange = ({ setNewForm, newForm }) => value => {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-');
  if (
    newForm.slug === '' ||
    slug.includes(newForm.slug) ||
    newForm.slug.includes(slug)
  ) {
    const updatedForm = newForm.set('name', value).set('slug', slug);
    setNewForm(updatedForm);
  } else {
    setNewForm(newForm.set('name', value));
  }
};

export const mapStateToProps = state => ({
  kapp: state.app.kapp,
  kappSlug: state.app.kappSlug,
  spaceAdmin: state.app.profile.spaceAdmin,
  templates: state.surveyApp.templates,
});

export const mapDispatchToProps = {
  push,
  createForm: actions.createFormRequest,
  fetchAppDataRequest: appActions.fetchAppDataRequest,
};

export const CreateSurvey = compose(
  connect(
    mapStateToProps,
    mapDispatchToProps,
  ),
  withState('newForm', 'setNewForm', Survey()),
  withState('creating', 'setCreating', false),
  withHandlers({
    handleSave,
    handleNameChange,
  }),
)(CreateSurveyComponent);
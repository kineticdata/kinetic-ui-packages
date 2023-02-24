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
import { Aside } from '@kineticdata/bundle-common';

const CreateSurveyComponent = ({
  setNewForm,
  kapp,
  kappSlug,
  newForm,
  creating,
  handleSave,
  handleNameChange,
  templates,
  asideOpen,
  toggleAsideOpen,
}) => (
  <div className="page-container page-container--panels">
    <div className="page-panel">
      <PageTitle
        parts={['New Survey']}
        breadcrumbs={[
          { label: 'Home', to: '/' },
          { label: `${kapp.name} Admin`, to: '..' },
        ]}
        title="New Survey"
        actions={[
          {
            icon: 'info-circle',
            aria: 'Help Info',
            onClick: () => toggleAsideOpen(!asideOpen),
            className: 'btn-icon-subtle',
          },
        ]}
      />
      <div className="datastore-settings">
        <div className="settings form form-unstyled mb-5">
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
    {asideOpen && (
      <Aside
        title={<I18n>New Survey</I18n>}
        className="survey-settings-sidebar"
        toggle={() => toggleAsideOpen(false)}
      >
        <p>
          <I18n>
            Creating a new Survey will create a Kapp form with the same survey
            configuration as the selected template.
          </I18n>
        </p>
        <p>
          <I18n>
            Once the new survey is created, you will be able to access and edit
            its advanced settings, including workflow process, notifications,
            triggers, delivery rules, and security.
          </I18n>
        </p>
        <p>
          <I18n>
            <b>Survey Name</b> will be visible to the owning team and individual
            (see Permissions tab), but not the individuals who take the survey.
          </I18n>
        </p>
        <p>
          <I18n>
            <b>Survey Slug</b> will be visible in the URL to the individuals who
            take the survey. While this defaults to a url friendly copy of the
            Survey Name, they do not have to match.
          </I18n>
        </p>
        <p>
          <I18n>
            <b>Description</b> is for the owning team and individual. The
            individuals taking the survey do not see this value.
          </I18n>
        </p>
      </Aside>
    )}
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
  withState('asideOpen', 'toggleAsideOpen', false),
  withHandlers({
    handleSave,
    handleNameChange,
  }),
)(CreateSurveyComponent);

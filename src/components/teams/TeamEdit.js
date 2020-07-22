import React, { Fragment } from 'react';
import { TeamForm, I18n, refetchTable } from '@kineticdata/react';
import { compose, withHandlers } from 'recompose';
import { FormComponents, addToast } from '@kineticdata/bundle-common';
import { PageTitle } from '../shared/PageTitle';
import { Link } from '@reach/router';
import { TeamCard } from '../shared/TeamCard';
import { getIn } from 'immutable';

const asArray = value => (value ? [value] : []);

const FormLayout = ({ fields, error, buttons }) => (
  <form>
    <div className="section__title">
      <I18n>General</I18n>
    </div>
    {fields.get('parentTeam')}
    {fields.get('localName')}
    {fields.get('description')}
    {fields.get('assignable')}
    {fields.get('icon')}
    <br />
    <div className="section__title">
      <I18n>Memberships</I18n>
    </div>
    {fields.get('memberships')}
    <br />
    {error}
    {buttons}
  </form>
);

const TeamEditComponent = ({
  formKey,
  slug: teamSlug,
  handleSave,
  handleDelete,
}) => (
  <div className="page-container page-container--panels">
    <PageTitle parts={[`Edit Team`, 'Teams']} />
    <TeamForm
      formKey={formKey}
      teamSlug={teamSlug}
      components={{
        FormError: FormComponents.FormError,
        FormButtons: FormComponents.generateFormButtons({
          handleDelete,
          submitLabel: 'Update Team',
          cancelPath: '/settings/teams',
        }),
        FormLayout,
      }}
      addFields={() => ({ team }) =>
        team && [
          {
            name: 'assignable',
            label: 'Assignable',
            type: 'select',
            initialValue: team.getIn(['attributesMap', 'Assignable', 0]),
            options: ['True', 'False'].map(el => ({ label: el, value: el })),
          },
          {
            name: 'icon',
            label: 'Icon',
            type: 'text',
            initialValue: team.getIn(['attributesMap', 'Icon', 0]),
            component: FormComponents.IconField,
          },
        ]}
      alterFields={{
        description: {
          component: FormComponents.TextAreaField,
        },
        attributesMap: {
          serialize: ({ values }) => ({
            Assignable: asArray(values.get('assignable')),
            Icon: asArray(values.get('icon')),
          }),
        },
      }}
      onSave={handleSave}
    >
      {({ form, bindings: { form: formBindings }, initialized }) =>
        initialized && (
          <Fragment>
            <div className="page-panel page-panel--two-thirds page-panel--white">
              <div className="page-title">
                <div
                  role="navigation"
                  aria-label="breadcrumbs"
                  className="page-title__breadcrumbs"
                >
                  <span className="breadcrumb-item">
                    <Link to="/settings">
                      <I18n>settings</I18n>
                    </Link>{' '}
                    /{' '}
                    <Link to="/settings/teams">
                      <I18n>teams</I18n>
                    </Link>{' '}
                    /
                  </span>
                  <h1>
                    <I18n>Edit Team</I18n>
                  </h1>
                </div>
              </div>
              {form}
            </div>
            <div className="page-panel page-panel--one-thirds page-panel--sidebar">
              <br />
              <TeamCard
                team={getIn(form, ['props', 'bindings', 'team'], []).toJS()}
              />
            </div>
          </Fragment>
        )
      }
    </TeamForm>
  </div>
);

// TODO implement handleDelete
export const TeamEdit = compose(
  withHandlers({
    handleSave: props => () => team => {
      refetchTable(props.tableKey);
      addToast(`${team.name} updated successfully.`);
    },
  }),
)(TeamEditComponent);

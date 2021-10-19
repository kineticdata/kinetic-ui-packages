import React, { Fragment } from 'react';
import { TeamForm, I18n, refetchTable } from '@kineticdata/react';
import { compose, withHandlers } from 'recompose';
import { FormComponents, addToast } from '@kineticdata/bundle-common';
import { PageTitle } from '../shared/PageTitle';
import { Link } from '@reach/router';

const asArray = value => (value ? [value] : []);

const FormLayout = ({ fields, error, buttons }) => (
  <form>
    <div className="section__title">
      <span className="title">
        <I18n>General</I18n>
      </span>
    </div>
    {fields.get('parentTeam')}
    {fields.get('localName')}
    {fields.get('description')}
    {fields.get('assignable')}
    {fields.get('icon')}
    <br />
    <div className="section__title">
      <span className="title">
        <I18n>Memberships</I18n>
      </span>
    </div>
    {fields.get('memberships')}
    <br />
    {error}
    {buttons}
  </form>
);

const TeamEditComponent = ({
  formKey,
  slug,
  handleSave,
  handleDelete,
  appLocation,
}) => (
  <div className="page-container page-container--panels">
    <TeamForm
      formKey={formKey}
      teamSlug={slug}
      components={{
        FormError: FormComponents.FormError,
        FormButtons: FormComponents.generateFormButtons({
          handleDelete,
          submitLabel: 'Update Team',
          cancelPath: '..',
          components: { Link },
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
      {({ form, bindings: { team, values }, initialized }) =>
        initialized && (
          <Fragment>
            <div className="page-panel">
              <PageTitle
                parts={[`Edit Team`, 'Teams']}
                breadcrumbs={[
                  { label: 'Home', to: '/' },
                  { label: 'Settings', to: '../..' },
                  { label: 'Teams', to: '..' },
                ]}
                title={team && team.get('name')}
              />
              <div className="form-unstyled mb-5">{form}</div>
            </div>
          </Fragment>
        )
      }
    </TeamForm>
  </div>
);

// TODO implement handleDelete?
export const TeamEdit = compose(
  withHandlers({
    handleSave: props => () => team => {
      refetchTable(props.tableKey);
      addToast(`${team.name} updated successfully.`);
    },
  }),
)(TeamEditComponent);

import React from 'react';
import { compose, withHandlers } from 'recompose';
import { UserForm, I18n, refetchTable } from '@kineticdata/react';
import { FormComponents, addToast } from '@kineticdata/bundle-common';
import { PageTitle } from '../shared/PageTitle';
import { Link } from '@reach/router';

const asArray = value => (value ? [value] : []);

const FormLayout = ({ fields, error, buttons }) => (
  <form>
    <div className="section__title">
      <I18n>General</I18n>
    </div>
    {fields.get('spaceAdmin')}
    {fields.get('enabled')}
    {fields.get('displayName')}
    {fields.get('email')}
    <br />
    <div className="section__title">
      <I18n>Profile Attributes</I18n>
    </div>
    {fields.get('firstName')}
    {fields.get('lastName')}
    {fields.get('phoneNumber')}
    <br />
    <div className="section__title">
      <I18n>User Attributes</I18n>
    </div>
    {fields.get('department')}
    {fields.get('manager')}
    {fields.get('organization')}
    {fields.get('site')}
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

export const UserEditComponent = ({
  formKey,
  username,
  handleSave,
  handleDelete,
}) => (
  <div className="page-container">
    <PageTitle parts={['Edit User', 'Users']} />{' '}
    <UserForm
      key={username}
      formkey={`user-edit`}
      username={username ? username : null}
      components={{
        FormError: FormComponents.FormError,
        FormButtons: FormComponents.generateFormButtons({
          handleDelete,
          submitLabel: 'Update User',
          cancelPath: '..',
          components: { Link },
        }),
        FormLayout,
      }}
      addFields={() => ({ user }) =>
        user && [
          {
            name: 'firstName',
            label: 'First Name',
            type: 'text',
            initialValue: user.getIn(['profileAttributesMap', 'First Name', 0]),
          },
          {
            name: 'lastName',
            label: 'Last Name',
            type: 'text',
            initialValue: user.getIn(['profileAttributesMap', 'Last Name', 0]),
          },
          {
            name: 'phoneNumber',
            label: 'Phone Number',
            type: 'text',
            initialValue: user.getIn([
              'profileAttributesMap',
              'Phone Number',
              0,
            ]),
          },
          {
            name: 'department',
            label: 'Department',
            type: 'text',
            initialValue: user.getIn(['attributesMap', 'Department', 0]),
          },
          {
            name: 'manager',
            label: 'Manager',
            type: 'text',
            initialValue: user.getIn(['attributesMap', 'Manager', 0]),
          },
          {
            name: 'organization',
            label: 'Organization',
            type: 'text',
            initialValue: user.getIn(['attributesMap', 'Organization', 0]),
          },
          {
            name: 'site',
            label: 'Site',
            type: 'text',
            initialValue: user.getIn(['attributesMap', 'Site', 0]),
          },
        ]}
      alterFields={{
        profileAttributesMap: {
          serialize: ({ values }) => ({
            'First Name': asArray(values.get('firstName')),
            'Last Name': asArray(values.get('lastName')),
            'Phone Number': asArray(values.get('phoneNumber')),
          }),
        },
        attributesMap: {
          serialize: ({ values }) => ({
            Department: asArray(values.get('department')),
            Manager: asArray(values.get('manager')),
            Organization: asArray(values.get('organization')),
            Site: asArray(values.get('site')),
          }),
        },
      }}
      onSave={handleSave}
    >
      {({ form, bindings: { user }, initialized }) =>
        initialized && (
          <div className="page-panel page-panel--white">
            <div className="page-title">
              <div
                role="navigation"
                aria-label="breadcrumbs"
                className="page-title__breadcrumbs"
              >
                <span className="breadcrumb-item">
                  <Link to="../..">
                    <I18n>settings</I18n>
                  </Link>{' '}
                  /{' '}
                  <Link to="..">
                    <I18n>users</I18n>
                  </Link>{' '}
                  /
                </span>
                <h1>{user && user.get('username')}</h1>
              </div>
            </div>
            {form}
          </div>
        )
      }
    </UserForm>
  </div>
);

// TODO implement handleDelete?
export const UserEdit = compose(
  withHandlers({
    handleSave: props => () => user => {
      refetchTable(props.tableKey);
      addToast(`${user.username} updated successfully.`);
    },
  }),
)(UserEditComponent);

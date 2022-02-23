import React, { Fragment } from 'react';
import {
  I18n,
  KappForm,
  SubmissionSearch,
  searchSubmissions,
} from '@kineticdata/react';
import { compose, withHandlers } from 'recompose';
import { connect } from '../../redux/store';
import { FormComponents, addToast } from '@kineticdata/bundle-common';
import { PageTitle } from '../shared/PageTitle';

const fieldSet = [
  'name',
  'icon',
  'notificationComplete',
  'notificationCreate',
  'attributesMap',
];

const FormLayout = ({ fields, error, buttons }) => (
  <Fragment>
    <h2 className="section__title">
      <span className="title">
        <I18n>Display Options</I18n>
      </span>
    </h2>
    {fields.get('name')}
    {fields.get('icon')}
    <br />
    <h2 className="section__title">
      <span className="title">
        <I18n>Form Mapping</I18n>
      </span>
    </h2>
    {fields.get('notificationComplete')}
    {fields.get('notificationCreate')}
    {error}
    {buttons}
  </Fragment>
);

// const initialFormValue = (object, attributeName) =>
//   object.hasIn(['attributesMap', attributeName, 0])
//     ? { slug: object.getIn(['attributesMap', attributeName, 0]) }
//     : null;

const asArray = value => (value ? [value] : []);

const notificationSearch = new SubmissionSearch(true)
  .index('values[Name]')
  .includes(['values'])
  .limit(1000)
  .build();

export const QueueSettingsComponent = ({ currentKapp, onSave }) => (
  <KappForm
    kappSlug={currentKapp.slug}
    fieldSet={fieldSet}
    onSave={onSave}
    components={{ FormLayout }}
    addDataSources={{
      notifications: {
        fn: searchSubmissions,
        params: [
          {
            datastore: true,
            form: 'notification-data',
            search: notificationSearch,
          },
        ],
        transform: result => result.submissions,
      },
    }}
    addFields={() => ({ kapp, notifications }) =>
      kapp &&
      notifications && [
        {
          name: 'icon',
          label: 'Display Icon',
          type: 'text',
          helpText: 'Font Awesome icon to display in Kapp links.',
          initialValue: kapp.getIn(['attributesMap', 'Icon', 0]),
          component: FormComponents.IconField,
        },
        {
          name: 'notificationComplete',
          label: 'Default Request Submitted Notification Template',
          type: 'select',
          renderAttributes: { typeahead: true },
          helpText:
            "Name of the Notification Template to use when this kapp's submissions are completed.",
          initialValue: kapp.getIn([
            'attributesMap',
            'Notification Template Name - Complete',
            0,
          ]),
          options: notifications
            ? notifications
                .map(notification => ({
                  label: notification.getIn(['values', 'Name']),
                  value: notification.getIn(['values', 'Name']),
                  slug: notification.get('id'),
                }))
                .toJS()
            : [],
          component: FormComponents.NotificationField,
        },
        {
          name: 'notificationCreate',
          label: 'Default Request Created Notification Template',
          type: 'select',
          renderAttributes: { typeahead: true },
          helpText:
            "Name of the Notification Template to use when this kapp's submissions are submitted.",
          initialValue: kapp.getIn([
            'attributesMap',
            'Notification Template Name - Create',
            0,
          ]),
          options: notifications
            ? notifications
                .map(notification => ({
                  label: notification.getIn(['values', 'Name']),
                  value: notification.getIn(['values', 'Name']),
                  slug: notification.get('id'),
                }))
                .toJS()
            : [],
          component: FormComponents.NotificationField,
        },
      ]}
    alterFields={{
      name: {
        helpText: 'The name of the Kapp referenced throughout the Kapp.',
      },
      attributesMap: {
        serialize: ({ values }) => ({
          Icon: asArray(values.get('icon')),
          'Notification Template Name - Complete': asArray(
            values.getIn(['notificationComplete']),
          ),
          'Notification Template Name - Create': asArray(
            values.getIn(['notificationCreate']),
          ),
        }),
      },
    }}
  >
    {({ form, initialized }) => (
      <div className="page-container">
        <div className="page-panel ">
          <PageTitle
            parts={['General']}
            settings
            breadcrumbs={[
              { label: 'Home', to: '/' },
              { label: `${currentKapp.name} Settings`, to: '..' },
            ]}
            title="General Settings"
          />
          {initialized && (
            <section className="form form-unstyled mb-5">{form}</section>
          )}
        </div>
      </div>
    )}
  </KappForm>
);

const mapStateToProps = state => ({
  currentKapp: state.app.kapp,
  reloadApp: state.app.actions.refreshApp,
});

// Settings Container
export const QueueSettings = compose(
  connect(mapStateToProps),
  withHandlers({
    onSave: props => () => () => {
      addToast(`${props.currentKapp.name} settings saved successfully.`);
      props.reloadApp();
    },
  }),
)(QueueSettingsComponent);

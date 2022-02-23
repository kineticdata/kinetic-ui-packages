import React, { Fragment } from 'react';
import {
  I18n,
  FormForm,
  SubmissionSearch,
  searchSubmissions,
} from '@kineticdata/react';
import { compose, withHandlers } from 'recompose';
import { connect } from '../../../redux/store';
import {
  FormComponents,
  LoadingMessage,
  addToast,
} from '@kineticdata/bundle-common';
import {
  actions,
  buildFormConfigurationObject,
} from '../../../redux/modules/settingsForms';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { PageTitle } from '../../shared/PageTitle';
import { List } from 'immutable';

export const FieldsTableField = props => (
  <table className="table table-hover table--settings table-draggable">
    <thead>
      <tr className="header">
        <th scope="col">
          <I18n>Field</I18n>
        </th>
        <th scope="col">
          <I18n>Visible in Table</I18n>
        </th>
      </tr>
    </thead>
    {props.value && (
      <DragDropContext
        onDragEnd={({ source, destination }) =>
          destination &&
          source.index !== destination.index &&
          props.onChange(
            props.value.update(cols => {
              const col = cols.get(source.index);
              return cols.delete(source.index).insert(destination.index, col);
            }),
          )
        }
      >
        <Droppable droppableId="columns">
          {provided => (
            <tbody ref={provided.innerRef}>
              {props.value.map((col, index) => (
                <Draggable key={col.name} draggableId={col.name} index={index}>
                  {(provided, snapshot) => (
                    <tr
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      className={`${snapshot.isDragging ? 'dragging' : ''}`}
                    >
                      <td>
                        {col.type === 'value' ? (
                          <I18n>{col.label}</I18n>
                        ) : (
                          <i>
                            <I18n>{col.label}</I18n>{' '}
                            <small>
                              <I18n>(system field)</I18n>
                            </small>
                          </i>
                        )}
                      </td>
                      <td>
                        <input
                          onChange={e =>
                            props.onChange(
                              props.value.setIn(
                                [index, 'visible'],
                                e.target.checked,
                              ),
                            )
                          }
                          type="checkbox"
                          checked={col.visible}
                        />
                      </td>
                    </tr>
                  )}
                </Draggable>
              ))}
            </tbody>
          )}
        </Droppable>
      </DragDropContext>
    )}
    {props.helpText && (
      <tfoot>
        <tr>
          <td colSpan="2">
            <small>{props.helpText}</small>
          </td>
        </tr>
      </tfoot>
    )}
  </table>
);

const fieldSet = [
  'name',
  'slug',
  'status',
  'type',
  'submissionLabelExpression',
  'description',
  'attributesMap',
  'submissionTableFields',
  'prohibitSubtasks',
  'permittedSubtasks',
  'owningTeam',
  'allowReassignment',
  'assignableTeams',
  'notificationComplete',
  'notificationCreate',
];

const FormLayout = ({ fields, error, buttons }) => (
  <Fragment>
    <h2 className="section__title">
      <span className="title">
        <I18n>General</I18n>
      </span>
    </h2>
    <div className="form-group__columns">
      {fields.get('name')}
      {fields.get('slug')}
    </div>
    <div className="form-group__columns">
      {fields.get('status')}
      {fields.get('type')}
    </div>
    {fields.get('submissionLabelExpression')}
    {fields.get('description')}
    <br />
    <h2 className="section__title">
      <span className="title">
        <I18n>Attributes</I18n>
      </span>
    </h2>
    {fields.get('prohibitSubtasks')}
    {fields.get('permittedSubtasks')}
    {fields.get('owningTeam')}
    {fields.get('allowReassignment')}
    {fields.get('assignableTeams')}
    {fields.get('notificationCreate')}
    {fields.get('notificationComplete')}
    <br />
    <h2 className="section__title">
      <span className="title">
        <I18n>Submission Table - Default Columns</I18n>
      </span>
    </h2>
    {fields.get('submissionTableFields')}
    {error}
    {buttons}
  </Fragment>
);

const asArray = value => (value ? [value] : []);

const notificationSearch = new SubmissionSearch(true)
  .index('values[Name]')
  .includes(['values'])
  .limit(1000)
  .build();

export const FormSettingsComponent = ({ form, kapp, onSave }) => {
  return (
    <FormForm
      kappSlug={kapp.slug}
      formSlug={form.slug}
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
      addFields={() => ({ form, notifications }) =>
        form &&
        notifications && [
          {
            name: 'prohibitSubtasks',
            label: 'Prohibit Subtasks',
            type: 'select',
            helpText: "Can users create subtasks for this form's submissions.",
            initialValue: form.getIn(['attributesMap', 'Prohibit Subtasks', 0]),
            options: ['Yes', 'No'].map(el => ({
              label: el,
              value: el,
            })),
          },
          {
            name: 'permittedSubtasks',
            label: 'Permitted Subtasks',
            type: 'text-multi',
            helpText:
              "Defines which forms may be submitted as subtasks to this form's submissions.",
            initialValue: form.getIn(['attributesMap', 'Permitted Subtasks', 0])
              ? form
                  .getIn(['attributesMap', 'Permitted Subtasks', 0])
                  .split(',')
              : [],
          },
          {
            name: 'owningTeam',
            label: 'Owning Team',
            type: 'team-multi',
            helpText: 'Teams responsible for maintaining this form.',
            initialValue: form
              .getIn(['attributesMap', 'Owning Team'], List())
              .map(name => ({ name }))
              .toJS(),
          },
          {
            name: 'allowReassignment',
            label: 'Allow Reassignment',
            type: 'select',
            helpText:
              'Can submissions of this form be reassigned to other teams.',
            initialValue: form.getIn([
              'attributesMap',
              'Allow Reassignment',
              0,
            ]),
            options: ['Yes', 'No'].map(el => ({
              label: el,
              value: el,
            })),
          },
          {
            name: 'assignableTeams',
            label: 'Assignable Teams',
            type: 'team-multi',
            helpText:
              'Teams to which submissions of this form can be reassigned to.',
            initialValue: form
              .getIn(['attributesMap', 'Assignable Teams'], List())
              .map(name => ({ name }))
              .toJS(),
          },
          {
            name: 'notificationCreate',
            label: 'Notification Template Name - Create',
            type: 'select',
            renderAttributes: { typeahead: true },
            helpText:
              "Name of the Notification Template to use when this form's submission is submitted. Defaults to value at Kapp level.",
            initialValue: form.getIn([
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
          {
            name: 'notificationComplete',
            label: 'Notification Template Name - Complete',
            type: 'select',
            renderAttributes: { typeahead: true },
            helpText:
              "Name of the Notification Template to use when this form's submission is completed. Defaults to value at Kapp level.",
            initialValue: form.getIn([
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
            name: 'submissionTableFields',
            label: 'Submission Table - Fields',
            type: 'custom',
            helpText:
              'Select which field columns should be visible by default when displaying submissions for this form in the settings pages. Drag and drop to change the order in which the columns will appear.',
            initialValue: buildFormConfigurationObject(form.toJS()).columns,
            component: FieldsTableField,
          },
        ]}
      alterFields={{
        description: { component: FormComponents.TextAreaField },
        attributesMap: {
          serialize: ({ values }) => ({
            'Prohibit Subtasks': asArray(values.get('prohibitSubtasks')),
            'Permitted Subtasks': asArray(
              values.get('permittedSubtasks').join(','),
            ),
            'Owning Team': values
              .get('owningTeam')
              .map(team => team.get('name')),
            'Allow Reassignment': asArray(values.get('allowReassignment')),
            'Assignable Teams': values
              .get('assignableTeams')
              .map(team => team.get('name')),
            'Notification Template Name - Create': asArray(
              values.get('notificationCreate'),
            ),
            'Notification Template Name - Complete': asArray(
              values.get('notificationComplete'),
            ),
            'Form Configuration': [
              // TODO Update to allow for other props in Form Config attribute
              JSON.stringify({
                columns: values.get('submissionTableFields').toJS(),
              }),
            ],
          }),
        },
      }}
    >
      {({ form: formContent, initialized }) => (
        <div className="page-container">
          <div className="page-panel">
            <PageTitle
              parts={[`${form.name} Settings`, 'Forms']}
              settings
              breadcrumbs={[
                { label: 'Home', to: '/' },
                { label: `${kapp.name} Settings`, to: '../../..' },
                { label: 'Forms', to: '../..' },
                { label: form.name, to: '..' },
              ]}
              title="Settings"
              actions={[
                {
                  label: 'Form Builder',
                  icon: 'mouse-pointer',
                  href: `/app/builder/#/${kapp.slug}/forms/${
                    form.slug
                  }/builder`,
                },
              ]}
            />
            {initialized ? (
              <section className="form form-unstyled mb-5">
                {formContent}
              </section>
            ) : (
              <LoadingMessage />
            )}
          </div>
        </div>
      )}
    </FormForm>
  );
};

const mapStateToProps = state => ({
  kapp: state.app.kapp,
});

const mapDispatchToProps = { fetchFormRequest: actions.fetchForm };

export const FormSettings = compose(
  connect(
    mapStateToProps,
    mapDispatchToProps,
  ),
  withHandlers({
    onSave: props => () => () => {
      props.fetchFormRequest({
        kappSlug: props.kapp.slug,
        formSlug: props.form.slug,
      });
      addToast(`${props.form.name} settings saved successfully.`);
    },
  }),
)(FormSettingsComponent);

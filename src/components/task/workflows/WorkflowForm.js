import React from 'react';
import {
  fetchSources,
  fetchSource,
  createTree,
  fetchTaskCategories,
  fetchSpace,
  fetchKapp,
} from '../../../apis';
import { Form } from '../../form/Form';
import { get, List, Map } from 'immutable';
import { buildCodeEditorBindings } from '../../../helpers';

const SPACE_INCLUDES =
  'spaceAttributeDefinitions,teamAttributeDefinitions,userAttributeDefinitions,userProfileAttributeDefinitions';
const KAPP_INCLUDES =
  'formAttributeDefinitions,kappAttributeDefinitions,fields';

// bulids a definition id based on a name (similar to slugify)
const buildDefinitionId = text =>
  text
    .trim()
    // Convert uppercase to lowercase
    .toLowerCase()
    // Replace spaces with _
    .replace(/\s+/g, '_')
    // Remove unwanted chars
    .replace(/[^A-Za-z0-9_]+/g, '');

const dataSources = ({ kappSlug, workflow }) => ({
  selectedSource: {
    fn: fetchSource,
    params: ({ values }) =>
      values &&
      values.get('sourceName') && [
        {
          sourceName: values.get('sourceName'),
          include: 'predefinedSourceGroups,predefinedTreeNames',
        },
      ],
    transform: result => result.source,
  },
  sources: {
    fn: fetchSources,
    params: [],
    transform: result =>
      result.sources.map(s => ({
        label: s.name,
        value: s.name,
      })),
  },
  categories: {
    fn: fetchTaskCategories,
    params: [],
    transform: result => result.categories,
  },
  space: {
    fn: fetchSpace,
    params: [{ include: SPACE_INCLUDES }],
    transform: result => result.space,
  },
  kapp: {
    fn: fetchKapp,
    params: kappSlug && [{ kappSlug, include: KAPP_INCLUDES }],
    transform: result => result.kapp,
  },
});

const handleSubmit = ({ workflow }) => values => {
  if (!workflow) {
    return createTree({ tree: values.toJS() }).then(({ tree, error }) => {
      if (error) {
        throw (error.statusCode === 400 && error.message) ||
          'There was an error saving the workflow';
      } else {
        return tree;
      }
    });
  } else {
    return values.toObject();
  }
};

const fields = ({ name, workflow, workflowType }) => ({ categories }) =>
  (!name || workflow) &&
  categories && [
    {
      name: 'sourceName',
      label: 'Source',
      type: 'select',
      required: true,
      options: ({ sources }) => sources,
      initialValue: workflow
        ? workflow.get('sourceName')
        : workflowType === 'routines'
          ? '-'
          : '',
      helpText:
        'The application that is calling and getting the results back from the workflow.',
      visible: !workflow || !workflow.get('event'),
    },
    {
      name: 'sourceGroup',
      label: 'Source Group',
      type: 'text',
      required: true,
      options: ({ selectedSource }) =>
        selectedSource
          ? selectedSource
              .get('predefinedSourceGroups')
              .map(g => Map({ label: g, value: g }))
          : List(),

      initialValue: workflow
        ? workflow.get('sourceGroup')
        : workflowType === 'routines'
          ? '-'
          : '',
      helpText:
        "Categorization of the workflow based on rules provided by the Source. For Request CE it's the combination of the type (submission of form), Kapp Slug and the Form Slug separated by a greater than sign ( > ). Example: Submissions > services > onboarding.",
      visible: !workflow || !workflow.get('event'),
    },
    {
      name: 'event',
      label: 'Event',
      type: 'text',
      initialValue: workflow ? workflow.get('event') : '',
      required: workflow && !!workflow.get('event'),
      visible: workflow && !!workflow.get('event'),
      enabled: false,
    },
    {
      name: 'filter',
      label: 'Filter',
      type: 'code',
      language: 'js-expression',
      initialValue: (workflow && workflow.get('filter')) || '',
      required: false,
      // use event to show filter on linked workflows
      visible: workflow && !!workflow.get('event'),
      options: ({ space, kapp, values }) => {
        const type = ['Space', 'Team', 'User', 'Form', 'Submission'].find(
          type => values.get('event')?.startsWith(type),
        );
        return buildCodeEditorBindings({
          space: {
            attributeDefinitions: space?.get('spaceAttributeDefinitions'),
          },
          user: type === 'User' && {
            attributeDefinitions: space?.get('userAttributeDefinitions'),
            profileAttributeDefinitions: space?.get(
              'userProfileAttributeDefinitions',
            ),
          },
          team: type === 'Team' && {
            attributeDefinitions: space?.get('teamAttributeDefinitions'),
          },
          kapp: ['Form', 'Submission'].includes(type) && {
            attributeDefinitions: kapp?.get('kappAttributeDefinitions'),
          },
          form: ['Form', 'Submission'].includes(type) && {
            attributeDefinitions: kapp?.get('formAttributeDefinitions'),
          },
          submission: type === 'Submission' && { detailed: true },
          values: type === 'Submission' &&
            kapp?.get('fields').size > 0 && { data: kapp.get('fields') },
        });
      },
    },
    {
      name: 'name',
      label: 'Name',
      type: 'text',
      required: true,
      options: ({ selectedSource }) =>
        selectedSource
          ? selectedSource
              .get('predefinedTreeNames')
              .map(n => Map({ label: n, value: n }))
          : List(),
      onChange: ({ values }, { setValue }) => {
        if (values.has('definitionId') && values.get('linked')) {
          setValue(
            'definitionId',
            buildDefinitionId(values.get('name')),
            false,
          );
        }
      },
      initialValue: workflow ? workflow.get('name') : '',
      helpText:
        'Name is generally the event that causes the tree or routine to be run. Example: Category Update.',
    },
    {
      name: 'linked',
      label: 'Linked',
      type: 'checkbox',
      transient: true,
      initialValue: !name && !workflow,
      visible: false,
    },
    workflowType !== 'trees' && {
      name: 'definitionId',
      label: 'Definition ID',
      type: 'text',
      enabled: !name && !workflow,
      required: true,
      onChange: (_bindings, { setValue }) => {
        setValue('linked', false);
      },
      initialValue: get(workflow, 'definitionId', '') || '',
      helpText:
        'Definition ID is generated by the system and used for API requests',
      serialize: ({ values }) =>
        name || workflow
          ? values.get('definitionId')
          : `routine_${values.get('definitionId')}`,
    },
    {
      name: 'notes',
      label: 'Notes',
      type: 'text',
      required: false,
      initialValue:
        get(workflow, 'notes', null) === null ? '' : get(workflow, 'notes'),
    },
    {
      name: 'ownerEmail',
      label: 'Process Owner Email',
      type: 'text',
      required: false,
      initialValue:
        get(workflow, 'ownerEmail', null) === null
          ? ''
          : get(workflow, 'ownerEmail'),
    },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      required: true,
      options: [
        { label: 'Active', value: 'Active' },
        { label: 'Inactive', value: 'Inactive' },
        { label: 'Paused', value: 'Paused' },
      ],
      initialValue: get(workflow, 'status', 'Active'),
      helpText:
        'Determines whether the workflow is available to be called. Triggers for paused workflows will go into a Staged status',
    },
    workflowType !== 'trees' && {
      name: 'categories',
      label: 'Categories',
      type: 'select-multi',
      initialValue: get(workflow, 'categories', List()),
      options: categories
        .sortBy(c => c.get('name'))
        .map(c => Map({ label: c.get('name'), value: c.get('name') })),
    },
    workflowType !== 'trees' && {
      name: 'inputs',
      label: 'Inputs',
      type: 'table',
      options: [
        { name: 'drag', label: null, type: 'drag' },
        { name: 'name', label: 'Name', type: 'text' },
        { name: 'defaultValue', label: 'Default Value', type: 'text' },
        { name: 'description', label: 'Description', type: 'text' },
        { name: 'required', label: 'Required', type: 'checkbox' },
      ],
      initialValue: get(workflow, 'inputs', List()),
    },
    workflowType !== 'trees' && {
      name: 'outputs',
      label: 'Outputs',
      type: 'table',
      options: [
        { name: 'drag', label: null, type: 'drag' },
        { name: 'name', label: 'Name', type: 'text' },
        { name: 'description', label: 'Description', type: 'text' },
      ],
      initialValue: get(workflow, 'outputs', List()),
    },
  ];

export const WorkflowForm = ({
  addFields,
  alterFields,
  fieldSet,
  formKey,
  components,
  onSave,
  onError,
  children,
  workflow,
  workflowType,
  uncontrolled,
  kappSlug,
}) => (
  <Form
    addFields={addFields}
    alterFields={alterFields}
    fieldSet={fieldSet}
    formKey={formKey}
    components={components}
    onSubmit={handleSubmit}
    onSave={onSave}
    onError={onError}
    dataSources={dataSources}
    fields={fields}
    formOptions={{ kappSlug, workflow, workflowType }}
    uncontrolled={uncontrolled}
  >
    {children}
  </Form>
);

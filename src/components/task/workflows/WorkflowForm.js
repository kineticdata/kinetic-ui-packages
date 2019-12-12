import React from 'react';
import {
  fetchTree,
  fetchSources,
  fetchSource,
  updateTree,
  createTree,
  fetchTaskCategories,
} from '../../../apis';
import { Form } from '../../form/Form';
import { get, List, Map } from 'immutable';

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

const dataSources = ({ workflowType, sourceName, sourceGroup, name }) => {
  return {
    workflow: {
      fn: fetchTree,
      params: name && [
        {
          type: workflowType || 'Tree',
          sourceName,
          sourceGroup,
          name,
          include: 'details,inputs,outputs,categories',
        },
      ],
      transform: result => result.tree,
    },
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
          label: s.name === '-' ? 'Adhoc' : s.name,
          value: s.name,
        })),
    },
    categories: {
      fn: fetchTaskCategories,
      params: [],
      transform: result => result.categories,
    },
  };
};

const handleSubmit = ({ sourceName, sourceGroup, name }) => values =>
  (name
    ? updateTree({ sourceName, sourceGroup, name, tree: values.toJS() })
    : createTree({ tree: values.toJS() })
  ).then(({ tree, error }) => {
    if (error) {
      throw (error.statusCode === 400 && error.message) ||
        'There was an error saving the workflow';
    } else {
      return tree;
    }
  });

const fields = ({ name, workflowType }) => ({ workflow, categories }) =>
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
    },
    {
      name: 'sourceGroup',
      label: 'Source Group',
      type: 'text',
      required: true,
      options: ({ selectedSource }) =>
        selectedSource &&
        selectedSource
          .get('predefinedSourceGroups')
          .map(g => Map({ label: g, value: g })),

      initialValue: workflow
        ? workflow.get('sourceGroup')
        : workflowType === 'routines'
        ? '-'
        : '',
      helpText:
        "Categorization of the workflow based on rules provided by the Source. For Request CE it's the combination of the type (submission of form), Kapp Slug and the Form Slug separated by a greater than sign ( > ). Example: Submissions > services > onboarding.",
    },
    {
      name: 'name',
      label: 'Name',
      type: 'text',
      required: true,
      options: ({ selectedSource }) =>
        selectedSource &&
        selectedSource
          .get('predefinedTreeNames')
          .map(n => Map({ label: n, value: n })),
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
      initialValue: !name,
      visible: false,
    },
    workflowType !== 'trees' && {
      name: 'definitionId',
      label: 'Definition ID',
      type: 'text',
      enabled: name ? false : true,
      required: true,
      onChange: (_bindings, { setValue }) => {
        setValue('linked', false);
      },
      initialValue: get(workflow, 'definitionId', '') || '',
      helpText:
        'Definition ID is generated by the system and used for API requests',
      serialize: ({ values }) =>
        name
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
      initialValue: get(workflow, 'categories', List()).map(c => c.get('name')),
      options: categories.map(c =>
        Map({ label: c.get('name'), value: c.get('name') }),
      ),
    },
    workflowType !== 'trees' && {
      name: 'inputs',
      label: 'Inputs',
      type: 'table',
      options: [
        { name: 'name', label: 'Name', type: 'text' },
        { name: 'defaultValue', label: 'Default Value', type: 'text' },
        { name: 'description', label: 'Description', type: 'text' },
        { name: 'required', label: 'Required', type: 'checkbox' },
      ],
      initialValue: get(workflow, 'inputs', []),
    },
    workflowType !== 'trees' && {
      name: 'outputs',
      label: 'Outputs',
      type: 'table',
      options: [
        { name: 'name', label: 'Name', type: 'text' },
        { name: 'description', label: 'Description', type: 'text' },
      ],
      initialValue: get(workflow, 'outputs', []),
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
  workflowType,
  sourceName,
  sourceGroup,
  name,
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
    formOptions={{ workflowType, sourceName, sourceGroup, name }}
  >
    {children}
  </Form>
);

import React from 'react';
import t from 'prop-types';
import { Map } from 'immutable';
import {
  createTaskCategory,
  fetchTaskCategory,
  updateTaskCategory,
  fetchHandlers,
  fetchTrees,
  fetchPolicyRules,
} from '../../../apis';
import { Form } from '../../form/Form';

const dataSources = ({ categoryName }) => ({
  category: {
    fn: fetchTaskCategory,
    params: categoryName && [
      { categoryName, include: 'details,handlers,trees,policyRules' },
    ],
    transform: result => result.category,
  },
  handlers: {
    fn: fetchHandlers,
    params: [{ include: 'details' }],
    transform: result => result.handlers,
  },
  routines: {
    fn: fetchTrees,
    params: [{ type: 'Global Routine', include: 'details' }],
    transform: result => result.trees,
  },
  policyRules: {
    fn: fetchPolicyRules,
    params: [{ type: 'Category Access', include: 'details' }],
    transform: result => result.policyRules,
  },
});

const handleSubmit = ({ categoryName }) => values =>
  (categoryName ? updateTaskCategory : createTaskCategory)({
    category: values.toJS(),
    categoryName,
  }).then(({ category, error }) => {
    if (error) {
      throw (error.statusCode === 400 && error.message) ||
        'There was an error saving the category';
    }
    return category;
  });

const fields = ({ categoryName }) => ({ category }) =>
  (!categoryName || category) && [
    {
      name: 'name',
      label: 'Name',
      type: 'text',
      required: true,
      initialValue: category ? category.get('name') : '',
      helpText: 'User friendly name for the category.',
    },
    {
      name: 'description',
      label: 'Description',
      type: 'text',
      required: false,
      initialValue:
        category && category.get('description') !== null
          ? category.get('description')
          : '',
    },
    {
      name: 'handlers',
      label: 'Handlers',
      type: 'select-multi',
      required: false,
      options: ({ handlers }) =>
        handlers
          ? handlers.map(handler =>
              Map({
                label: handler.get('name'),
                value: handler.get('definitionId'),
              }),
            )
          : [],
      initialValue: category
        ? category.get('handlers').map(handler => handler.get('definitionId'))
        : [],
      serialize: ({ values }) =>
        values.get('handlers').map(definitionId => definitionId),
    },
    {
      name: 'trees',
      label: 'Global Routines',
      type: 'select-multi',
      required: false,
      options: ({ routines }) =>
        routines
          ? routines.map(routine =>
              Map({
                label: routine.get('name'),
                value: routine.get('definitionId'),
              }),
            )
          : [],
      initialValue: category
        ? category.get('trees').map(tree => tree.get('definitionId'))
        : [],
      serialize: ({ values }) =>
        values.get('trees').map(definitionId => definitionId),
    },
    {
      name: 'policyRules',
      label: 'Policy Rules',
      type: 'select-multi',
      required: false,
      options: ({ policyRules }) =>
        policyRules
          ? policyRules.map(policyRule =>
              Map({
                label: policyRule.get('name'),
                value: policyRule.get('name'),
              }),
            )
          : [],
      initialValue: category
        ? category.get('policyRules').map(policyRule => policyRule.get('name'))
        : [],
      serialize: ({ values }) => values.get('policyRules').map(name => name),
    },
  ];

export const TaskCategoryForm = ({
  addFields,
  alterFields,
  fieldSet,
  formKey,
  components,
  onSave,
  onError,
  children,
  categoryName,
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
    formOptions={{ categoryName }}
  >
    {children}
  </Form>
);

TaskCategoryForm.propTypes = {
  /** The name of the category being edited. Leave blank if creating a new category */
  categoryName: t.string,
};

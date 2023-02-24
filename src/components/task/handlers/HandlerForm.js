import React from 'react';
import {
  fetchHandler,
  fetchTaskCategories,
  updateHandler,
} from '../../../apis';
import { Form } from '../../form/Form';
import { get, Map, List } from 'immutable';
import { buildPropertyFields } from '../../form/Form.helpers';

const dataSources = ({ definitionId }) => ({
  handler: {
    fn: fetchHandler,
    params: definitionId && [
      {
        definitionId,
        include: 'details,categories,parameters,results,properties',
      },
    ],
    transform: result => result.handler,
  },
  categories: {
    fn: fetchTaskCategories,
    params: [],
    transform: result => result.categories,
  },
});

const handleSubmit = ({ definitionId }) => values => {
  updateHandler({ definitionId, handler: values.toJS() }).then(
    ({ handler, error }) => {
      if (error) {
        throw (error.statusCode === 400 && error.message) ||
          'There was an error saving the handler';
      } else {
        return handler;
      }
    },
  );
};

const fields = ({ definitionId }) => ({ handler, categories }) => {
  if (!(definitionId && handler && categories)) {
    return false;
  }

  const { propertiesFields, propertiesSerialize } = buildPropertyFields({
    isNew: false,
    properties: handler.get('properties'),
    getName: property => property.get('name'),
    getRequired: property => property.get('required'),
    getSensitive: property => property.get('type') === 'Encrypted',
    getValue: property =>
      property.get('type') === 'Encrypted'
        ? ''
        : property.get('value') === null
        ? ''
        : property.get('value'),
  });

  return (
    definitionId &&
    handler &&
    categories &&
    [
      {
        name: 'definitionId',
        label: 'Definition ID',
        type: 'text',
        transient: true,
        enabled: false,
        initialValue: get(handler, 'definitionId', ''),
      },

      {
        name: 'definitionName',
        label: 'Definition Name',
        type: 'text',
        transient: true,
        enabled: false,
        initialValue: get(handler, 'definitionName', ''),
      },

      {
        name: 'definitionVersion',
        label: 'Definition Version',
        type: 'text',
        transient: true,
        enabled: false,
        initialValue: get(handler, 'definitionVersion', ''),
      },
      {
        name: 'name',
        label: 'Name',
        type: 'text',
        transient: true,
        enabled: false,
        initialValue: get(handler, 'name', ''),
      },
      {
        name: 'description',
        label: 'Description',
        type: 'text',
        transient: true,
        enabled: false,
        initialValue: get(handler, 'description', ''),
      },
      {
        name: 'status',
        label: 'Status',
        type: 'select',
        required: true,
        options: [
          { label: 'Active', value: 'Active' },
          { label: 'Paused', value: 'Paused' },
        ],
        initialValue: get(handler, 'status', ''),
      },
      {
        name: 'categories',
        label: 'Categories',
        type: 'select-multi',
        required: false,
        initialValue: get(handler, 'categories', List()).map(c =>
          c.get('name'),
        ),
        options: categories
          .sort((a, b) =>
            a
              .get('name')
              .toLowerCase()
              .localeCompare(b.get('name').toLowerCase()),
          )
          .map(c => Map({ label: c.get('name'), value: c.get('name') })),
        serialize: ({ values }) =>
          values
            .get('categories')
            .map(vc => categories.find(c => c.get('name') === vc)),
      },
      {
        name: 'properties',
        visible: false,
        initialValue: get(handler, 'properties', []),
        serialize: propertiesSerialize,
      },
    ].concat(propertiesFields)
  );
};

export const HandlerForm = ({
  addFields,
  alterFields,
  fieldSet,
  formKey,
  components,
  onSave,
  onError,
  children,
  definitionId,
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
    formOptions={{ definitionId }}
  >
    {children}
  </Form>
);

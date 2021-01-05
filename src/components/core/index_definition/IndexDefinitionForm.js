import {
  fetchForm,
  fetchKapp,
  fetchSpace,
  updateForm,
  updateSpace,
  updateKapp,
} from '../../../apis';
import { generateForm } from '../../form/Form';
import { INDEX_STATIC_PARTS } from '../../../helpers';

const getFields = form => form.get('fields');

const getIndexDefinition = (form, indexName) =>
  form
    .get('indexDefinitions')
    .find(indexDefinition => indexDefinition.get('name') === indexName);

const dataSources = ({ kappSlug, formSlug, indexName }) => ({
  form: {
    fn:
      !kappSlug && !formSlug
        ? fetchSpace
        : kappSlug && !formSlug
          ? fetchKapp
          : fetchForm,
    params: [
      {
        kappSlug,
        formSlug,
        include:
          'fields,indexDefinitions,indexDefinitions.unpopulatedForms,indexDefinitions.detatchedForms',
      },
    ],
    transform: result =>
      !kappSlug && !formSlug
        ? result.space
        : kappSlug && !formSlug
          ? result.kapp
          : result.form,
  },
  fields: {
    fn: getFields,
    params: ({ form }) => form && [form],
  },
  indexDefinition: {
    fn: getIndexDefinition,
    params: ({ form }) => form && indexName && [form, indexName],
  },
});

const handleSubmit = ({ formSlug, kappSlug, indexName }) => (
  values,
  { form },
) => {
  const indexDefinitions = indexName
    ? form
        .get('indexDefinitions')
        .map(
          indexDefinition =>
            indexDefinition.get('name') === indexName
              ? values
              : indexDefinition,
        )
        .toJS()
    : form
        .get('indexDefinitions')
        .push(values)
        .toJS();

  return (!kappSlug && !formSlug
    ? updateSpace({ space: { indexDefinitions } })
    : kappSlug && !formSlug
      ? updateKapp({ kappSlug, kapp: { indexDefinitions } })
      : updateForm({
          kappSlug,
          formSlug,
          form: {
            indexDefinitions,
          },
        })
  ).then(({ form, kapp, space, error }) => {
    if (error) {
      throw (error.statusCode === 400 && error.message) ||
        'There was an error saving the index definition';
    }
    return !kappSlug && !formSlug ? space : kappSlug && !formSlug ? kapp : form;
  });
};

const fields = ({ formSlug, indexName }) => ({ indexDefinition }) =>
  (!indexName || indexDefinition) && [
    {
      name: 'parts',
      label: 'Parts',
      type: 'select-multi',
      required: true,
      options: ({ fields }) =>
        fields
          ? fields
              .map(field => `values[${field.get('name')}]`)
              .sort()
              .concat(INDEX_STATIC_PARTS)
              .map(name => ({ label: name, value: name }))
              .toArray()
          : [],
      initialValue: indexDefinition ? indexDefinition.get('parts') : [],
    },
    {
      name: 'unique',
      label: 'Unique',
      type: 'checkbox',
      initialValue: indexDefinition ? indexDefinition.get('unique') : false,
      visible: !!formSlug,
    },
  ];

export const IndexDefinitionForm = generateForm({
  formOptions: ['kappSlug', 'formSlug', 'indexName'],
  dataSources,
  fields,
  handleSubmit,
});

IndexDefinitionForm.displayName = 'IndexDefinitionForm';

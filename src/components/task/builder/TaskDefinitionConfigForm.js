import { List, Map } from 'immutable';
import { generateForm } from '../../form/Form';
import { fetchForm, fetchKapps } from '../../../apis';

export const checkOmittedParameters = (node, parameter) => {
  if (node.definitionId === 'prototype_submission_create_v1') {
    return !['kappSlug', 'formSlug'].includes(parameter.id);
  } else {
    return true;
  }
};

export const generateTaskDefinition = taskDefinition => {
  if (taskDefinition.definitionName === 'prototype_submission_create') {
    return ({ form }) => ({
      ...taskDefinition,
      parameters: [
        ...taskDefinition.parameters.map(
          parameter =>
            parameter.id === 'kappSlug'
              ? { ...parameter, defaultValue: form.kapp.slug }
              : parameter.id === 'formSlug'
                ? { ...parameter, defaultValue: form.slug }
                : parameter,
        ),
        ...form.fields.map(field => ({
          name: field.name,
          defaultValue: '',
          dependsOnId: null,
          dependsOnValue: null,
          description: '',
          id: `values.${field.name}`,
          required: false,
        })),
      ],
    });
  } else {
    return null;
  }
};

const dataSources = () => ({
  kapps: {
    fn: fetchKapps,
    params: [],
    transform: data => data.kapps,
  },
});

const fields = () => () => [
  {
    name: 'kappSlug',
    label: 'Kapp',
    type: 'select',
    required: true,
    options: ({ kapps }) =>
      kapps
        ? kapps.map(kapp =>
            Map({
              value: kapp.get('slug'),
              label: kapp.get('name'),
            }),
          )
        : List(),
    onChange: ({ values }, actions) => {
      if (!!values.get('form')) {
        actions.setValue('form', null);
      }
    },
  },
  {
    name: 'form',
    label: 'Form',
    type: 'form',
    required: true,
    enabled: ({ values }) => values.get('kappSlug') !== '',
    search: ({ values }) =>
      values.get('kappSlug') !== '' ? { kappSlug: values.get('kappSlug') } : {},
  },
];

const handleSubmit = ({ taskDefinition }) => values =>
  fetchForm({
    kappSlug: values.get('kappSlug'),
    formSlug: values.getIn(['form', 'slug'], ''),
    include: 'fields,kapp',
  }).then(generateTaskDefinition(taskDefinition));

export const TaskDefinitionConfigForm = generateForm({
  formOptions: ['taskDefinition'],
  dataSources,
  fields,
  handleSubmit,
});

TaskDefinitionConfigForm.displayName = 'TaskDefinitionConfigForm';

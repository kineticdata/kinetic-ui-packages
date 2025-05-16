import { List, Map } from 'immutable';
import { generateForm } from '../../form/Form';
import { fetchForm, fetchKapps } from '../../../apis';
import { generateSubmissionCreateTaskDefinition } from './helpers';

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

const handleSubmit =
  ({ taskDefinition }) =>
  values =>
    fetchForm({
      kappSlug: values.get('kappSlug'),
      formSlug: values.getIn(['form', 'slug'], ''),
      include: 'fields,kapp',
    }).then(({ form }) =>
      generateSubmissionCreateTaskDefinition(taskDefinition, { form }),
    );

export const TaskDefinitionConfigForm = generateForm({
  formOptions: ['taskDefinition'],
  dataSources,
  fields,
  handleSubmit,
});

TaskDefinitionConfigForm.displayName = 'TaskDefinitionConfigForm';

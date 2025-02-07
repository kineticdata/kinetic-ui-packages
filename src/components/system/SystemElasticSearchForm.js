import { generateForm } from '../form/Form';
import {
  fetchElasticSearchConfig,
  updateElasticSearchConfig,
} from '../../apis/system';
import { buildPropertyFields, handleFormErrors } from '../form/Form.helpers';
import { List } from 'immutable';

const handleSubmit = () => (values, { certificateFields }) => {
  return updateElasticSearchConfig({
    adapter: values.get('adapter'),
    multipart: certificateFields.some(
      name => values.getIn(['adapter', name]) instanceof File,
    ),
  }).then(handleFormErrors('adapter'));
};

const dataSources = () => ({
  adapter: {
    fn: fetchElasticSearchConfig,
    params: [],
    transform: result => result.adapter,
  },
  certificateFields: {
    fn: adapter => {
      return adapter
        ? adapter
            .filter(property => !!property.get('certificate'))
            .map(property => property.get('name'))
        : List();
    },
    params: ({ adapter }) => adapter && [adapter],
  },
});

const fields = () => ({ adapter }) => {
  if (adapter) {
    const { propertiesFields, propertiesSerialize } = buildPropertyFields({
      isNew: false,
      properties: adapter,
      getName: property => property.get('name'),
      getLabel: property => property.get('label'),
      getRequired: property => property.get('required'),
      getSensitive: property => property.get('sensitive'),
      getCertificate: property => property.get('certificate'),
      getOptions: property => property.get('options'),
      getHelpText: property => property.get('description'),
      getValue: property => property.get('value'),
    });

    return (
      adapter && [
        ...propertiesFields,
        {
          name: 'adapter',
          visible: false,
          initialValue: adapter,
          serialize: propertiesSerialize,
        },
      ]
    );
  }
};

export const SystemElasticSearchForm = generateForm({
  formOptions: [],
  dataSources,
  fields,
  handleSubmit,
});

SystemElasticSearchForm.displayName = 'SystemElasticSearchForm';

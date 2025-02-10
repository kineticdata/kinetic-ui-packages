import { get, getIn, List, Map } from 'immutable';
import {
  createSource,
  fetchPolicyRules,
  fetchSource,
  fetchSourceAdapters,
  updateSource,
} from '../../../apis/task';
import { generateForm } from '../../form/Form';
import { buildPropertyFields } from '../../form/Form.helpers';

const dataSources = ({ sourceName, sourceType }) => ({
  source: {
    fn: fetchSource,
    params: sourceName && [
      { sourceName, include: 'details,policyRules,properties' },
    ],
    transform: result => result.source,
  },
  policyRules: {
    fn: fetchPolicyRules,
    params: [{ type: 'API Access', include: 'details' }],
    transform: result => result.policyRules,
  },
  sourceAdapters: {
    fn: fetchSourceAdapters,
    params: [{ include: 'details' }],
    transform: result => result.sourceAdapters,
  },
  adapterProperties: {
    fn: (sourceAdapters, source) => {
      const sourceAdapterType = source ? source.get('type') : sourceType;
      const adapter = sourceAdapters.find(
        adapter => adapter.get('name') === sourceAdapterType,
      );
      return adapter ? List(adapter.get('properties')) : List();
    },
    params: ({ source, sourceAdapters }) =>
      (!sourceName || source) && sourceAdapters && [sourceAdapters, source],
  },
});

const handleSubmit = ({ sourceName }) => values =>
  (sourceName ? updateSource : createSource)({
    sourceName,
    source: values.toJS(),
  }).then(({ source, error }) => {
    if (error) {
      throw (error.statusCode === 400 && error.message) ||
        'There was an error saving the source';
    }
    return source;
  });

const fields = ({ sourceName, sourceType }) => ({
  adapterProperties,
  source,
  sourceAdapters,
}) => {
  if (adapterProperties) {
    const { propertiesFields, propertiesSerialize } = buildPropertyFields({
      isNew: !source,
      properties: adapterProperties,
      getName: property => property.get('name'),
      getRequired: property => property.get('required'),
      getSensitive: property => property.get('sensitive'),
      getValue: property =>
        getIn(source, ['properties', property.get('name')], ''),
    });
    return [
      {
        name: 'type',
        label: 'Type',
        required: true,
        enabled: false,
        initialValue: sourceType ? sourceType : get(source, 'type', ''),
      },
      {
        name: 'name',
        label: 'Name',
        required: true,
        initialValue: get(source, 'name', ''),
        type: 'text',
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
        initialValue: source
          ? source.get('policyRules').map(policyRule => policyRule.get('name'))
          : [],
        serialize: ({ values }) =>
          values
            .get('policyRules')
            .map(name => ({ type: 'API Access', name: name })),
      },
      {
        name: 'properties',
        visible: false,
        initialValue: get(source, 'properties', []),
        serialize: propertiesSerialize,
      },
      ...propertiesFields,
    ];
  }
};

export const SourceForm = generateForm({
  formOptions: ['sourceName', 'sourceType'],
  dataSources,
  fields,
  handleSubmit,
});

SourceForm.displayName = 'SourceForm';

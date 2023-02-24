import { generateForm } from '../../form/Form';
import {
  fetchBridgeModel,
  fetchBridgeModelAttributeMapping,
  createBridgeModelAttribute,
  createBridgeModelAttributeMapping,
  updateBridgeModelAttribute,
  updateBridgeModelAttributeMapping,
} from '../../../apis';

const dataSources = ({ modelName, attributeName }) => ({
  bridgeModel: {
    fn: fetchBridgeModel,
    params: [{ modelName }],
    transform: result => result.bridgeModel,
  },
  bridgeModelAttribute: {
    fn: fetchBridgeModelAttributeMapping,
    params: ({ bridgeModel }) =>
      attributeName &&
      bridgeModel && [
        {
          modelName,
          mappingName: bridgeModel.get('activeMappingName'),
          attributeName,
        },
      ],
    transform: result => result.bridgeModelAttributeMapping,
  },
});

const handleSubmit = ({ modelName, attributeName }) => (
  values,
  { bridgeModel },
) => {
  const mappingName = bridgeModel.get('activeMappingName');
  const name = values.get('name');
  const structureField = values.get('mapping');
  return (attributeName
    ? updateBridgeModelAttribute
    : createBridgeModelAttribute)({
    modelName,
    attributeName,
    bridgeModelAttribute: { name },
  })
    .then(result =>
      result.error
        ? result
        : (attributeName
            ? updateBridgeModelAttributeMapping
            : createBridgeModelAttributeMapping)({
            modelName,
            mappingName,
            attributeName: name,
            bridgeModelAttributeMapping: { name, structureField },
          }),
    )
    .then(({ bridgeModelAttributeMapping, error }) => {
      if (error) {
        throw (error.statusCode === 400 && error.message) ||
          'There was an error saving the attribute';
      }
      return bridgeModelAttributeMapping;
    });
};

const fields = ({ modelName, attributeName }) => ({ bridgeModelAttribute }) =>
  (!attributeName || bridgeModelAttribute) && [
    {
      name: 'name',
      label: 'Name',
      type: 'text',
      required: true,
      initialValue: bridgeModelAttribute
        ? bridgeModelAttribute.get('name')
        : '',
    },
    {
      name: 'mapping',
      label: 'Mapping',
      type: 'code',
      language: 'js-template',
      required: true,
      initialValue:
        (bridgeModelAttribute && bridgeModelAttribute.get('structureField')) ||
        '',
      options: {
        'Add Field': {
          value: 'fields("NAME")',
          selection: { start: 8, end: 12 },
        },
      },
    },
  ];

export const BridgeModelAttributeForm = generateForm({
  formOptions: ['modelName', 'attributeName'],
  dataSources,
  fields,
  handleSubmit,
});

BridgeModelAttributeForm.displayName = 'BridgeModelAttributeForm';

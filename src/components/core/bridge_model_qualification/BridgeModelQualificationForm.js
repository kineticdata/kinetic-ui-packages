import React from 'react';
import { Form } from '../../form/Form';
import {
  fetchBridgeModel,
  fetchBridgeModelQualification,
  fetchBridgeModelQualificationMapping,
  createBridgeModelQualification,
  createBridgeModelQualificationMapping,
  updateBridgeModelQualification,
  updateBridgeModelQualificationMapping,
} from '../../../apis';

const dataSources = ({ modelName, qualificationName }) => ({
  bridgeModel: {
    fn: fetchBridgeModel,
    params: [{ modelName }],
    transform: result => result.bridgeModel,
  },
  bridgeModelQualification: {
    fn: fetchBridgeModelQualification,
    params: qualificationName && [{ modelName, qualificationName }],
    transform: result => result.bridgeModelQualification,
  },
  bridgeModelQualificationMapping: {
    fn: fetchBridgeModelQualificationMapping,
    params: ({ bridgeModel }) =>
      qualificationName &&
      bridgeModel && [
        {
          modelName,
          mappingName: bridgeModel.get('activeMappingName'),
          qualificationName,
        },
      ],
    transform: result => result.bridgeModelQualificationMapping,
  },
});

const handleSubmit = ({ modelName, qualificationName }) => (
  values,
  { bridgeModel },
) => {
  const mappingName = bridgeModel.get('activeMappingName');
  const name = values.get('name');
  const resultType = values.get('resultType');
  const query = values.get('query');
  return (qualificationName
    ? updateBridgeModelQualification
    : createBridgeModelQualification)({
    modelName,
    qualificationName,
    bridgeModelQualification: { name, resultType },
  })
    .then(result =>
      result.error
        ? result
        : (qualificationName
            ? updateBridgeModelQualificationMapping
            : createBridgeModelQualificationMapping)({
            modelName,
            mappingName,
            qualificationName: name,
            bridgeModelQualificationMapping: { name, query },
          }),
    )
    .then(({ bridgeModelQualificationMapping, error }) => {
      if (error) {
        throw (error.statusCode === 400 && error.message) ||
          'There was an error saving the qualification';
      }
      return bridgeModelQualificationMapping;
    });
};

const fields = ({ modelName, qualificationName }) => ({
  bridgeModelQualification,
  bridgeModelQualificationMapping,
}) =>
  (!qualificationName ||
    (bridgeModelQualification && bridgeModelQualificationMapping)) && [
    {
      name: 'name',
      label: 'Name',
      type: 'text',
      required: true,
      initialValue: bridgeModelQualification
        ? bridgeModelQualification.get('name')
        : '',
    },
    {
      name: 'resultType',
      label: 'Result Type',
      type: 'select',
      required: true,
      initialValue: bridgeModelQualification
        ? bridgeModelQualification.get('resultType')
        : '',
      options: [
        { label: 'Single', value: 'Single' },
        { label: 'Multiple', value: 'Multiple' },
      ],
    },
    {
      name: 'query',
      label: 'Query',
      type: 'code-template',
      required: false,
      initialValue: bridgeModelQualificationMapping
        ? bridgeModelQualificationMapping.get('query', '')
        : '',
      options: {
        'Add Parameter': {
          value: 'parameters("NAME")',
          selection: { start: 12, end: 16 },
        },
      },
    },
  ];

export const BridgeModelQualificationForm = ({
  addFields,
  alterFields,
  fieldSet,
  formKey,
  components,
  onSave,
  onError,
  children,
  modelName,
  qualificationName,
}) => (
  <Form
    formKey={formKey}
    addFields={addFields}
    alterFields={alterFields}
    fieldSet={fieldSet}
    components={components}
    onSubmit={handleSubmit}
    onSave={onSave}
    onError={onError}
    dataSources={dataSources}
    fields={fields}
    formOptions={{ modelName, qualificationName }}
  >
    {children}
  </Form>
);

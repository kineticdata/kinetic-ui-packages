import React from 'react';
import { Form } from '../../form/Form';
import {
  fetchSecurityPolicyDefinition,
  createSecurityPolicyDefinition,
  updateSecurityPolicyDefinition,
} from '../../../apis';

const SECURITY_DEFINITION_TYPES = [
  'Space',
  'Datastore Form',
  'Datastore Submission',
  'Team',
  'User',
];

const dataSources = ({ securityPolicyName, kappSlug }) => ({
  securityPolicy: [
    fetchSecurityPolicyDefinition,
    [{ securityPolicyName, kappSlug }],
    {
      transform: result => result.securityPolicyDefinition,
      runIf: () => !!securityPolicyName,
    },
  ],
});

const handleSubmit = ({ securityPolicyName, kappSlug }) => values =>
  (securityPolicyName
    ? updateSecurityPolicyDefinition
    : createSecurityPolicyDefinition)({
    securityPolicyName,
    securityPolicyDefinition: values.toJS(),
    kappSlug,
  }).then(({ securityPolicyDefinition, error }) => {
    if (error) {
      throw (error.statusCode === 400 && error.message) ||
        'There was an error saving the security definition';
    }
    return securityPolicyDefinition;
  });

const fields = () => [
  {
    name: 'name',
    label: 'Name',
    type: 'text',
    required: true,
    initialValue: ({ securityPolicy }) =>
      securityPolicy ? securityPolicy.get('name') : '',
  },
  {
    name: 'type',
    label: 'Type',
    type: 'select',
    required: true,
    options: SECURITY_DEFINITION_TYPES.map(ele => ({
      value: ele,
      label: ele,
    })),
    initialValue: ({ securityPolicy }) =>
      securityPolicy ? securityPolicy.get('type') : 'Space',
  },
  {
    name: 'message',
    label: 'Message',
    type: 'text',
    required: true,
    initialValue: ({ securityPolicy }) =>
      securityPolicy ? securityPolicy.get('message') : '',
  },
  {
    name: 'rule',
    label: 'Rule',
    type: 'text',
    required: true,
    initialValue: ({ securityPolicy }) =>
      securityPolicy ? securityPolicy.get('rule') : '',
  },
];

export const SecurityDefinitionForm = ({
  addFields,
  alterFields,
  fieldSet,
  formKey,
  components,
  onSave,
  onError,
  children,
  ...formOptions
}) => (
  <Form
    addFields={addFields}
    alterFields={alterFields}
    fieldSet={fieldSet}
    formKey={formKey}
    components={components}
    onSubmit={handleSubmit(formOptions)}
    onSave={onSave}
    onError={onError}
    dataSources={dataSources(formOptions)}
    fields={fields(formOptions)}
  >
    {children}
  </Form>
);
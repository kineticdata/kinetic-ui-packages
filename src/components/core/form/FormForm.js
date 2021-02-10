import { get, Map } from 'immutable';
import { generateForm } from '../../form/Form';
import {
  fetchForm,
  fetchKapp,
  updateForm,
  createForm,
  fetchAttributeDefinitions,
  fetchSecurityPolicyDefinitions,
  fetchCategories,
  fetchSpace,
} from '../../../apis';
import { buildBindings, slugify } from '../../../helpers';

const FORM_STATUSES = ['New', 'Active', 'Inactive', 'Delete'];

const FORM_INCLUDES =
  'details,attributesMap,securityPolicies,indexDefinitions,backgroundJobs,fields,categorizations';
const KAPP_INCLUDES =
  'fields,formTypes,formAttributeDefinitions,kappAttributeDefinitions,securityPolicies,indexDefinitions,indexDefinitions.detachedForms,indexDefinitions.unpopulatedForms,baseIndex,baseIndex.details,baseIndex.detachedForms,baseIndex.unpopulatedForms';
const SPACE_INCLUDES =
  'spaceAttributeDefinitions,formAttributeDefinitions,securityPolicies,indexDefinitions,indexDefinitions.detachedForms,indexDefinitions.unpopulatedForms,baseIndex,baseIndex.details,baseIndex.detachedForms,baseIndex.unpopulatedForms';

const dataSources = ({ formSlug, kappSlug }) => ({
  form: {
    fn: fetchForm,
    params: formSlug && [{ formSlug, kappSlug, include: FORM_INCLUDES }],
    transform: result => result.form,
  },
  kapp: {
    fn: fetchKapp,
    params: kappSlug && [{ kappSlug, include: KAPP_INCLUDES }],
    transform: result => result.kapp,
  },
  space: {
    fn: fetchSpace,
    params: [{ include: SPACE_INCLUDES }],
    transform: result => result.space,
  },
  attributeDefinitions: {
    fn: fetchAttributeDefinitions,
    params: [
      {
        kappSlug,
        formSlug,
        attributeType: 'formAttributeDefinitions',
      },
    ],
    transform: result => result.attributeDefinitions,
  },
  securityPolicyDefinitions: {
    fn: fetchSecurityPolicyDefinitions,
    params: [{ kappSlug }],
    transform: result => result.securityPolicyDefinitions,
  },
  categories: {
    fn: fetchCategories,
    params: kappSlug && [{ kappSlug, include: 'attributes[Parent]' }],
    transform: result => result.categories,
  },
});

const handleSubmit = ({ formSlug, kappSlug }) => values =>
  (formSlug ? updateForm : createForm)({
    kappSlug,
    formSlug,
    form: values.toJS(),
  }).then(({ form, error }) => {
    if (error) {
      throw (error.statusCode === 400 && error.message) ||
        'There was an error saving the form';
    }
    return form;
  });

const buildLabel = ({ name, category, categories }) => {
  let match = null;
  if (category.get('attributes').size) {
    category.get('attributes').map(c => {
      if (c.get('name') === 'Parent') {
        match = categories.find(
          cat => cat.get('slug') === c.getIn(['values', 0]),
        );

        name = match
          ? buildLabel({
              name: `${match.get('name')}::${name}`,
              category: match,
              categories,
            })
          : `(Missing Category ${c.getIn(['values', 0])})::${name}`;
      }
      return name;
    });
  }
  return name;
};

const securityEndpoints = {
  formDisplay: {
    endpoint: 'Display',
    label: 'Form Display',
    types: ['Space', 'Kapp', 'Form'],
  },
  formModification: {
    endpoint: 'Modification',
    label: 'Form Modification',
    types: ['Space', 'Kapp', 'Form'],
  },
  submissionAccess: {
    endpoint: 'Submission Access',
    label: 'Submission Access',
    types: ['Space', 'Kapp', 'Form', 'Submission'],
  },
  submissionModification: {
    endpoint: 'Submission Modification',
    label: 'Submission Modification',
    types: ['Space', 'Kapp', 'Form', 'Submission'],
  },
};

const fields = ({ formSlug, kappSlug }) => ({ form, kapp }) =>
  (!formSlug || form) && [
    !!kappSlug && {
      name: 'anonymous',
      label: 'Anonymous',
      type: 'checkbox',
      initialValue: get(form, 'anonymous', false),
      helpText:
        'This setting controls whether a submission is submitted with the user\'s login information or with "anonymous". Note that this does not actually control access. That is done with the Form Display setting.',
    },
    {
      name: 'description',
      label: 'Description',
      type: 'text',
      initialValue: get(form, 'description'),
    },
    {
      name: 'name',
      label: 'Name',
      type: 'text',
      required: true,
      onChange: ({ values }, { setValue }) => {
        if (values.get('linked')) {
          setValue('slug', slugify(values.get('name')), false);
        }
      },
      initialValue: get(form, 'name'),
      helpText: 'User friendly name for the form.',
    },
    {
      name: 'notes',
      label: 'Notes',
      type: 'text',
      initialValue: get(form, 'notes') || '',
    },
    {
      name: 'slug',
      label: 'Slug',
      type: 'text',
      required: true,
      onChange: (_bindings, { setValue }) => {
        setValue('linked', false);
      },
      initialValue: get(form, 'slug'),
      helpText: 'Unique name used in the form path.',
    },
    {
      name: 'linked',
      label: 'Linked',
      type: 'checkbox',
      transient: true,
      initialValue: !form,
      visible: false,
    },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      options: FORM_STATUSES.map(status => ({
        value: status,
        label: status,
      })),
      initialValue: get(form, 'status', 'New'),
      helpText:
        'Used to determine availability for submissions and presentations.',
    },
    {
      name: 'submissionLabelExpression',
      label: 'Submission Label',
      type: 'code',
      language: 'js-template',
      initialValue: get(form, 'submissionLabelExpression') || '',
      helpText:
        // eslint-disable-next-line no-template-curly-in-string
        "Custom label for form submissions. Click the </> button to see available values derived from each submission. Example: ${values('Customer Name')}",
      options: ({ space, kapp, form }) =>
        buildBindings({
          space,
          kapp,
          form,
          scope: kappSlug ? 'Submission' : 'Submission',
        }),
    },
    !!kappSlug && {
      name: 'type',
      label: 'Type',
      type: 'select',
      options: ({ kapp }) =>
        kapp
          ? get(kapp, 'formTypes').map(type =>
              Map({
                value: type.get('name'),
                label: type.get('name'),
              }),
            )
          : [],
      initialValue: get(form, 'type'),
      helpText:
        'Used for organizing and displaying forms. Values in the dropdown are defined under Form Types.',
    },
    ...(formSlug
      ? Object.entries(securityEndpoints).map(
          ([endpointFieldName, endpoint]) => ({
            name: endpointFieldName,
            label: endpoint.label,
            type: 'select',
            options: ({ securityPolicyDefinitions }) =>
              securityPolicyDefinitions
                ? securityPolicyDefinitions
                    .filter(definition =>
                      endpoint.types.includes(definition.get('type')),
                    )
                    .map(definition =>
                      Map({
                        value: definition.get('name'),
                        label: definition.get('name'),
                      }),
                    )
                : [],
            initialValue: form
              ? form
                  .get('securityPolicies')
                  .find(
                    pol => pol.get('endpoint') === endpoint.endpoint,
                    null,
                    Map(), // If no Security Endpoints were ever set, we need to default to an empty map so the next line doesn't fail
                  )
                  .get('name', '')
              : '',
            transient: true,
          }),
        )
      : []),
    {
      name: 'securityPolicies',
      label: 'Security Policies',
      type: null,
      visible: false,
      serialize: ({ values }) =>
        Object.entries(securityEndpoints)
          .map(([endpointFieldName, policy]) => ({
            endpoint: policy.endpoint,
            name: values.get(endpointFieldName),
          }))
          .filter(endpoint => endpoint.name !== ''),
      initialValue: get(form, 'securityPolicies'),
    },
    {
      name: 'attributesMap',
      label: 'Attributes',
      type: 'attributes',
      required: false,
      options: ({ attributeDefinitions }) => attributeDefinitions,
      initialValue: get(form, 'attributesMap'),
    },
    !!kappSlug && {
      name: 'categorizations',
      label: 'Categories',
      type: 'select-multi',
      options: ({ categories }) =>
        categories
          ? categories.map(category =>
              Map({
                label: buildLabel({
                  name: category.get('name'),
                  category,
                  categories,
                }),
                value: category.get('slug'),
              }),
            )
          : [],
      initialValue: form
        ? form
            .get('categorizations')
            .map(categorization => categorization.getIn(['category', 'slug']))
        : [],
      serialize: ({ values }) =>
        values.get('categorizations').map(slug => ({ category: { slug } })),
    },
  ];

export const FormForm = generateForm({
  formOptions: ['formSlug', 'kappSlug'],
  dataSources,
  fields,
  handleSubmit,
});

FormForm.displayName = 'FormForm';

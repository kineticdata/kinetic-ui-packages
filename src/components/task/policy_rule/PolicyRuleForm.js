import React from 'react';
import t from 'prop-types';
import { Map } from 'immutable';
import {
  createPolicyRule,
  fetchTaskCategories,
  updatePolicyRule,
  fetchPolicyRule,
  fetchSources,
} from '../../../apis';
import { Form } from '../../form/Form';

const SYSTEM_DEFAULTS = ['Allow All', 'Deny All'];
const POLICY_TYPES = ['Category Access', 'Console Access', 'API Access'];

const CONSOLE_LIST = [
  'Categories',
  'Dashboard',
  'Engine',
  'Environment',
  'Errors',
  'Handlers',
  'Logs',
  'Routines',
  'Runs',
  'Staged',
  'System Errors',
  'Trees',
  'Access Keys',
  'ApiV2',
  'Console Access',
  'Groups',
  'Policy Rules',
  'Setup',
  'Sources',
  'Users',
];

const dataSources = ({ policyName, policyType }) => ({
  categories: {
    fn: fetchTaskCategories,
    params: [{ include: 'details' }],
    transform: result => result.categories,
  },
  sources: {
    fn: fetchSources,
    params: [{ include: 'details' }],
    transform: result => result.sources,
  },
  policyRule: {
    fn: fetchPolicyRule,
    params: policyName && [
      {
        policyName,
        policyType,
        include: 'details,categories,consolePolicyRules,sources',
      },
    ],
    transform: result => result.policyRule,
  },
});

const handleSubmit = ({ policyName }) => values =>
  (policyName ? updatePolicyRule : createPolicyRule)({
    policy: values.toJS(),
    policyName,
    policyType: values.get('type'),
  }).then(({ policyRule, error }) => {
    if (error) {
      throw (error.statusCode === 400 && error.message) ||
        'There was an error saving the policy rule';
    }
    return policyRule;
  });

const fields = ({ policyName, policyType }) => ({ policyRule }) =>
  (!policyName || policyRule) && [
    {
      name: 'type',
      label: 'Type',
      type: policyRule ? 'text' : 'select',
      required: true,
      enabled: policyRule ? false : true,
      initialValue: policyRule ? policyRule.get('type') : '',
      options: POLICY_TYPES.map(v => ({
        label: v,
        value: v,
      })),
      helpText: 'Type of policy rule, affecting where it will be applied.',
    },
    {
      name: 'name',
      label: 'Name',
      type: policyType === 'System Default' ? 'select' : 'text',
      required: true,
      options: SYSTEM_DEFAULTS.map(v => ({
        label: v,
        value: v,
      })),
      initialValue: policyRule ? policyRule.get('name') : '',
      helpText: 'User friendly name for the policy rule.',
      onChange: ({ values }, { setValue }) => {
        if (values.get('type') === 'System Default') {
          if (values.get('name') === 'Allow All') {
            setValue('rule', 'true');
            setValue('message', 'Allowed by default.');
          } else {
            setValue('rule', 'false');
            setValue('message', 'Not allowed by default.');
          }
        }
      },
    },
    {
      name: 'rule',
      label: 'Rule',
      type: 'text',
      required: true,
      initialValue: policyRule ? policyRule.get('rule') : '',
      helpText: `Ruby expression that is evaluated. If true access is granted. Example: @identity.get_property('spaceAdmin') == 'true'`,
    },
    {
      name: 'message',
      label: 'Message',
      type: 'text',
      required: true,
      initialValue: policyRule ? policyRule.get('message') : '',
      helpText: 'Returned to the user if the rule is called and does not pass.',
    },
    {
      name: 'categories',
      label: 'Categories',
      type: 'select-multi',
      required: false,
      visible: ({ values }) => values.get('type') === 'Category Access',
      options: ({ categories }) =>
        categories
          ? categories.map(category =>
              Map({
                label: category.get('name'),
                value: category.get('name'),
              }),
            )
          : [],
      initialValue: policyRule
        ? policyRule.get('categories').map(category => category.get('name'))
        : [],
      serialize: ({ values }) => values.get('categories').map(name => name),
    },
    {
      name: 'consolePolicyRules',
      label: 'Consoles',
      type: 'select-multi',
      required: false,
      visible: ({ values }) => values.get('type') === 'Console Access',
      options: CONSOLE_LIST.map(v => ({
        label: v,
        value: v,
      })),
      initialValue:
        policyType === 'Console Access'
          ? policyRule
              .get('consolePolicyRules')
              .map(console => console.get('name'))
          : [],
      serialize: ({ values }) =>
        values.get('consolePolicyRules') &&
        values.get('consolePolicyRules').map(name => name),
    },
    {
      name: 'sources',
      label: 'Sources',
      type: 'select-multi',
      required: false,
      visible: ({ values }) => values.get('type') === 'API Access',
      options: ({ sources }) =>
        sources
          ? sources.map(source =>
              Map({
                label: source.get('name'),
                value: source.get('name'),
              }),
            )
          : [],
      initialValue: policyRule
        ? policyRule.get('sources').map(source => source.get('name'))
        : [],
      serialize: ({ values }) =>
        values.get('sources') && values.get('sources').map(name => name),
    },
  ];

export const PolicyRuleForm = ({
  addFields,
  alterFields,
  fieldSet,
  formKey,
  components,
  onSave,
  onError,
  children,
  policyName,
  policyType,
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
    formOptions={{ policyName, policyType }}
  >
    {children}
  </Form>
);

PolicyRuleForm.propTypes = {
  /** The name of the policy rule being edited. Leave blank if creating a new policy rule */
  policyRuleName: t.string,
  /** The type of the policy rule being created or edited. */
  policyRuleType: t.string,
};

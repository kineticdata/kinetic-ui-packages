import { List } from 'immutable';
import { generateForm } from '../../form/Form';
import { NodeMessage } from './models';
import {
  buildBindings,
  generateSubmissionCreateTaskDefinition,
  generateIntegrationTaskDefinition,
  checkOmittedParametersForAdvancedHandlers,
} from './helpers';
import {
  ADVANCED_HANDLER_NAME_INTEGRATION,
  ADVANCED_HANDLER_NAME_SUBMISSION_CREATE,
} from './constants';
import {
  fetchConnection,
  fetchForm,
  fetchOperation,
  inspectOperation,
} from '../../../apis';

const dataSources = ({ tasks, tree, node, connections }) => ({
  bindings: {
    fn: buildBindings,
    params: [tree, tasks, node],
  },
  parameters: {
    fn: node => node.parameters,
    params: [node],
  },
  form: {
    fn: node =>
      fetchForm({
        kappSlug: node.parameters.find(p => p.id === 'kappSlug').value,
        formSlug: node.parameters.find(p => p.id === 'formSlug').value,
        include: 'fields,kapp',
      }).then(data => data.form),
    params:
      tasks.get(node.definitionId)?.definitionName ===
      ADVANCED_HANDLER_NAME_SUBMISSION_CREATE
        ? [node]
        : null,
  },
  connection: {
    fn: node => {
      const id = node.parameters.find(p => p.id === 'connection')?.value;
      return (
        connections?.get(id) ||
        fetchConnection({ id }).then(data => data.connection)
      );
    },
    params:
      tasks.get(node.definitionId)?.definitionName ===
      ADVANCED_HANDLER_NAME_INTEGRATION
        ? [node]
        : null,
  },
  operation: {
    fn: node => {
      const connectionId = node.parameters.find(p => p.id === 'connection')
        ?.value;
      const id = node.parameters.find(p => p.id === 'operation')?.value;
      return (
        connections?.getIn([connectionId, 'operations', id]) ||
        fetchOperation({ connectionId, id }).then(data => data.operation)
      );
    },
    params:
      tasks.get(node.definitionId)?.definitionName ===
      ADVANCED_HANDLER_NAME_INTEGRATION
        ? [node]
        : null,
  },
  detectedInputs: {
    fn: node =>
      inspectOperation({
        operation: node.parameters.find(p => p.id === 'operation')?.value,
      }).then(data => data.detectedInputs),
    params:
      tasks.get(node.definitionId)?.definitionName ===
      ADVANCED_HANDLER_NAME_INTEGRATION
        ? [node]
        : null,
  },
  task: {
    fn: task => task,
    params: ({ form, connection, operation, detectedInputs }) => {
      const task = tasks.get(node.definitionId);

      if (task?.definitionName === ADVANCED_HANDLER_NAME_SUBMISSION_CREATE) {
        if (form) {
          return [
            generateSubmissionCreateTaskDefinition(task, { form: form.toJS() }),
          ];
        }
        return null;
      } else if (task?.definitionName === ADVANCED_HANDLER_NAME_INTEGRATION) {
        if (connection && operation && detectedInputs) {
          return [
            generateIntegrationTaskDefinition(task, {
              connection: connection.toJS(),
              operation: operation.toJS(),
              detectedInputs: detectedInputs.toJS(),
            }),
          ];
        }
        return null;
      } else {
        return [task];
      }
    },
  },
});

const getOptions = menu =>
  menu
    .split(',')
    .filter(value => !!value)
    .map(value => ({ label: value, value }));

const checkDependsOn = parameter =>
  !parameter.dependsOnId ||
  (({ values }) =>
    values.get(`parameter_${parameter.dependsOnId}`) ===
    parameter.dependsOnValue);

const fields = ({ tree, node }) => ({ bindings }) =>
  bindings && [
    {
      name: 'name',
      label: 'Name',
      type: 'text',
      initialValue: node.name,
      required: true,
      constraint: ({ values }) =>
        tree.nodes.some(
          other => other.name === values.get('name') && other.id !== node.id,
        )
          ? 'This name is already used by another node'
          : values.get('name').length > 128
            ? 'Name cannot exceed 128 characters'
            : true,
      pattern: /^[^'"]*$/,
      patternMessage: 'Node names may not contain apostrophes or quotes',
    },
    {
      name: 'deferrable',
      label: 'Deferrable',
      type: 'checkbox',
      initialValue: node.deferrable,
      visible: false,
    },
    node.deferrable && {
      name: 'defers',
      label: 'Defers',
      type: 'checkbox',
      initialValue: node.defers,
    },
    {
      name: 'visible',
      label: 'Visible',
      type: 'checkbox',
      initialValue: node.visible,
    },
    {
      name: 'definitionId',
      label: 'Task Definition Id',
      type: 'text',
      initialValue: node.definitionId,
      enabled: false,
    },
    {
      name: 'id',
      label: 'Id',
      type: 'text',
      enabled: false,
      initialValue: node.id,
    },
    ...node.parameters.map(parameter => ({
      name: `parameter_${parameter.id}`,
      label: parameter.label,
      type: parameter.menu ? 'select' : 'code',
      language: parameter.menu ? null : 'erb',
      helpText: parameter.description,
      initialValue: parameter.value,
      options: parameter.menu ? getOptions(parameter.menu) : bindings,
      transient: true,
      visible:
        checkDependsOn(parameter) &&
        checkOmittedParametersForAdvancedHandlers(node, parameter),
    })),
    {
      name: 'parameters',
      type: null,
      visible: false,
      serialize: ({ values }) =>
        node.parameters.map(parameter =>
          parameter.set('value', values.get(`parameter_${parameter.id}`)),
        ),
    },
    {
      name: 'message_Create',
      label: 'Create Message',
      type: 'code',
      initialValue: node.messages
        .filter(message => message.type === 'Create')
        .map(message => message.value)
        .first(''),
      language: 'erb',
      options: bindings,
      transient: true,
      visible: ({ values }) => values.get('defers', false),
    },
    {
      name: 'message_Update',
      label: 'Update Message',
      type: 'code',
      initialValue: node.messages
        .filter(message => message.type === 'Update')
        .map(message => message.value)
        .first(''),
      language: 'erb',
      options: bindings,
      transient: true,
      visible: ({ values }) => values.get('defers', false),
    },
    {
      name: 'message_Complete',
      label: 'Complete Message',
      type: 'code',
      initialValue: node.messages
        .filter(message => message.type === 'Complete')
        .map(message => message.value)
        .first(''),
      language: 'erb',
      options: bindings,
      transient: true,
    },
    {
      name: 'messages',
      type: null,
      visible: false,
      serialize: ({ values }) =>
        List(
          values.get('defers')
            ? ['Create', 'Update', 'Complete']
            : ['Complete'],
        )
          .map(type =>
            NodeMessage({ type, value: values.get(`message_${type}`) }),
          )
          // Do not serialize empty messages.
          .filter(message => !!message.value),
    },
  ];

const handleSubmit = ({ node }) => values => node.merge(values);

export const NodeForm = generateForm({
  formOptions: ['connections', 'node', 'tasks', 'tree'],
  dataSources,
  fields,
  handleSubmit,
});

NodeForm.displayName = 'NodeForm';

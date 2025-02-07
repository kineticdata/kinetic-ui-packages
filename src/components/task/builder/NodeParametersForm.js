import { generateForm } from '../../form/Form';
import {
  buildBindings,
  checkOmittedParametersForAdvancedHandlers,
  normalizeParameter,
} from './helpers';
import { NodeParameter } from './models';

const getOptions = menu =>
  menu
    .split(',')
    .filter(value => !!value)
    .map(value => ({ label: value, value }));

const dataSources = ({ connections, task, tasks, tree, node }) => ({
  bindings: {
    fn: buildBindings,
    params: [{ tree, tasks, node, connections }],
  },
  parameters: {
    fn: () => task.inputs || task.parameters,
    params: [],
    transform: result => result.map(normalizeParameter).map(NodeParameter),
  },
  oldParameters: {
    fn: () => node.parameters,
    params: [],
  },
});

const fields = ({ node, task }) => ({ bindings, parameters, oldParameters }) =>
  bindings &&
  parameters &&
  oldParameters && [
    ...oldParameters.map(parameter => ({
      name: `oldParameter_${parameter.id}`,
      label: parameter.label,
      type: parameter.menu ? 'select' : 'code',
      language: parameter.menu ? null : 'ruby-template',
      helpText: parameter.description,
      initialValue: parameter.value,
      options: parameter.menu ? getOptions(parameter.menu) : bindings,
      transient: true,
      enabled: false,
      visible: checkOmittedParametersForAdvancedHandlers(node, parameter),
    })),
    ...parameters.map(parameter => {
      const matchingParameter = oldParameters.find(
        oldParameter => oldParameter.id === parameter.id,
      );
      return {
        name: `parameter_${parameter.id}`,
        label: parameter.label,
        type: parameter.menu ? 'select' : 'code',
        language: parameter.menu ? null : 'ruby-template',
        helpText: parameter.description,
        // If this parameter will be omitted, keep its value. Otherwise, set to
        // the matchingParameter's value or the default
        initialValue: !checkOmittedParametersForAdvancedHandlers(
          task,
          parameter,
        )
          ? parameter.value || parameter.defaultValue
          : matchingParameter
            ? matchingParameter.value
            : parameter.defaultValue,
        options: parameter.menu ? getOptions(parameter.menu) : bindings,
        transient: true,
        // Use the task variable as the node since this is the new node
        visible: checkOmittedParametersForAdvancedHandlers(task, parameter),
      };
    }),
    {
      name: 'parameters',
      type: null,
      visible: false,
      serialize: ({ parameters, values }) =>
        parameters.map(parameter =>
          parameter.set('value', values.get(`parameter_${parameter.id}`)),
        ),
    },
    {
      name: 'id',
      type: 'text',
      visible: false,
      initialValue: node.id,
    },
    {
      name: 'name',
      type: 'text',
      visible: false,
      initialValue: node.name,
    },
    {
      name: 'deferrable',
      type: 'checkbox',
      visible: false,
      initialValue: task.deferrable,
    },
    {
      name: 'defers',
      type: 'checkbox',
      visible: false,
      initialValue: task.deferrable ? node.defers : false,
    },
    {
      name: 'definitionId',
      type: 'text',
      visible: false,
      initialValue: task.definitionId,
    },
    {
      name: 'visible',
      type: 'checkbox',
      visible: false,
      initialValue: node.visible,
    },
    {
      name: 'messages',
      type: null,
      visible: false,
      initialValue: node.messages.filter(
        message =>
          message.type === 'Complete' || (task.deferrable && node.defers),
      ),
    },
  ];

const handleSubmit = () => values => values;

export const NodeParametersForm = generateForm({
  formOptions: ['connections', 'node', 'task', 'tasks', 'tree'],
  dataSources,
  fields,
  handleSubmit,
});

NodeParametersForm.displayName = 'NodeParametersForm';

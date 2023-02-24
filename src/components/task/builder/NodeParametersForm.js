import { generateForm } from '../../form/Form';
import { buildBindings, normalizeParameter } from './helpers';
import { NodeParameter } from './models';
import { checkOmittedParameters } from './TaskDefinitionConfigForm';

const getOptions = menu =>
  menu
    .split(',')
    .filter(value => !!value)
    .map(value => ({ label: value, value }));

const dataSources = ({ task, tasks, tree, node }) => ({
  bindings: {
    fn: buildBindings,
    params: [tree, tasks, node],
  },
  parameters: {
    fn: () => task.inputs || task.parameters,
    params: [],
    transform: result => result.map(normalizeParameter).map(NodeParameter),
  },
});

const fields = ({ node, task, tasks, tree }) => ({ bindings, parameters }) =>
  bindings &&
  parameters && [
    ...node.parameters.map(parameter => ({
      name: `oldParameter_${parameter.id}`,
      label: parameter.label,
      type: parameter.menu ? 'select' : 'code',
      language: parameter.menu ? null : 'erb',
      helpText: parameter.description,
      initialValue: parameter.value,
      options: parameter.menu ? getOptions(parameter.menu) : bindings,
      transient: true,
      enabled: false,
      visible: checkOmittedParameters(node, parameter),
    })),
    ...parameters.map(parameter => {
      const matchingParameter = node.parameters.find(
        oldParameter => oldParameter.id === parameter.id,
      );
      return {
        name: `parameter_${parameter.id}`,
        label: parameter.label,
        type: parameter.menu ? 'select' : 'code',
        language: parameter.menu ? null : 'erb',
        helpText: parameter.description,
        initialValue: matchingParameter
          ? matchingParameter.value
          : parameter.defaultValue,
        options: parameter.menu ? getOptions(parameter.menu) : bindings,
        transient: true,
        visible: checkOmittedParameters(node, parameter),
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

const handleSubmit = ({ node }) => values => values;

export const NodeParametersForm = generateForm({
  formOptions: ['node', 'task', 'tasks', 'tree'],
  dataSources,
  fields,
  handleSubmit,
});

NodeParametersForm.displayName = 'NodeParametersForm';

import { generateForm } from '../../form/Form';
import { buildBindings } from './helpers';

const dataSources = ({ tasks, tree, connector }) => ({
  bindings: {
    fn: buildBindings,
    params: [tree, tasks, tree.nodes.get(connector.headId)],
  },
});

const fields = ({ connector, tasks, tree }) => ({ bindings }) =>
  bindings && [
    {
      name: 'type',
      label: 'Type',
      type: 'radio',
      required: true,
      options: [
        { label: 'Complete', value: 'Complete' },
        { label: 'Create', value: 'Create' },
        { label: 'Update', value: 'Update' },
      ],
      initialValue: connector ? connector.type : 'Complete',
    },
    {
      name: 'label',
      label: 'Label',
      type: 'text',
      initialValue: connector.label,
    },
    {
      name: 'condition',
      label: 'Condition',
      type: 'code',
      initialValue: connector.condition,
      language: 'ruby',
      options: bindings,
    },
    {
      name: 'from',
      label: 'From Node',
      type: 'text',
      enabled: false,
      visible: false,
      initialValue: connector.tailId,
    },
    {
      name: 'to',
      label: 'To Node',
      type: 'text',
      enabled: false,
      visible: false,
      initialValue: connector.headId,
    },
    {
      name: 'id',
      label: 'Id',
      type: 'text',
      enabled: false,
      visible: false,
      initialValue: connector.id,
    },
  ];

const handleSubmit = ({ connector }) => values => connector.merge(values);

export const ConnectorForm = generateForm({
  formOptions: ['connector', 'tasks', 'tree'],
  dataSources,
  fields,
  handleSubmit,
});

ConnectorForm.displayName = 'ConnectorForm';

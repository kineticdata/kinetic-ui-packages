import { createTaskTrigger, fetchTree } from '../../../apis';
import { generateForm } from '../../form/Form';

const dataSources = ({ sourceName, sourceGroup, name, workflowType }) => ({
  nodes: {
    fn: fetchTree,
    params: name && [
      {
        type: workflowType || 'Tree',
        sourceName,
        sourceGroup,
        name,
        include: 'treeJson',
      },
    ],
    transform: result =>
      result.tree && result.tree.treeJson
        ? result.tree.treeJson.nodes.map(node => ({
            label: `${node.name} (${node.id})`,
            value: node.id,
          }))
        : [],
  },
});

const handleSubmit = formOptions => values => {
  return createTaskTrigger({
    ...formOptions,
    ...values.toJS(),
  }).then(({ error, message, messageType }) => {
    if (error) {
      throw error.message ||
        'An error occurred while manually creating the trigger.';
    }
    if (messageType === 'success') {
      return message;
    }
  });
};

const fields = ({ name }) => () =>
  name && [
    {
      name: 'nodeId',
      label: 'Node Id',
      type: 'select',
      required: true,
      options: ({ nodes }) => nodes,
      helpText: 'The node in the workflow you want to create a trigger for.',
    },
    {
      name: 'loopIndex',
      label: 'Loop Index',
      type: 'text',
      required: false,
      helpText:
        'Required when executing a node defined within a loop (ex. /3#0)',
      placeholder:
        'Required when executing a node defined within a loop (ex. /3#0)',
    },
    {
      name: 'branchId',
      label: 'Branch Id',
      type: 'text',
      required: false,
      helpText:
        'Required when executing a node defined after an update connect (ex. 11023)',
      placeholder:
        'Required when executing a node defined after an update connect (ex. 11023)',
      pattern: /^\d*$/,
      patternMessage: 'Branch ID must be a number',
      serialize: ({ values }) => parseInt(values.get('branchId')),
    },
  ];

export const CreateManualTriggerForm = generateForm({
  formOptions: ['sourceName', 'sourceGroup', 'name', 'workflowType', 'runId'],
  dataSources,
  fields,
  handleSubmit,
});

CreateManualTriggerForm.displayName = 'CreateManualTriggerForm';

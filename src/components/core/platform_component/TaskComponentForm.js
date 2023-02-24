import { get } from 'immutable';
import { generateForm } from '../../form/Form';
import { fetchTaskComponent, updateTaskComponent } from '../../../apis';

const dataSources = () => ({
  task: {
    fn: fetchTaskComponent,
    params: [],
    transform: result => result.task,
  },
});

const handleSubmit = () => values =>
  updateTaskComponent({
    task: values.toJS(),
  }).then(({ task, error }) => {
    if (error) {
      throw (error.statusCode === 400 && error.message) ||
        'There was an error saving the Task component';
    }
    return task;
  });

const fields = () => ({ task }) =>
  task && [
    {
      name: 'secret',
      label: 'Task Secret',
      type: 'password',
      visible: ({ values }) => values.get('changeSecret'),
      required: ({ values }) => values.get('changeSecret'),
      transient: ({ values }) => !values.get('changeSecret'),
    },
    {
      name: 'changeSecret',
      label: 'Change Task Secret',
      type: 'checkbox',
      transient: true,
      visible: true,
      initialValue: false,
      onChange: ({ values }, { setValue }) => {
        if (values.get('secret') !== '') {
          setValue('secret', '');
        }
      },
    },
    {
      name: 'url',
      label: 'Task Url',
      type: 'text',
      required: true,
      initialValue: get(task, 'url') || '',
      helpText: 'URL to the Task Component',
    },
    {
      name: 'platformSourceName',
      label: 'Platform Source Name',
      type: 'text',
      required: true,
      transient: true,
      initialValue: task.getIn(['config', 'platformSourceName']) || '',
      helpText: 'Source Name for the Kinetic Platform.',
    },
    {
      name: 'config',
      label: 'Config',
      type: null,
      visible: false,
      serialize: ({ values }) => ({
        platformSourceName: values.get('platformSourceName'),
      }),
    },
  ];

export const TaskComponentForm = generateForm({
  formOptions: [],
  dataSources,
  fields,
  handleSubmit,
});

TaskComponentForm.displayName = 'TaskComponentForm';

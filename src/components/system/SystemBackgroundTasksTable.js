import { generateTable } from '../table/Table';
import { fetchSystemBackgroundTasks } from '../../apis';
import { defineFilter } from '../../helpers';
import { List } from 'immutable';

const clientSide = defineFilter(true)
  .startsWith('id', 'id')
  .startsWith('status', 'status')
  .end();

const dataSource = ({ spaceSlug }) => ({
  fn: fetchSystemBackgroundTasks,
  clientSide,
  params: () => [{ spaceSlug }],
  transform: result => ({
    data: result.backgroundTasks,
  }),
});

const filters = () => () => [
  { name: 'id', label: 'ID', type: 'text' },
  { name: 'status', label: 'Status', type: 'text' },
];

const columns = [
  {
    value: 'id',
    title: 'ID',
    sortable: false,
  },
  {
    value: 'createdAt',
    title: 'Created At',
    valueTransform: (_value, row) => {
      const createdTransition = row
        .get('transitions', List())
        .find(t => t.has('Created'));
      return createdTransition ? createdTransition.get('Created') : 'N/A';
    },
    sortable: true,
  },
  {
    value: 'description',
    title: 'Description',
    sortable: false,
  },
  {
    value: 'exception',
    title: 'Exception',
    sortable: false,
  },
  {
    value: 'messages',
    title: 'Messages',
    sortable: false,
  },
  {
    value: 'Result',
    title: 'Result',
    sortable: false,
  },
  {
    value: 'status',
    title: 'Status',
  },
  {
    value: 'transitions',
    title: 'Transitions',
    sortable: false,
  },
];

export const SystemBackgroundTasksTable = generateTable({
  tableOptions: ['spaceSlug'],
  columns,
  filters,
  dataSource,
});

SystemBackgroundTasksTable.displayName = 'SystemBackgroundTasksTable';

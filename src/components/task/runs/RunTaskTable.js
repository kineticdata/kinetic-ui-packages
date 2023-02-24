import { generateTable } from '../..';
import { defineFilter } from '../../../helpers';

const clientSide = defineFilter(true)
  .startsWith('name', 'name')
  .equals('status', 'status')
  .end();

const dataSource = ({ run }) => ({
  clientSide,
  fn: () => Promise.resolve(run),
  params: () => [],
  transform: result => ({ data: result.tasks }),
});

const filters = () => () => [
  { name: 'name', label: 'Name', type: 'text' },
  { name: 'status', label: 'status', type: 'text' },
];

const columns = [
  {
    value: 'nodeName',
    title: 'Node Name',
    sortable: true,
  },
  { value: 'nodeId', title: 'Node ID', sortable: true },
  { value: 'status', title: 'Status', sortable: true },
  { value: 'createdAt', title: 'Created', sortable: true },
];

export const RunTaskTable = generateTable({
  tableOptions: ['run'],
  dataSource,
  filters,
  columns,
});
RunTaskTable.displayName = 'RunTaskTable';

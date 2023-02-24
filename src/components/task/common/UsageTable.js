import { generateTable } from '../../table/Table';
import { fetchUsage } from '../../../apis';
import { defineFilter } from '../../../helpers';

const clientSide = defineFilter(true)
  .equals('type', 'type')
  .startsWith('source', 'source')
  .startsWith('group', 'group')
  .startsWith('name', 'name')
  .end();

const dataSource = ({
  definitionId,
  sourceName,
  sourceGroup,
  name,
  usageType,
}) => ({
  fn: fetchUsage,
  clientSide,
  params: () => [{ definitionId, sourceName, sourceGroup, name, usageType }],
  transform: result => ({
    data: result.usages,
  }),
});

const filters = () => () => [
  { name: 'type', label: 'Type', type: 'text' },
  { name: 'source', label: 'Source', type: 'text' },
  { name: 'group', label: 'Group', type: 'text' },
  { name: 'name', label: 'Name', type: 'text' },
];

const columns = [
  {
    value: 'type',
    title: 'Type',
    sortable: true,
  },
  {
    value: 'source',
    title: 'Source',
    sortable: true,
  },
  {
    value: 'group',
    title: 'Group',
    sortable: true,
  },
  {
    value: 'name',
    title: 'Tree',
    sortable: true,
  },
  {
    value: 'nodeCount',
    title: 'Usage',
    sortable: true,
  },
  {
    value: 'updatedAt',
    title: 'Updated',
    sortable: true,
  },
];

export const UsageTable = generateTable({
  tableOptions: [
    'definitionId',
    'sourceName',
    'sourceGroup',
    'name',
    'usageType',
  ],
  columns,
  filters,
  dataSource,
});

UsageTable.displayName = 'UsageTable';

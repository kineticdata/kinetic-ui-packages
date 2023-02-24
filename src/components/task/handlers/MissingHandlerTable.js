import { generateTable } from '../../table/Table';
import { fetchMissingHandlers } from '../../../apis';
import { defineFilter } from '../../../helpers';

const clientSide = defineFilter(true)
  .startsWith('definitionId', 'definitionId')
  .end();

const dataSource = () => ({
  fn: fetchMissingHandlers,
  clientSide,
  params: () => [],
  transform: result => ({
    data: result.missingHandlers,
  }),
});

const filters = () => () => [
  {
    name: 'definitionId',
    label: 'Handler Definition Id',
    type: 'text',
  },
];

const columns = [
  {
    value: 'definitionId',
    title: 'Handler Definition Id',
    sortable: true,
  },
  {
    value: 'treeCount',
    title: 'Trees',
    sortable: true,
  },
  {
    value: 'routineCount',
    title: 'Routines',
    sortable: true,
  },
  {
    value: 'totalNodeCount',
    title: 'Nodes',
    sortable: true,
  },
];

export const MissingHandlerTable = generateTable({
  tableOptions: [],
  columns,
  filters,
  dataSource,
});

MissingHandlerTable.displayName = 'MissingHandlerTable';

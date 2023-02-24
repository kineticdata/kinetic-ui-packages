import { generateTable } from '../../table/Table';
import { fetchMissingRoutines } from '../../../apis';
import { defineFilter } from '../../../helpers';

const clientSide = defineFilter(true)
  .startsWith('definitionId', 'definitionId')
  .end();

const dataSource = () => ({
  fn: fetchMissingRoutines,
  clientSide,
  params: () => [],
  transform: result => ({
    data: result.missingRoutines,
  }),
});

const filters = () => () => [
  {
    name: 'definitionId',
    label: 'Routine Definition Id',
    type: 'text',
  },
];

const columns = [
  {
    value: 'definitionId',
    title: 'Routine Definition Id',
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

export const MissingRoutineTable = generateTable({
  tableOptions: [],
  columns,
  filters,
  dataSource,
});

MissingRoutineTable.displayName = 'MissingRoutineTable';

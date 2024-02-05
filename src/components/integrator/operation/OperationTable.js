import { fetchOperations } from '../../../apis';
import {
  generatePaginationParams,
  generateSortParams,
} from '../../../apis/http';
import { generateTable } from '../../table/Table';

const filters = () => () => [
  {
    name: 'type',
    label: 'Type',
    type: 'select',
    options: [
      { label: 'HTTP', value: 'http' },
      { label: 'SMTP', value: 'smtp' },
      { label: 'SQL', value: 'sql' },
    ],
  },
];

const dataSource = () => ({
  fn: fetchOperations,
  params: paramData => [
    {
      // TODO implement when sorting and pagination are supported
      // ...generateSortParams(paramData),
      // ...generatePaginationParams(paramData),
      ...paramData.filters.filter(Boolean).toJS(),
    },
  ],
  transform: result => ({
    data: result.operations,
  }),
});

const columns = [
  {
    value: 'name',
    title: 'Name',
    // sortable: true,
  },
  {
    value: 'type',
    title: 'Type',
    // sortable: true,
    toggleable: true,
  },
  {
    value: 'id',
    title: 'Id',
    toggleable: true,
  },
  {
    value: 'insertedAt',
    title: 'Created',
    // sortable: true,
    toggleable: true,
  },
  {
    value: 'updatedAt',
    title: 'Updated',
    // sortable: true,
    toggleable: true,
  },
];

export const OperationTable = generateTable({
  tableOptions: [],
  columns,
  filters,
  dataSource,
});

OperationTable.displayName = 'OperationTable';

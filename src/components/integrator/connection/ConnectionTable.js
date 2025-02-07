import { fetchConnections } from '../../../apis';
import { generateTable } from '../../table/Table';
import integrationTypes from '../integrationTypes';
import { defineFilter } from '../../../helpers';

const filters = () => () => [
  { name: 'name', label: 'Name', type: 'text' },
  { name: 'type', label: 'Type', type: 'select', options: integrationTypes },
];

const clientSide = defineFilter(true)
  .matches('name', 'name')
  .equals('type', 'type')
  .end();

const dataSource = () => ({
  fn: fetchConnections,
  clientSide,
  params: paramData => [
    {
      ...paramData.filters.filter(Boolean).toJS(),
    },
  ],
  transform: result => ({
    data: result.connections,
  }),
});

const columns = [
  {
    value: 'name',
    title: 'Name',
    sortable: true,
  },
  {
    value: 'type',
    title: 'Type',
    sortable: true,
    toggleable: true,
  },
  {
    value: 'status',
    valueTransform: (_value, row) =>
      row.getIn(['status', 'healthy']) ? 'Valid' : 'Invalid',
    title: 'Status',
    sortable: false,
    toggleable: true,
  },
  {
    value: 'id',
    title: 'Id',
    toggleable: true,
  },
  {
    value: 'insertedAt',
    title: 'Created At',
    sortable: true,
    toggleable: true,
  },
  {
    value: 'updatedAt',
    title: 'Updated At',
    sortable: true,
    toggleable: true,
  },
];

export const ConnectionTable = generateTable({
  tableOptions: [],
  columns,
  filters,
  dataSource,
});

ConnectionTable.displayName = 'ConnectionTable';

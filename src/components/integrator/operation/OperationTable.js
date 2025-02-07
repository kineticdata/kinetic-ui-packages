import { fetchOperations } from '../../../apis';
import { generateTable } from '../../table/Table';
import { defineFilter } from '../../../helpers';

const filters = () => () => [{ name: 'name', label: 'Name', type: 'text' }];

const clientSide = defineFilter(true)
  .matches('name', 'name')
  .end();

const dataSource = ({ connectionId }) => ({
  fn: fetchOperations,
  clientSide,
  params: paramData =>
    connectionId && [
      {
        connectionId,
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
    sortable: true,
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

export const OperationTable = generateTable({
  tableOptions: ['connectionId'],
  columns,
  filters,
  dataSource,
});

OperationTable.displayName = 'OperationTable';

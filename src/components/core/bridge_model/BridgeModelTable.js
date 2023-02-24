import { generateTable } from '../../table/Table';
import { fetchBridgeModels } from '../../../apis';
import { defineFilter } from '../../../helpers';

const clientSide = defineFilter(true)
  .startsWith('name', 'name')
  .equals('status', 'status')
  .end();

const dataSource = () => ({
  fn: fetchBridgeModels,
  clientSide,
  params: () => [
    {
      include: 'details',
    },
  ],
  transform: result => ({
    data: result.bridgeModels,
    nextPageToken: result.nextPageToken,
  }),
});

const filters = () => () => [
  { name: 'name', label: 'Model Name', type: 'text' },
  {
    name: 'status',
    label: 'Status',
    type: 'select',
    options: [
      {
        label: 'Active',
        value: 'Active',
      },
      { label: 'Inactive', value: 'Inactive' },
    ],
  },
];

const columns = [
  {
    value: 'name',
    title: 'Model Name',
    sortable: true,
  },
  {
    value: 'status',
    title: 'Status',
    sortable: true,
  },
];

export const BridgeModelTable = generateTable({
  columns,
  filters,
  dataSource,
});

BridgeModelTable.displayName = 'BridgeModelTable';

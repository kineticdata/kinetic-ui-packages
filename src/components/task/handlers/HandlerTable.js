import { generateTable } from '../../table/Table';
import { fetchHandlers } from '../../../apis';
import { defineFilter } from '../../../helpers';

const clientSide = defineFilter(true)
  .equals('id', 'id')
  .startsWith('name', 'name')
  .equals('status', 'status')
  .equals('definitionId', 'definitionId')
  .startsWith('definitionName', 'definitionName')
  .equals('definitionVersion', 'definitionVersion')
  .end();

const dataSource = () => ({
  fn: fetchHandlers,
  params: () => [{ include: 'details' }],
  transform: result => ({ data: result.handlers }),
  clientSide,
});

const filters = () => () => [
  { name: 'id', label: 'ID', type: 'text' },
  { name: 'name', label: 'Name', type: 'text' },
  {
    name: 'status',
    label: 'Status',
    type: 'select',
    options: [
      { label: 'Active', value: 'Active' },
      { label: 'Paused', value: 'Paused' },
    ],
  },
  { name: 'definitionId', label: 'Definition ID', type: 'text' },
  { name: 'definitionName', label: 'Definition Name', type: 'text' },
  { name: 'definitionVersion', label: 'Definition Version', type: 'text' },
];

const columns = [
  {
    title: 'ID',
    value: 'id',
    toggleable: true,
  },
  {
    title: 'Name',
    value: 'name',
    toggleable: false,
    columnOrder: 'first',
  },
  {
    title: 'Status',
    value: 'status',
    toggleable: true,
  },
  {
    title: 'Definition ID',
    value: 'definitionId',
    toggleable: true,
  },
  {
    title: 'Definition Name',
    value: 'definitionName',
    toggleable: true,
  },
  {
    title: 'Definition Version',
    value: 'definitionVersion',
    toggleable: true,
  },
  {
    title: 'Description',
    value: 'description',
    toggleable: true,
  },
  {
    title: 'Created',
    value: 'createdAt',
    toggleable: true,
  },
  {
    title: 'Created By',
    value: 'createdBy',
    toggleable: true,
  },
  {
    title: 'Updated',
    value: 'updatedAt',
    toggleable: true,
  },
  {
    title: 'Updated By',
    value: 'updatedBy',
    toggleable: true,
  },
];

export const HandlerTable = generateTable({
  columns,
  filters,
  dataSource,
});

HandlerTable.displayName = 'HandlerTable';

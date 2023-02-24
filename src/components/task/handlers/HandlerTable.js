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
  },
  {
    title: 'Name',
    value: 'name',
  },
  {
    title: 'Status',
    value: 'status',
  },
  {
    title: 'Definition ID',
    value: 'definitionId',
  },
  {
    title: 'Definition Name',
    value: 'definitionName',
  },
  {
    title: 'Definition Version',
    value: 'definitionVersion',
  },
  {
    title: 'Description',
    value: 'description',
  },
  {
    title: 'Created',
    value: 'createdAt',
  },
  {
    title: 'Created By',
    value: 'createdBy',
  },
  {
    title: 'Updated',
    value: 'updatedAt',
  },
  {
    title: 'Updated By',
    value: 'updatedBy',
  },
];

export const HandlerTable = generateTable({
  columns,
  filters,
  dataSource,
});

HandlerTable.displayName = 'HandlerTable';

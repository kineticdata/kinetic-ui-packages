import { generateTable } from '../../table/Table';
import { fetchHandlers } from '../../../apis';

const dataSource = () => ({
  fn: fetchHandlers,
  params: paramData => [
    {
      include: 'details',
      limit: paramData.pageSize,
      offset: paramData.nextPageToken,
      status: status ? status : paramData.filters.get('status'),
      name: name ? name : paramData.filters.get('name'),
    },
  ],
  transform: result => ({
    data: result.handlers,
    nextPageToken: result.nextPageToken,
    count: result.count,
  }),
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
    title: 'Name',
    value: 'name',
    sortable: true,
    toggleable: false,
    columnOrder: 'first',
  },
  {
    title: 'Definition ID',
    value: 'definitionId',
    sortable: true,
    toggleable: true,
  },
  {
    title: 'Definition Name',
    value: 'definitionName',
    sortable: true,
    toggleable: true,
  },
  {
    title: 'Definition Version',
    value: 'definitionVersion',
    sortable: true,
    toggleable: true,
  },
  {
    title: 'Status',
    value: 'status',
    sortable: true,
    toggleable: true,
  },
  {
    title: 'Description',
    value: 'description',
    toggleable: true,
  },
  {
    title: 'Created At',
    value: 'createdAt',
    sortable: true,
    toggleable: true,
  },
  {
    title: 'Created By',
    value: 'createdBy',
    sortable: true,
    toggleable: true,
  },
  {
    title: 'Updated At',
    value: 'updatedAt',
    sortable: true,
    toggleable: true,
  },
  {
    title: 'Updated By',
    value: 'updatedBy',
    sortable: true,
    toggleable: true,
  },
  {
    title: 'ID',
    value: 'id',
    sortable: true,
    toggleable: true,
  },
];

export const HandlerTable = generateTable({
  columns,
  filters,
  dataSource,
});

HandlerTable.displayName = 'HandlerTable';

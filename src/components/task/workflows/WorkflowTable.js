import { generateTable } from '../../table/Table';
import { fetchSources, fetchTrees } from '../../../apis';
import { defineFilter } from '../../../helpers';

const STATUS_OPTIONS = ['Active', 'Inactive', 'Paused'].map(v => ({
  label: v,
  value: v,
}));

const clientSide = defineFilter(true)
  .equals('name', 'name')
  .startsWith('name', 'nameFragment')
  .equals('sourceName', 'source')
  .equals('sourceGroup', 'sourceGroup')
  .startsWith('sourceGroup', 'sourceGroupFragment')
  .startsWith('ownerEmail', 'ownerEmail')
  .equals('status', 'status')
  .end();

const dataSource = ({ alterData, workflowType, sourceName, sourceGroup }) => ({
  clientSide: !!alterData ? clientSide : false,
  fn: fetchTrees,
  params: paramData => [
    {
      name: paramData.filters.get('name'),
      nameFragment: paramData.filters.get('nameFragment'),
      source: sourceName ? sourceName : paramData.filters.get('sourceName'),
      group: sourceGroup ? sourceGroup : paramData.filters.get('sourceGroup'),
      groupFragment: paramData.filters.get('sourceGroupFragment'),
      ownerEmail: paramData.filters.get('ownerEmail'),
      status: paramData.filters.get('status'),
      type: workflowType || 'Tree',
      include: 'details',
      orderBy:
        paramData.sortColumn === 'sourceName'
          ? 'sourceRoot.name'
          : paramData.sortColumn,
      direction: paramData.sortColumn ? paramData.sortDirection : undefined,
      limit: paramData.pageSize,
      offset: paramData.nextPageToken,
    },
  ],
  transform: result => ({
    data: alterData ? alterData(result.trees) : result.trees,
    nextPageToken: result.nextPageToken,
  }),
});

const filterDataSources = () => ({
  sourceTypes: {
    fn: fetchSources,
    params: [],
    transform: result =>
      result.sources
        .filter(s => s.name !== '-')
        .map(s => ({
          label: s.name,
          value: s.name,
        })),
  },
});

const filters = () => ({ sourceTypes }) =>
  sourceTypes && [
    { name: 'name', label: 'Name', type: 'text' },
    { name: 'nameFragment', label: 'Name', type: 'text' },
    {
      name: 'sourceName',
      label: 'Source Name',
      type: 'select',
      options: sourceTypes,
    },
    { name: 'sourceGroup', label: 'Source Group', type: 'text' },
    { name: 'sourceGroupFragment', label: 'Source Group', type: 'text' },
    { name: 'ownerEmail', label: 'Owner Email', type: 'text' },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      options: STATUS_OPTIONS,
    },
  ];

const columns = [
  {
    value: 'id',
    title: 'ID',
    sortable: false,
  },
  {
    value: 'name',
    title: 'Name',
    sortable: true,
  },
  {
    value: 'notes',
    title: 'Notes',
    sortable: false,
  },
  {
    value: 'definitionId',
    title: 'Definition ID',
    sortable: true,
  },
  {
    value: 'ownerEmail',
    title: 'Owner EMail',
    sortable: false,
  },
  {
    value: 'sourceGroup',
    title: 'Source Group',
    sortable: true,
  },
  {
    value: 'sourceName',
    title: 'Source Name',
    sortable: true,
  },
  {
    value: 'status',
    title: 'Status',
    sortable: true,

    options: () => STATUS_OPTIONS,
  },
  { value: 'title', title: 'Title', sortable: false },
  { value: 'type', title: 'type', sortable: false },
  { value: 'createdAt', title: 'Created', sortable: false },
  { value: 'createdBy', title: 'Created By', sortable: false },
  { value: 'updatedAt', title: 'Updated', sortable: true },
  { value: 'updatedBy', title: 'Updated By', sortable: false },
];

export const WorkflowTable = generateTable({
  tableOptions: ['alterData', 'workflowType', 'sourceName', 'sourceGroup'],
  columns,
  filters,
  filterDataSources,
  dataSource,
});

WorkflowTable.displayName = 'WorkflowTable';

import { fetchSources, fetchTaskRuns } from '../../../apis';
import { generateTable } from '../../table/Table';
import { get, getIn, Map } from 'immutable';

const ORDER_BY = Map({
  sourceName: 'tree.sourceRoot.name',
  sourceGroup: 'tree.sourceGroup',
  tree: 'tree.name',
  type: 'tree.type',
});

const RUN_TYPES = ['Tree', 'Global Routine', 'Local Routine'].map(v => ({
  label: v,
  value: v,
}));

const dataSource = ({
  sourceName,
  sourceGroup,
  treeName,
  treeType,
  sourceId,
  id,
  count,
}) => ({
  fn: fetchTaskRuns,
  params: paramData => [
    {
      source: sourceName ? sourceName : paramData.filters.get('sourceName'),
      includeSystemRuns: paramData.filters.get('includeSystemRuns'),
      group: sourceGroup ? sourceGroup : paramData.filters.get('sourceGroup'),
      groupFragment: paramData.filters.get('sourceGroupFragment'),
      tree: treeName ? treeName : paramData.filters.get('tree'),
      treeFragment: paramData.filters.get('treeFragment'),
      // groupFragment: sourceGroup
      //   ? sourceGroup
      //   : paramData.filters.get('sourceGroup'),
      // treeFragment: treeName ? treeName : paramData.filters.get('tree'),
      treeType: treeType ? treeType : paramData.filters.get('type'),
      sourceId: sourceId ? sourceId : paramData.filters.get('sourceId'),
      id: id ? id : paramData.filters.get('id'),
      include: 'details',
      limit: paramData.pageSize,
      offset: paramData.nextPageToken,
      count: count ? undefined : false,
      orderBy: ORDER_BY.get(paramData.sortColumn, paramData.sortColumn),
      direction: paramData.sortColumn ? paramData.sortDirection : undefined,
    },
  ],
  transform: result => ({
    data: result.runs,
    nextPageToken: result.nextPageToken,
  }),
});

const filterDataSources = () => ({
  sourceTypes: {
    fn: fetchSources,
    params: [],
    transform: result =>
      result.sources.filter(s => s.name !== '-').map(s => ({
        label: s.name,
        value: s.name,
      })),
  },
});

const filters = () => ({ sourceTypes }) =>
  sourceTypes && [
    {
      name: 'sourceName',
      label: 'Source',
      type: 'select',
      options: sourceTypes,
    },
    { name: 'sourceGroup', label: 'Group', type: 'text' },
    { name: 'sourceGroupFragment', label: 'Group', type: 'text' },
    { name: 'tree', label: 'Name', type: 'text' },
    { name: 'treeFragment', label: 'Name', type: 'text' },
    {
      name: 'includeSystemRuns',
      label: 'Include System Runs',
      type: 'checkbox',
    },
    {
      name: 'type',
      label: 'Type',
      type: 'select',
      options: RUN_TYPES,
      initialValue: 'Tree',
    },
    { name: 'sourceId', label: 'Source ID', type: 'text' },
    { name: 'id', label: 'Run ID', type: 'text' },
  ];

const columns = [
  {
    value: 'id',
    title: 'Id',
    sortable: true,
  },
  {
    value: 'originatingId',
    title: 'Originating ID',
    sortable: false,
  },
  {
    value: 'sourceName',
    valueTransform: (_value, row) => getIn(row, ['source', 'name'], ''),
    title: 'Source',
    sortable: true,
  },
  {
    value: 'sourceId',
    title: 'Source Id',
    sortable: false,
  },
  {
    value: 'tree',
    title: 'Tree',
    sortable: true,
    valueTransform: value => get(value, 'name', ''),
  },
  {
    value: 'sourceGroup',
    title: 'Group',
    sortable: true,
    valueTransform: (_value, row) => row.getIn(['tree', 'sourceGroup']),
  },
  {
    value: 'type',
    title: 'Type',
    sortable: true,
    valueTransform: (_value, row) => row.getIn(['tree', 'type']),
  },
  {
    value: 'status',
    title: 'Status',
    sortable: false,
  },
  { value: 'createdAt', title: 'Created', sortable: true },
  { value: 'createdBy', title: 'Created By', sortable: false },
  { value: 'updatedAt', title: 'Updated', sortable: true },
  { value: 'updatedBy', title: 'Updated By', sortable: false },
];

export const RunTable = generateTable({
  tableOptions: ['sourceName', 'sourceGroup', 'treeName', 'sourceId', 'count'],
  columns,
  filters,
  dataSource,
  filterDataSources,
});

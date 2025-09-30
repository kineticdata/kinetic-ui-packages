import { fetchTaskTriggers, fetchSources } from '../../../apis';
import { generateTable } from '../../table/Table';
import { get } from 'immutable';

const dataSource = ({
  runId,
  sourceName,
  sourceGroup,
  tree,
  treeType,
  triggerStatus,
  sourceId,
  status,
}) => ({
  fn: fetchTaskTriggers,
  params: paramData => [
    {
      runId,
      triggerStatus,
      source: sourceName ? sourceName : paramData.filters.get('sourceName'),
      group: sourceGroup ? sourceGroup : paramData.filters.get('sourceGroup'),
      treeName: tree ? tree : paramData.filters.get('tree'),
      treeType: treeType ? treeType : paramData.filters.get('type'),
      sourceId: sourceId ? sourceId : paramData.filters.get('sourceId'),
      status: status ? status : paramData.filters.get('status'),
      include: 'details,tree',
      limit: paramData.pageSize,
      offset: paramData.nextPageToken,
      orderBy: paramData.sortColumn,
      direction: paramData.sortColumn
        ? paramData.sortDirection.toUpperCase()
        : undefined,
    },
  ],
  transform: result => ({
    data: result.triggers,
    nextPageToken: result.nextPageToken,
    count: result.count,
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

const filters =
  () =>
  ({ sourceTypes }) =>
    sourceTypes && [
      {
        name: 'sourceName',
        label: 'Source Name',
        type: 'select',
        options: sourceTypes,
      },
      { name: 'sourceGroup', label: 'Group', type: 'text' },
      { name: 'tree', label: 'Tree', type: 'text' },
      { name: 'treeType', label: 'Tree Type', type: 'text' },
    ];

const columns = [
  {
    value: 'action',
    title: 'Action',
    sortable: false,
    toggleable: true,
  },
  {
    value: 'branchId',
    title: 'Branch Id',
    sortable: false,
    toggleable: true,
  },
  {
    value: 'type',
    title: 'Type',
    sortable: false,
    toggleable: true,
  },
  {
    value: 'engineIdentification',
    title: 'Engine Identification',
    sortable: false,
    toggleable: true,
  },
  {
    value: 'flags',
    title: 'Flags',
    sortable: false,
    toggleable: true,
  },
  {
    value: 'loopIndex',
    title: 'Loop Index',
    sortable: false,
    toggleable: true,
  },
  {
    value: 'managementAction',
    title: 'Management Action',
    sortable: false,
    toggleable: true,
  },
  {
    value: 'message',
    title: 'Message',
    sortable: false,
    toggleable: true,
  },
  {
    value: 'mode',
    title: 'Mode',
    sortable: false,
    toggleable: true,
  },
  {
    value: 'nodeId',
    title: 'Node Id',
    sortable: false,
    toggleable: true,
  },
  {
    value: 'nodeName',
    title: 'Node Name',
    sortable: false,
    toggleable: true,
  },
  {
    value: 'originator',
    title: 'Originator',
    sortable: false,
    toggleable: true,
  },
  {
    value: 'results',
    title: 'Results',
    sortable: false,
    toggleable: true,
  },
  {
    value: 'scheduledAt',
    title: 'Scheduled At',
    sortable: true,
    toggleable: true,
  },
  {
    value: 'selectionCriterion',
    title: 'Selection Criterion',
    sortable: false,
    toggleable: true,
  },
  {
    value: 'status',
    title: 'Status',
    sortable: false,
    toggleable: true,
  },
  {
    value: 'token',
    title: 'Token',
    sortable: false,
    toggleable: true,
  },
  {
    value: 'sourceName',
    //valueTransform: (_value, row) => getIn(row, ['tree', 'sourceName'], ''),
    title: 'Source',
    sortable: false,
    toggleable: false,
    columnOrder: 'first',
  },
  {
    value: 'sourceGroup',
    title: 'Group',
    sortable: false,
    toggleable: true,
    valueTransform: (_value, row) => row.getIn(['tree', 'sourceGroup']),
  },
  {
    value: 'tree',
    title: 'Tree',
    sortable: false,
    toggleable: true,
    valueTransform: value => get(value, 'name', ''),
  },
  {
    value: 'treeType',
    title: 'Tree Type',
    sortable: false,
    toggleable: true,
    valueTransform: (_value, row) => row.getIn(['tree', 'type']),
  },
  {
    value: 'createdAt',
    title: 'Created At',
    sortable: true,
    toggleable: true,
  },
  {
    value: 'createdBy',
    title: 'Created By',
    sortable: false,
    toggleable: true,
  },
  {
    value: 'id',
    title: 'ID',
    sortable: false,
    toggleable: true,
  },
  {
    value: 'updatedAt',
    title: 'Updated At',
    sortable: true,
    toggleable: true,
  },
  {
    value: 'updatedBy',
    title: 'Updated By',
    sortable: false,
    toggleable: true,
  },
];

export const TriggerTable = generateTable({
  tableOptions: ['runId', 'triggerStatus'],
  columns,
  filters,
  filterDataSources,
  dataSource,
});

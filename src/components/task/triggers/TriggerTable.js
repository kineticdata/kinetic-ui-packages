import { fetchTaskTriggers, fetchSources } from '../../../apis/task';
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
  },
  {
    value: 'branchId',
    title: 'Branch Id',
    sortable: false,
  },
  {
    value: 'type',
    title: 'Type',
    sortable: false,
  },
  {
    value: 'engineIdentification',
    title: 'Engine Identification',
    sortable: false,
  },
  {
    value: 'flags',
    title: 'Flags',
    sortable: false,
  },
  {
    value: 'loopIndex',
    title: 'Loop Index',
    sortable: false,
  },
  {
    value: 'managementAction',
    title: 'Management Action',
    sortable: false,
  },
  {
    value: 'message',
    title: 'Message',
    sortable: false,
  },
  {
    value: 'mode',
    title: 'Mode',
    sortable: false,
  },
  {
    value: 'nodeId',
    title: 'Node Id',
    sortable: false,
  },
  {
    value: 'nodeName',
    title: 'Node Name',
    sortable: false,
  },
  {
    value: 'originator',
    title: 'Originator',
    sortable: false,
  },
  {
    value: 'results',
    title: 'Results',
    sortable: false,
  },
  {
    value: 'scheduledAt',
    title: 'Scheduled At',
    sortable: true,
  },
  {
    value: 'selectionCriterion',
    title: 'Selection Criterion',
    sortable: false,
  },
  {
    value: 'status',
    title: 'Status',
    sortable: false,
  },
  {
    value: 'token',
    title: 'Token',
    sortable: false,
  },
  {
    value: 'sourceName',
    //valueTransform: (_value, row) => getIn(row, ['tree', 'sourceName'], ''),
    title: 'Source',
    sortable: false,
  },
  {
    value: 'sourceGroup',
    title: 'Group',
    sortable: false,
    valueTransform: (_value, row) => row.getIn(['tree', 'sourceGroup']),
  },
  {
    value: 'tree',
    title: 'Tree',
    sortable: false,
    valueTransform: value => get(value, 'name', ''),
  },
  {
    value: 'treeType',
    title: 'Tree Type',
    sortable: false,
    valueTransform: (_value, row) => row.getIn(['tree', 'type']),
  },
  { value: 'createdAt', title: 'Created', sortable: true },
  { value: 'createdBy', title: 'Created By', sortable: false },
  {
    value: 'id',
    title: 'ID',
    sortable: false,
  },
  { value: 'updatedAt', title: 'Updated', sortable: true },
  { value: 'updatedBy', title: 'Updated By', sortable: false },
];

export const TriggerTable = generateTable({
  tableOptions: ['runId', 'triggerStatus'],
  columns,
  filters,
  filterDataSources,
  dataSource,
});

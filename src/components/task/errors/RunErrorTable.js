import { fetchTaskRunErrors } from '../../../apis/task';
import { generateTable } from '../../table/Table';
import { getIn } from 'immutable';

const ERROR_TYPES = [
  'Connector Error',
  'Handler Error',
  'Invalid Trigger Error',
  'Missing Handler Error',
  'Missing Routine Error',
  'Node Message Error',
  'Node Parameter Error',
  'Source Error',
  'Tree Error',
  'Unidentified Error',
  'Unknown Variable Error',
];

const dataSource = ({ runId, id }) => ({
  fn: fetchTaskRunErrors,
  params: paramData => [
    {
      runId,
      source: paramData.filters.get('sourceName'),
      group: paramData.filters.get('sourceGroup'),
      tree: paramData.filters.get('treeName'),
      sourceId: paramData.filters.get('sourceId'),
      id: id ? id : paramData.filters.get('id'),
      status: paramData.filters.get('status'),
      nodeId: paramData.filters.get('nodeId'),
      handlerId: paramData.filters.get('handlerId'),
      type: paramData.filters.get('type'),
      relatedItem1Id: paramData.filters.get('relatedItem1Id'),
      relatedItem1Type: paramData.filters.get('relatedItem1Type'),
      relatedItem2Id: paramData.filters.get('relatedItem2Id'),
      relatedItem2Type: paramData.filters.get('relatedItem2Type'),
      include: 'details,run,run.details,messages,messages.details',
      limit: paramData.pageSize,
      offset: paramData.nextPageToken,
      timeline: paramData.sortColumn,
      direction: paramData.sortColumn
        ? paramData.sortDirection.toUpperCase()
        : undefined,
      start: paramData.filters.get('createdAtMin')
        ? paramData.filters.get('createdAtMin')
        : undefined,
      end: paramData.filters.get('createdAtMax')
        ? paramData.filters.get('createdAtMax')
        : undefined,
    },
  ],
  transform: result => ({
    data: result.runErrors,
    nextPageToken: result.nextPageToken,
  }),
});

const filters = () => () => [
  {
    name: 'id',
    label: 'Error Id',
    type: 'text',
    serialize: ({ values }) => values.get('id') && parseInt(values.get('id')),
  },
  {
    name: 'type',
    label: 'Type',
    type: 'select',
    options: ERROR_TYPES.map(s => ({ label: s, value: s })),
  },
  {
    name: 'status',
    label: 'Status',
    type: 'select',
    options: ['Active', 'Handled'].map(s => ({ label: s, value: s })),
  },
  {
    name: 'createdAtMin',
    label: 'Start',
    type: 'date',
  },
  {
    name: 'createdAtMax',
    label: 'End',
    type: 'date',
  },
];

const columns = [
  {
    value: 'createdAt',
    title: 'Created At',
    sortable: true,
  },
  {
    value: 'createdBy',
    title: 'Created By',
    sortable: false,
  },
  {
    value: 'engineIdentification',
    title: 'Engine Identification',
    sortable: false,
  },
  {
    value: 'id',
    title: 'Error Id',
    sortable: false,
  },
  {
    value: 'relatedItem1Id',
    title: 'Related Item 1 ID',
    sortable: false,
  },
  {
    value: 'relatedItem1Type',
    title: 'Related Item 1 Type',
    sortable: false,
  },
  {
    value: 'relatedItem2Id',
    title: 'Related Item 2 ID',
    sortable: false,
  },
  {
    value: 'relatedItem2Type',
    title: 'Related Item 2 Type',
    sortable: false,
  },
  {
    value: 'status',
    title: 'Status',
    sortable: false,
  },
  {
    value: 'sourceName',
    title: 'Source',
    sortable: false,
    valueTransform: (_value, row) =>
      getIn(row, ['run', 'tree', 'sourceName'], ''),
  },
  {
    value: 'sourceGroup',
    title: 'Group',
    sortable: false,
    valueTransform: (_value, row) =>
      getIn(row, ['run', 'tree', 'sourceGroup'], ''),
  },
  {
    value: 'treeName',
    title: 'Name',
    sortable: false,
    valueTransform: (_value, row) => getIn(row, ['run', 'tree', 'name'], ''),
  },
  {
    value: 'Summary',
    title: 'Summary',
    sortable: false,
  },
  {
    value: 'text',
    title: 'Text',
    sortable: false,
  },
  {
    value: 'type',
    title: 'Type',
    sortable: false,
  },
  {
    value: 'updatedAt',
    title: 'Updated At',
    sortable: true,
  },
  {
    value: 'updatedBy',
    title: 'Updated By',
    sortable: false,
  },
];

export const RunErrorTable = generateTable({
  tableOptions: ['runId'],
  columns,
  filters,
  dataSource,
});

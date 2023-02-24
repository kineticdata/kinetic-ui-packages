import { generateTable } from '../../table/Table';
import { fetchWorkflows } from '../../../apis';
import { defineFilter } from '../../../helpers';

const STATUS_OPTIONS = ['Active', 'Inactive', 'Paused'].map(v => ({
  label: v,
  value: v,
}));

const clientSide = defineFilter(true)
  .equals('name', 'name')
  .startsWith('event', 'event')
  .equals('status', 'status')
  .end();

const dataSource = ({ formSlug, kappSlug }) => ({
  clientSide,
  fn: fetchWorkflows,
  params: paramData => [
    {
      kappSlug,
      formSlug,
      include: 'details',
      name: paramData.filters.get('name'),
      event: paramData.filters.get('event'),
      status: paramData.filters.get('status'),
    },
  ],
  transform: result => {
    const extraData = {
      migratable: result.migratable,
      missing: result.missing,
      orphaned: result.orphaned,
    };
    return {
      data: result.workflows,
      nextPageToken: result.nextPageToken,
      extraData,
    };
  },
});

const filters = () => ({ sourceTypes }) =>
  sourceTypes && [
    { name: 'name', label: 'Name', type: 'text' },
    { name: 'event', label: 'Event', type: 'text' },
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
    value: 'event',
    title: 'Event',
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

export const LinkedWorkflowTable = generateTable({
  tableOptions: ['kappSlug', 'formSlug'],
  columns,
  filters,
  dataSource,
});

LinkedWorkflowTable.displayName = 'LinkedWorkflowTable';

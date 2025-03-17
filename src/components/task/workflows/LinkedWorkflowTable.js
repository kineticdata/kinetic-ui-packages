import { generateTable } from '../../table/Table';
import { fetchWorkflows } from '../../../apis';
import { defineFilter } from '../../../helpers';

const STATUS_OPTIONS = ['Active', 'Inactive', 'Paused'].map(v => ({
  label: v,
  value: v,
}));

const clientSideFilter = defineFilter(true)
  .startsWith('name', 'name')
  .startsWith('event', 'event')
  .equals('status', 'status')
  .end();

const clientSide = (object, filters) =>
  clientSideFilter(
    object.event
      ? object
      : {
          ...object,
          name: 'Legacy workflow',
          event: `${object.sourceGroup?.split(' > ')[0]?.replace(/s?$/, '')} ${
            object.name
          }`,
        },
    filters,
  );

const dataSource = ({ formSlug, kappSlug }) => ({
  clientSide,
  fn: fetchWorkflows,
  params: () => [{ kappSlug, formSlug, include: 'details' }],
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

const filters = () => () => [
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
    toggleable: true,
  },
  {
    value: 'name',
    title: 'Name',
    sortable: true,
    toggleable: false,
    columnOrder: 'first',
  },
  {
    value: 'event',
    title: 'Event',
    sortable: true,
    toggleable: true,
  },
  {
    value: 'notes',
    title: 'Notes',
    sortable: false,
    toggleable: true,
  },
  {
    value: 'definitionId',
    title: 'Definition ID',
    sortable: true,
    toggleable: true,
  },
  {
    value: 'ownerEmail',
    title: 'Owner Email',
    sortable: false,
    toggleable: true,
  },
  {
    value: 'sourceGroup',
    title: 'Source Group',
    sortable: true,
    toggleable: true,
  },
  {
    value: 'sourceName',
    title: 'Source Name',
    sortable: true,
    toggleable: true,
  },
  {
    value: 'status',
    title: 'Status',
    sortable: true,
    toggleable: true,
    options: () => STATUS_OPTIONS,
  },
  {
    value: 'title',
    title: 'Title',
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
    value: 'createdAt',
    title: 'Created At',
    sortable: false,
    toggleable: true,
  },
  {
    value: 'createdBy',
    title: 'Created By',
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

export const LinkedWorkflowTable = generateTable({
  tableOptions: ['kappSlug', 'formSlug'],
  columns,
  filters,
  dataSource,
});

LinkedWorkflowTable.displayName = 'LinkedWorkflowTable';

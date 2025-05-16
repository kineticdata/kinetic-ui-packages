import { generateTable } from '../../table/Table';
import { fetchSources } from '../../../apis';
import { defineFilter } from '../../../helpers';
import { fetchSourceAdapters } from '../../../apis/task';

const clientSide = defineFilter(true)
  .startsWith('name', 'name')
  .equals('type', 'type')
  .end();

const filterDataSources = () => ({
  sourceTypes: {
    fn: fetchSourceAdapters,
    params: [],
    transform: result =>
      result.sourceAdapters.map(st => ({
        label: st.name,
        value: st.name,
      })),
  },
});

const dataSource = () => ({
  fn: fetchSources,
  params: () => [{ include: 'details' }],
  transform: result => ({ data: result.sources }),
  clientSide,
});

const filters =
  () =>
  ({ sourceTypes }) =>
    sourceTypes && [
      { name: 'name', label: 'Name', type: 'text' },
      {
        name: 'type',
        label: 'Type',
        type: 'select',
        options: sourceTypes,
      },
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
    title: 'Type',
    value: 'type',
    toggleable: true,
  },
  {
    title: 'Created At',
    value: 'createdAt',
    toggleable: true,
  },
  {
    title: 'Created By',
    value: 'createdBy',
    toggleable: true,
  },
  {
    title: 'Updated At',
    value: 'updatedAt',
    toggleable: true,
  },
  {
    title: 'Updated By',
    value: 'updatedBy',
    toggleable: true,
  },
];

export const SourceTable = generateTable({
  columns,
  filters,
  filterDataSources,
  dataSource,
});

SourceTable.displayName = 'SourceTable';

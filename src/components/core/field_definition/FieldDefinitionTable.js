import { generateTable } from '../../table/Table';
import { fetchKapp, fetchSpace } from '../../../apis';
import { defineFilter } from '../../../helpers';

const clientSide = defineFilter(true)
  .startsWith('name', 'name')
  .equals('status', 'status')
  .equals('unique', 'unique')
  .end();

const dataSource = ({ kappSlug }) => ({
  fn: kappSlug ? fetchKapp : fetchSpace,
  clientSide,
  params: () => [
    {
      kappSlug,
      include: 'fields',
    },
  ],
  transform: result => ({
    data: kappSlug ? result.kapp.fields : result.space.fields,
  }),
});

// const filters = () => () => [
//   { name: 'name', label: 'Name', type: 'text' },
//   {
//     name: 'status',
//     label: 'Status',
//     type: 'select',
//     options: indexStatuses.map(el => ({ value: el, label: el })),
//   },
//   {
//     name: 'unique',
//     label: 'Unique',
//     type: 'select',
//     options: ['Yes', 'No'].map(el => ({ value: el, label: el })),
//   },
// ];

const columns = [
  {
    value: 'key',
    title: 'Key',
  },
  {
    value: 'name',
    title: 'Name',
  },
  {
    value: 'dataType',
    title: 'Type',
  },
  {
    value: 'createdAt',
    title: 'Created At',
  },
  {
    value: 'createdBy',
    title: 'Created By',
  },
  {
    value: 'updatedAt',
    title: 'Updated At',
  },
  {
    value: 'updatedBy',
    title: 'Updated By',
  },
];

export const FieldDefinitionTable = generateTable({
  tableOptions: ['kappSlug'],
  sortable: false,
  columns,
  // filters,
  dataSource,
});

FieldDefinitionTable.displayName = 'FieldDefinitionTable';

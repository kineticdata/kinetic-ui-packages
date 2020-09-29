import { generateTable } from '../../table/Table';
import { fetchKapp, fetchSpace } from '../../../apis';
import { defineFilter } from '../../../helpers';

export const FIELD_DATA_TYPES = [
  { value: 'attachment', label: 'Attachment', dataType: 'file' },
  { value: 'checkbox', label: 'Checkbox', dataType: 'json' },
  { value: 'date', label: 'Date', dataType: 'string' },
  { value: 'datetime', label: 'Date/Time', dataType: 'string' },
  { value: 'dropdown', label: 'Dropdown', dataType: 'string' },
  { value: 'radio', label: 'Radio', dataType: 'string' },
  { value: 'text', label: 'Text', dataType: 'string' },
  { value: 'time', label: 'Time', dataType: 'string' },
];

const clientSide = defineFilter(true)
  .startsWith('name', 'name')
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

const filters = () => () => [{ name: 'name', label: 'Name', type: 'text' }];

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
    value: 'renderType',
    title: 'Render Type',
  },
  {
    value: 'dataType',
    title: 'Data Type',
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
  columns,
  filters,
  dataSource,
});

FieldDefinitionTable.displayName = 'FieldDefinitionTable';

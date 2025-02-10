import { generateTable } from '../../table/Table';
import { fetchSystemErrors } from '../../../apis';
import { defineFilter } from '../../../helpers';

const STATUS_VALUES = ['Active', 'Handled'].map(s => ({
  value: s,
  label: s,
}));

const clientSide = defineFilter(true)
  .equals('status', 'status')
  .end();

const dataSource = () => ({
  fn: fetchSystemErrors,
  clientSide,
  params: () => [{ include: 'details' }],
  transform: result => ({ data: result.systemErrors }),
});

const filters = () => () => [
  {
    name: 'status',
    label: 'Status',
    type: 'select',
    options: STATUS_VALUES,
  },
];
const columns = [
  {
    value: 'summary',
    title: 'System Error',
    sortable: false,
  },
  {
    value: 'type',
    title: 'Error Type',
    sortable: true,
  },
  {
    value: 'createdAt',
    title: 'Occurred',
    sortable: true,
  },
  {
    value: 'createdBy',
    title: 'Created By',
    sortable: true,
  },
  {
    value: 'status',
    title: 'Status',
    sortable: true,
  },
  {
    value: 'text',
    title: 'Text',
    sortable: false,
  },
  {
    value: 'id',
    title: 'Error ID',
    sortable: true,
  },
  {
    value: 'updatedAt',
    title: 'Updated At',
    sortable: true,
  },
  {
    value: 'updatedBy',
    title: 'Updated By',
    sortable: true,
  },
];

export const SystemErrorsTable = generateTable({
  columns,
  filters,
  dataSource,
});
SystemErrorsTable.propTypes = {};
SystemErrorsTable.displayName = 'SystemErrorsTable';

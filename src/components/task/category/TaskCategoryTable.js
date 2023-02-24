import { generateTable } from '../../table/Table';
import { fetchTaskCategories } from '../../../apis';
import { defineFilter } from '../../../helpers';

const clientSide = defineFilter(true)
  .startsWith('name', 'name')
  .end();

const dataSource = () => ({
  fn: fetchTaskCategories,
  clientSide,
  params: () => [{ include: 'details' }],
  transform: result => ({ data: result.categories }),
});

const filters = () => () => [{ name: 'name', label: 'Name', type: 'text' }];

const columns = [
  {
    value: 'name',
    title: 'Name',
    sortable: true,
  },
  {
    value: 'description',
    title: 'Description',
    type: 'text',
  },
  {
    value: 'type',
    title: 'Type',
    sortable: true,
  },
  {
    value: 'id',
    title: 'Id',
    sortable: true,
  },
  {
    value: 'createdAt',
    title: 'Created',
    sortable: true,
  },
  {
    value: 'createdBy',
    title: 'Created By',
    sortable: true,
  },
  {
    value: 'updatedAt',
    title: 'Updated',
    sortable: true,
  },
  {
    value: 'updatedBy',
    title: 'Updated By',
    sortable: true,
  },
];

export const TaskCategoryTable = generateTable({
  tableOptions: [],
  columns,
  filters,
  dataSource,
});
TaskCategoryTable.propTypes = {};
TaskCategoryTable.displayName = 'TaskCategoryTable';

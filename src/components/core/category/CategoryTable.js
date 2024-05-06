import t from 'prop-types';
import { generateTable } from '../../table/Table';
import { fetchCategories } from '../../../apis';
import { defineFilter } from '../../../helpers';

const clientSide = defineFilter(true)
  .startsWith('name', 'name')
  .startsWith('slug', 'slug')
  .end();

const dataSource = ({ kappSlug }) => ({
  fn: fetchCategories,
  clientSide,
  params: () => [{ include: 'details', kappSlug }],
  transform: result => ({ data: result.categories }),
});

const filters = () => () => [
  { name: 'name', label: 'Name', type: 'text' },
  { name: 'slug', label: 'Slug', type: 'text' },
];

const columns = [
  {
    value: 'name',
    title: 'Name',
    sortable: true,
    toggleable: false,
    columnOrder: 'first',
  },
  {
    value: 'slug',
    title: 'Slug',
    sortable: true,
    toggleable: true,
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
    sortable: true,
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
    sortable: true,
    toggleable: true,
  },
];

export const CategoryTable = generateTable({
  tableOptions: ['kappSlug'],
  columns,
  filters,
  dataSource,
});
CategoryTable.propTypes = {
  /** The Slug of the kapp to display categories for */
  kappSlug: t.string.isRequired,
};
CategoryTable.displayName = 'CategoryTable';

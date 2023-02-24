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
  },
  {
    value: 'slug',
    title: 'Slug',
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

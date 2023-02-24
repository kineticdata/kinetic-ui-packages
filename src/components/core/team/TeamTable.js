import { generateTable } from '../../table/Table';
import { fetchTeams } from '../../../apis';
import { defineKqlQuery } from '../../../helpers';
import {
  generatePaginationParams,
  generateSortParams,
} from '../../../apis/http';

const teamQuery = defineKqlQuery()
  .startsWith('name', 'name')
  .end();

const dataSource = () => ({
  fn: fetchTeams,
  params: paramData => [
    {
      ...generateSortParams(paramData),
      ...generatePaginationParams(paramData),
      q: teamQuery(paramData.filters.toJS()),
      include: 'authorization,details',
    },
  ],
  transform: result => ({
    data: result.teams,
    nextPageToken: result.nextPageToken,
  }),
});

const filters = () => () => [{ name: 'name', label: 'Name', type: 'text' }];

const columns = [
  {
    value: 'name',
    title: 'Name',
    sortable: true,
  },
  {
    value: 'updatedAt',
    title: 'Updated',
    sortable: true,
  },
  {
    value: 'createdAt',
    title: 'Created',
    sortable: true,
  },
  {
    value: 'description',
    title: 'Description',
    sortable: true,
  },
  {
    value: 'slug',
    title: 'Slug',
    sortable: true,
  },
];

export const TeamTable = generateTable({
  columns,
  filters,
  dataSource,
});

TeamTable.displayName = 'TeamTable';

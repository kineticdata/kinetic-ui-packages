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
    value: 'description',
    title: 'Description',
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

export const TeamTable = generateTable({
  columns,
  filters,
  dataSource,
});

TeamTable.displayName = 'TeamTable';

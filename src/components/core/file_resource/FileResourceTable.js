import { defineKqlQuery } from '../../../helpers';
import { fetchFileResources } from '../../../apis';
import {
  generatePaginationParams,
  generateSortParams,
} from '../../../apis/http';
import { generateTable } from '../../table/Table';

const filters = () => () => [{ name: 'slug', label: 'Slug', type: 'text' }];

const fileResourceQuery = defineKqlQuery()
  .matches('agentSlug', 'agentSlug')
  .matches('filestoreSlug', 'filestoreSlug')
  .matches('slug', 'slug')
  .end();

const dataSource = () => ({
  fn: fetchFileResources,
  params: paramData => [
    {
      ...generateSortParams(paramData),
      ...generatePaginationParams(paramData),
      q: fileResourceQuery(paramData.filters.toJS()),
      include: 'details',
    },
  ],
  transform: result => ({
    data: result.fileResources,
    nextPageToken: result.nextPageToken,
  }),
});

const columns = [
  {
    value: 'slug',
    title: 'Slug',
    sortable: true,
  },
  {
    value: 'agentSlug',
    title: 'Agent Slug',
    sortable: true,
  },
  {
    value: 'filestoreSlug',
    title: 'File Store Slug',
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

export const FileResourceTable = generateTable({
  tableOptions: [],
  columns,
  filters,
  dataSource,
});

FileResourceTable.displayName = 'FileResourceTable';

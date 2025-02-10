import { generateTable } from '../../table/Table';
import { fetchKapps } from '../../../apis';
import { defineKqlQuery } from '../../../helpers';
import {
  generatePaginationParams,
  generateSortParams,
} from '../../../apis/http';

const kappQuery = defineKqlQuery()
  .matches('name', 'name')
  .matches('slug', 'slug')
  .end();

const dataSource = () => ({
  fn: fetchKapps,
  params: paramData => [
    {
      include: 'details',
      ...generateSortParams(paramData),
      ...generatePaginationParams(paramData),
      q: kappQuery(paramData.filters.toJS()),
    },
  ],
  transform: result => ({
    data: result.kapps,
    nextPageToken: result.nextPageToken,
  }),
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
    toggleable: true,
  },

  { value: 'afterLogoutPath', title: 'After Logout Path', toggleable: true },
  {
    value: 'defaultSubmissionLabelExpression',
    title: 'Default Submission Label',
    toggleable: true,
  },
];

export const KappTable = generateTable({
  columns,
  filters,
  dataSource,
});

KappTable.displayName = 'KappTable';

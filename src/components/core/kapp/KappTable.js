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
  },
  {
    value: 'slug',
    title: 'Slug',
    sortable: true,
  },
  {
    value: 'CreatedAt',
    title: 'Created',
    sortable: true,
  },
  {
    value: 'createdBy',
    title: 'Created By',
  },
  {
    value: 'updatedAt',
    title: 'Updated',
    sortable: true,
  },
  {
    value: 'updatedBy',
    title: 'Updated By',
  },
  {
    value: 'resetPasswordPage',
    title: 'Reset Password Page',
  },

  { value: 'afterLogoutPath', title: 'After Logout Path' },
  { value: 'bundlePath', title: 'Bundle Path' },
  { value: 'defaultFormConfirmationPage', title: 'Form Confirmation Page' },
  { value: 'defaultFormDisplayPage', title: 'Form Display Page' },
  {
    value: 'defaultSubmissionLabelExpression',
    title: 'Default Submission Label',
  },
  { value: 'displayType', title: 'Display Type' },
  { value: 'displayValue', title: 'Display Value' },
  { value: 'loginPage', title: 'Login Page' },
  { value: 'resetPasswordPage', title: 'Reset Password Page' },
];

export const KappTable = generateTable({
  columns,
  filters,
  dataSource,
});

KappTable.displayName = 'KappTable';

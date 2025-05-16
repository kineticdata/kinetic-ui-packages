import React from 'react';
import { generateTable } from '../../table/Table';
import { fetchUsers } from '../../../apis';
import { defineKqlQuery } from '../../../helpers';
import {
  generatePaginationParams,
  generateSortParams,
} from '../../../apis/http';

const userQuery = defineKqlQuery()
  .startsWith('username', 'username')
  .startsWith('email', 'email')
  .startsWith('displayName', 'displayName')
  .equals('enabled', 'enabled')
  .equals('spaceAdmin', 'spaceAdmin')
  .end();

const dataSource = ({ spaceSlug }) => ({
  fn: fetchUsers,
  params: paramData => [
    {
      spaceSlug,
      ...generateSortParams(paramData),
      ...generatePaginationParams(paramData),
      q: userQuery(paramData.filters.toJS()),
      include: 'authorization,details',
    },
  ],
  transform: result => ({
    data: result.users,
    nextPageToken: result.nextPageToken,
  }),
});

const filters = () => () => [
  { name: 'username', label: 'Username', type: 'text' },
  { name: 'email', label: 'Email', type: 'text' },
  { name: 'displayName', label: 'Display Name', type: 'text' },

  {
    name: 'enabled',
    label: 'Enabled?',
    type: 'select',
    options: [
      { label: 'Yes', value: true },
      { label: 'No', value: false },
    ],
  },
  {
    name: 'spaceAdmin',
    label: 'Space Admin?',
    type: 'select',
    options: [
      { label: 'Yes', value: true },
      { label: 'No', value: false },
    ],
  },
];

const BooleanYesNoCell = props => <td>{props.value ? 'Yes' : 'No'}</td>;

const columns = [
  {
    value: 'username',
    title: 'Username',
    sortable: true,
    toggleable: false,
    columnOrder: 'first',
  },
  {
    value: 'email',
    title: 'Email',
    sortable: true,
    toggleable: true,
  },
  {
    value: 'displayName',
    title: 'Display Name',
    sortable: true,
    toggleable: true,
  },
  {
    value: 'enabled',
    title: 'Enabled?',
    sortable: false,
    toggleable: true,
    components: { BodyCell: BooleanYesNoCell },
  },
  {
    value: 'spaceAdmin',
    title: 'Space Admin?',
    sortable: false,
    toggleable: true,
    components: { BodyCell: BooleanYesNoCell },
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

export const UserTable = generateTable({
  tableOptions: ['system', 'spaceSlug'],
  columns,
  filters,
  dataSource,
});

UserTable.displayName = 'UserTable';

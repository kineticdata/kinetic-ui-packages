import { generateTable } from '../../table/Table';
import { fetchWebApis } from '../../../apis';
import { WEB_API_METHODS } from './WebApiForm';
import { defineFilter } from '../../../helpers';

const clientSide = defineFilter(true)
  .startsWith('slug', 'slug')
  .equals('method', 'method')
  .end();

const dataSource = ({ kappSlug }) => ({
  fn: fetchWebApis,
  clientSide,
  params: () => [{ kappSlug, include: 'details,securityPolicies' }],
  transform: result => ({
    data: result.webApis,
  }),
});

const filters = () => () => [
  { name: 'slug', label: 'Slug', type: 'text' },
  {
    name: 'method',
    label: 'Method',
    type: 'select',
    options: () =>
      WEB_API_METHODS.map(el => ({
        value: el,
        label: el,
      })),
  },
];

const columns = [
  {
    value: 'slug',
    title: 'Slug',
    sortable: true,
    toggleable: false,
    columnOrder: 'first',
  },
  {
    value: 'method',
    title: 'Method',
    sortable: true,
    toggleable: true,
  },
  {
    value: 'createdAt',
    title: 'Created',
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
    title: 'Updated',
    sortable: true,
    toggleable: true,
  },
  {
    value: 'updatedBy',
    title: 'Updated By',
    toggleable: true,
  },
];

export const WebApiTable = generateTable({
  tableOptions: ['kappSlug'],
  columns,
  filters,
  dataSource,
});

WebApiTable.displayName = 'WebApiTable';

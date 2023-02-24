import { generateTable } from '../../table/Table';
import { fetchOAuthClients } from '../../../apis';
import { defineFilter } from '../../../helpers';

const clientSide = defineFilter(true)
  .startsWith('name', 'name')
  .end();

const dataSource = () => ({
  fn: fetchOAuthClients,
  clientSide,
  params: () => [],
  transform: result => ({
    data: result.oauthClients,
  }),
});

const filters = () => () => [{ name: 'name', label: 'Name', type: 'text' }];

const columns = [
  {
    value: 'clientId',
    title: 'Client ID',
    sortable: true,
  },
  {
    value: 'description',
    title: 'Description',
    sortable: false,
  },
  {
    value: 'name',
    title: 'Name',
    sortable: true,
  },
  {
    value: 'redirectUri',
    title: 'Redirect URI',
    sortable: true,
  },
];

export const OAuthClientTable = generateTable({
  columns,
  filters,
  dataSource,
});

OAuthClientTable.displayName = 'OAuthClientTable';

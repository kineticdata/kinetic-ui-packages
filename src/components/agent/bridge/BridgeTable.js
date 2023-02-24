import { generateTable } from '../../table/Table';
import { fetchBridges } from '../../../apis';
import { defineFilter } from '../../../helpers';

const clientSide = defineFilter(true)
  .startsWith('slug', 'slug')
  .startsWith('adapterClass', 'adapterClass')
  .end();

const dataSource = ({ agentSlug }) => ({
  fn: fetchBridges,
  clientSide,
  params: () => [
    {
      agentSlug,
      include: 'details',
    },
  ],
  transform: result => ({
    data: result.bridges,
  }),
});

const filters = () => () => [
  { name: 'slug', label: 'Slug', type: 'text' },
  { name: 'adapterClass', label: 'Adapter', type: 'text' },
];

const columns = [
  {
    value: 'slug',
    title: 'Slug',
    sortable: true,
  },
  {
    value: 'adapterClass',
    title: 'Adapter',
    sortable: true,
    valueTransform: _value =>
      _value
        .split('.')
        .pop()
        .match(/[A-Z][a-z]+/g)
        .join(' '),
  },
];

export const BridgeTable = generateTable({
  tableOptions: ['agentSlug'],
  columns,
  filters,
  dataSource,
});

BridgeTable.displayName = 'BridgeTable';

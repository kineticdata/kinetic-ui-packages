import { generateTable } from '../../table/Table';
import { fetchEnabledLocales } from '../../../apis';
import { defineFilter } from '../../../helpers';

const clientSide = defineFilter(true)
  .startsWith('code', 'code')
  .end();

const dataSource = () => ({
  fn: fetchEnabledLocales,
  clientSide,
  params: paramData => [
    {
      include: 'authorization,details',
    },
  ],
  transform: result => ({
    data: result.locales,
    nextPageToken: result.nextPageToken,
  }),
});

const filters = () => () => [
  { name: 'code', label: 'Locale Code', type: 'text' },
];

const columns = [
  {
    value: 'code',
    title: 'Code',
    sortable: true,
  },
];

export const LocaleTable = generateTable({
  columns,
  filters,
  dataSource,
});

LocaleTable.displayName = 'LocaleTable';

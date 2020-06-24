import { generateTable } from '../../table/Table';
import {
  fetchTranslations,
  fetchStagedTranslations,
  fetchEnabledLocales,
} from '../../../apis';
import { defineFilter } from '../../../helpers';
import { Map } from 'immutable';

const clientSide = defineFilter(true)
  .startsWith('locale', 'locale')
  .startsWith('context', 'context')
  .startsWith('key', 'key')
  .end();

const dataSource = ({ shared, staged, locale, keyHash, context }) => ({
  fn: staged ? fetchStagedTranslations : fetchTranslations,
  clientSide,
  params: paramData => [
    {
      localeCode: locale && locale,
      keyHash: keyHash && keyHash,
      contextName: shared ? 'shared' : context ? context : null,
      include: 'authorization,details',
    },
  ],
  transform: result => ({
    data: staged ? result.changes : result.entries,
    nextPageToken: result.nextPageToken,
  }),
});

const filterDataSources = () => ({
  locales: {
    fn: fetchEnabledLocales,
    params: () => [{ include: 'details' }],
    transform: result => result.locales,
  },
});

const filters = () => ({ locales }) => [
  {
    name: 'locale',
    label: 'Locale',
    type: 'select',
    options: ({ locales }) =>
      locales &&
      locales.map(loc => {
        return Map({
          value: loc.get('code'),
          label: loc.get('code'),
        });
      }),
  },
  { name: 'context', label: 'Context', type: 'text' },
  { name: 'key', label: 'Key', type: 'text' },
];

const columns = [
  {
    value: 'locale',
    title: 'Locale',
    sortable: true,
  },
  {
    value: 'context',
    title: 'Context',
    sortable: true,
  },
  {
    value: 'key',
    title: 'Key',
    sortable: true,
  },
  {
    value: 'value',
    title: 'Translation',
    sortable: true,
  },
  {
    value: 'valueStaged',
    title: 'New Translation',
    sortable: true,
  },
];

export const EntryTable = generateTable({
  tableOptions: ['staged', 'shared', 'locale', 'keyHash', 'context'],
  columns,
  filters,
  dataSource,
  filterDataSources,
});

EntryTable.displayName = 'EntryTable';

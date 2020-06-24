import { generateTable } from '../../table/Table';
import { fetchContexts, fetchKapps } from '../../../apis';
import { defineFilter } from '../../../helpers';

const clientSide = defineFilter(true)
  .startsWith('kapp', 'kapp')
  .startsWith('form', 'form')
  .startsWith('name', 'context')
  .end();

const dataSource = () => ({
  fn: fetchContexts,
  clientSide,
  params: () => [
    {
      include: 'authorization,details',
      expected: true,
    },
  ],
  transform: result => ({
    data: result.contexts,
    nextPageToken: result.nextPageToken,
  }),
});

const filterDataSources = () => ({
  kapps: {
    fn: fetchKapps,
    params: () => [{ include: 'details' }],
    transform: result =>
      result.kapps.map(kapp => ({ label: kapp.slug, value: kapp.slug })),
  },
});

const filters = () => ({ kapps }) =>
  kapps && [
    {
      name: 'context',
      label: 'Context Type',
      type: 'select',
      options: ['Kapp', 'Datastore', 'Custom'].map(el => ({
        value: el,
        label: el === 'Kapp' ? 'Form' : el,
      })),
      onChange: (_bindings, { setValue }) => {
        setValue('kapp', '');
        setValue('form', '');
      },
    },
    {
      name: 'kapp',
      label: 'Kapp Slug',
      type: 'select',
      enabled: ({ values }) => values.get('context') === 'Kapp',
      options: kapps,
    },
    { name: 'form', label: 'Form Slug', type: 'text' },
  ];

const columns = [
  {
    value: 'kapp',
    title: 'Kapp Slug',
    sortable: true,
  },
  {
    value: 'form',
    title: 'Form Slug',
    sortable: true,
  },
  {
    value: 'name',
    title: 'Context Name',
    sortable: true,
  },
];

export const ContextTable = generateTable({
  columns,
  filters,
  dataSource,
  filterDataSources,
});

ContextTable.displayName = 'ContextTable';

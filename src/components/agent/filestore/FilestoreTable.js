import { defineFilter } from '../../../helpers';
import { fetchFilestores } from '../../../apis/core/filestores';
import { generateTable } from '../../table/Table';

const clientSide = defineFilter(true)
  .startsWith('slug', 'slug')
  .end();

const dataSource = ({ agentSlug }) => ({
  fn: fetchFilestores,
  clientSide,
  params: () => [{ agentSlug, include: 'details' }],
  transform: result => ({
    data: result.filestores,
  }),
});

const filters = () => () => [{ name: 'slug', label: 'Slug', type: 'text' }];

const columns = [{ value: 'slug', title: 'Slug', sortable: true }];

export const FilestoreTable = generateTable({
  tableOptions: ['agentSlug'],
  columns,
  filters,
  dataSource,
});

FilestoreTable.displayName = 'FilestoreTable';

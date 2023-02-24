import { generateTable } from '../../table/Table';
import { fetchAgentHandlers } from '../../../apis';
import { defineFilter } from '../../../helpers';

const clientSide = defineFilter(true)
  .startsWith('slug', 'slug')
  .startsWith('definitionId', 'definitionId')
  .end();

const dataSource = ({ agentSlug }) => ({
  fn: fetchAgentHandlers,
  clientSide,
  params: () => [
    {
      agentSlug,
      include: 'details',
    },
  ],
  transform: result => ({
    data: result.handlers,
  }),
});

const filters = () => () => [
  {
    name: 'slug',
    label: 'Slug',
    type: 'text',
  },
  {
    name: 'definitionId',
    label: 'Handler Adapter',
    type: 'text',
  },
];

const columns = [
  {
    value: 'slug',
    title: 'Slug',
    sortable: true,
  },
  {
    value: 'definitionId',
    title: 'Handler Adapter',
    sortable: true,
  },
];

export const AgentHandlerTable = generateTable({
  tableOptions: ['agentSlug'],
  columns,
  filters,
  dataSource,
});

AgentHandlerTable.displayName = 'AgentHandlerTable';

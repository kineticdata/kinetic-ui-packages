import { generateTable } from '../../table/Table';
import { fetchSecurityPolicyDefinitions } from '../../../apis';
import {
  KAPP_SECURITY_DEFINITION_TYPES,
  SPACE_SECURITY_DEFINITION_TYPES,
} from './SecurityDefinitionForm';
import { defineFilter } from '../../../helpers';

const clientSide = defineFilter(true)
  .startsWith('name', 'name')
  .equals('type', 'type')
  .end();

const dataSource = ({ kappSlug }) => ({
  fn: fetchSecurityPolicyDefinitions,
  clientSide,
  params: () => [
    {
      include: 'details',
      kappSlug,
    },
  ],
  transform: result => ({
    data: result.securityPolicyDefinitions,
  }),
});

const filters = ({ kappSlug }) => () => [
  { name: 'name', label: 'Name', type: 'text' },
  {
    name: 'type',
    label: 'Type',
    type: 'select',
    options: () =>
      kappSlug
        ? KAPP_SECURITY_DEFINITION_TYPES.map(el => ({
            value: el,
            label: el,
          }))
        : SPACE_SECURITY_DEFINITION_TYPES.map(el => ({
            value: el,
            label: el,
          })),
  },
];

const columns = [
  {
    value: 'message',
    title: 'Message',
    sortable: false,
  },
  {
    value: 'name',
    title: 'Name',
    sortable: true,
  },
  {
    value: 'rule',
    title: 'Rule',
    sortable: false,
  },
  {
    value: 'type',
    title: 'Type',
    sortable: true,
  },
];

export const SecurityDefinitionTable = generateTable({
  tableOptions: ['kappSlug'],
  columns,
  filters,
  dataSource,
});

SecurityDefinitionTable.displayName = 'SecurityDefinitionTable';

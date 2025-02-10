import { generateTable } from '../../table/Table';
import { fetchPolicyRules } from '../../../apis';
import { defineFilter } from '../../../helpers';

const clientSide = defineFilter(true)
  .startsWith('name', 'name')
  .startsWith('type', 'type')
  .end();

const dataSource = () => ({
  fn: fetchPolicyRules,
  clientSide,
  params: () => [{ include: 'details' }],
  transform: result => ({ data: result.policyRules }),
});

const filters = () => () => [{ name: 'name', label: 'Name', type: 'text' }];

const columns = [
  {
    value: 'name',
    title: 'Name',
    sortable: true,
  },
  {
    value: 'type',
    title: 'Type',
    sortable: true,
  },
  {
    value: 'rule',
    title: 'Rule',
    type: 'text',
  },
  {
    value: 'message',
    title: 'Message',
    type: 'text',
  },
  {
    value: 'id',
    title: 'ID',
    sortable: true,
  },
  {
    value: 'createdAt',
    title: 'Created At',
    sortable: true,
  },
  {
    value: 'createdBy',
    title: 'Created By',
    sortable: true,
  },
  {
    value: 'updatedAt',
    title: 'Updated At',
    sortable: true,
  },
  {
    value: 'updatedBy',
    title: 'Updated By',
    sortable: true,
  },
];

export const PolicyRuleTable = generateTable({
  columns,
  filters,
  dataSource,
});
PolicyRuleTable.propTypes = {};
PolicyRuleTable.displayName = 'PolicyRuleTable';

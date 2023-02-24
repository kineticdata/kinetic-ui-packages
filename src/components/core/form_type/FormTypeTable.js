import { generateTable } from '../../table/Table';
import { fetchFormTypes } from '../../../apis';
import { defineFilter } from '../../../helpers';

const clientSide = defineFilter(true)
  .startsWith('name', 'name')
  .end();

const dataSource = ({ kappSlug }) => ({
  fn: fetchFormTypes,
  clientSide,
  params: () => [{ kappSlug }],
  transform: result => ({
    data: result.formTypes,
  }),
});

const filters = () => () => [
  { name: 'name', label: 'Form Type', type: 'text' },
];

const columns = [
  {
    value: 'name',
    title: 'Form Type',
    sortable: false,
  },
];

export const FormTypeTable = generateTable({
  tableOptions: ['kappSlug'],
  columns,
  filters,
  dataSource,
});

FormTypeTable.displayName = 'FormTypeTable';
FormTypeTable.defaultProps = {
  columns,
};

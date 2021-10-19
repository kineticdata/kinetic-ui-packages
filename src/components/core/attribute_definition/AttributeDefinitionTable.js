import t from 'prop-types';
import { generateTable } from '../../table/Table';
import { fetchAttributeDefinitions } from '../../../apis';
import { defineFilter } from '../../../helpers';

const clientSide = defineFilter(true)
  .startsWith('name', 'name')
  .end();

const dataSource = ({ kappSlug, attributeType }) => ({
  fn: fetchAttributeDefinitions,
  clientSide,
  params: () => [
    {
      include: 'details',
      kappSlug,
      attributeType: attributeType + 'AttributeDefinitions',
    },
  ],
  transform: result => {
    return {
      data: result.attributeDefinitions,
    };
  },
});

const filters = () => () => [{ name: 'name', label: 'Name', type: 'text' }];

const columns = [
  {
    value: 'name',
    title: 'Name',
    sortable: false,
  },
  {
    value: 'description',
    title: 'Description',
    sortable: false,
  },
  {
    value: 'allowsMultiple',
    title: 'Allows Multiple',
    sortable: false,
  },
];

export const AttributeDefinitionTable = generateTable({
  tableOptions: ['kappSlug', 'attributeType'],
  columns,
  filters,
  dataSource,
});
AttributeDefinitionTable.displayName = 'AttributeDefinitionTable';
AttributeDefinitionTable.propTypes = {
  /** The Slug of the kapp required if the type of attribute is scoped to a kapp (ie, category * kapp attributes) */
  kappSlug: t.string,
  /** The type of attribute definition to display.   */
  attributeType: t.oneOf([
    'space',
    'team',
    'user',
    'userProfile',
    'category',
    'kapp',
    'form',
  ]).isRequired,
  /** The columns that should be displayed.   */
  columnSet: t.arrayOf(t.string),
};

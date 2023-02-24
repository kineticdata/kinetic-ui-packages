import { generateTable } from '../../table/Table';
import { fetchBridgeModel } from '../../../apis';
import { defineFilter } from '../../../helpers';

const clientSide = defineFilter(true)
  .startsWith('name', 'name')
  .end();

// Handles bridge model api response by checking for error and also returning
// error if active mapping is not present. If valid returns object with the
// attributes and their mappings.
const handleBridgeModel = ({
  bridgeModel: { error, attributes, activeMappingName, mappings },
}) => {
  if (error) {
    return { error };
  }
  const mapping = mappings.find(({ name }) => name === activeMappingName);
  if (!mapping) {
    return { error: 'Invalid bridge model, active mapping not found' };
  }
  return { attributes, attributeMappings: mapping.attributes };
};

const transform = ({ attributes, attributeMappings }) => ({
  data: attributes.map(attribute => {
    const mapping = attributeMappings.find(
      ({ name }) => name === attribute.name,
    );
    return {
      ...attribute,
      structureField: mapping ? mapping.structureField || '' : null,
    };
  }),
});

const dataSource = ({ modelName }) => ({
  fn: () => fetchBridgeModel({ modelName }).then(handleBridgeModel),
  clientSide,
  params: () => [{ modelName }],
  transform,
});

// const filters = () => () => [{ name: 'name', label: 'Name', type: 'text' }];

const columns = [
  {
    value: 'name',
    title: 'Name',
    sortable: true,
  },
  {
    value: 'structureField',
    title: 'Mapping',
    type: 'text',
  },
];

export const BridgeModelAttributeTable = generateTable({
  columns,
  // filters,
  dataSource,
  tableOptions: ['modelName'],
});

BridgeModelAttributeTable.displayName = 'BridgeModelAttributeTable';

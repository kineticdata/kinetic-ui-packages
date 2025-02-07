import { generateTable } from '../../table/Table';
import { fetchBridgeModel } from '../../../apis';
import { defineFilter } from '../../../helpers';

const clientSide = defineFilter(true)
  .startsWith('name', 'name')
  .equals('resultType', 'resultType')
  .end();

// Handles bridge model api response by checking for error and also returning
// error if active mapping is not present. If valid returns object with the
// attributes and their mappings.
const handleBridgeModel = ({
  bridgeModel: { error, qualifications, activeMappingName, mappings },
}) => {
  if (error) {
    return { error };
  }
  const mapping = mappings.find(({ name }) => name === activeMappingName);
  if (!mapping) {
    return { error: 'Invalid bridge model, active mapping not found' };
  }
  return { qualifications, qualificationMappings: mapping.qualifications };
};

const transform = ({ qualifications, qualificationMappings }) => ({
  data: qualifications.map(qualification => {
    const mapping = qualificationMappings.find(
      ({ name }) => name === qualification.name,
    );
    return {
      ...qualification,
      query: mapping ? mapping.query || '' : null,
    };
  }),
});

const dataSource = ({ modelName }) => ({
  fn: () => fetchBridgeModel({ modelName }).then(handleBridgeModel),
  clientSide,
  params: () => [{ modelName }],
  transform,
});

const columns = [
  {
    value: 'name',
    title: 'Name',
    sortable: true,
  },
  {
    value: 'resultType',
    title: 'Result Type',
    sortable: true,
  },
  {
    value: 'query',
    title: 'Query',
  },
];

export const BridgeModelQualificationTable = generateTable({
  columns,
  dataSource,
  tableOptions: ['modelName'],
});

BridgeModelQualificationTable.displayName = 'BridgeModelQualificationTable';

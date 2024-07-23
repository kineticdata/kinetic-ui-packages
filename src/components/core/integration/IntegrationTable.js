import { generateTable } from '../../table/Table';
import {
  fetchBulkOperations,
  fetchConnections,
  fetchIntegrations,
} from '../../../apis';
import {
  generatePaginationParams,
  generateSortParams,
} from '../../../apis/http';

const fetchIntegrationsWithSupportingData = options =>
  fetchIntegrations(options).then(({ integrations, ...response }) => {
    // Get ids of all operations in the table
    const ids = integrations?.map(integration => integration.operationId);
    // Fetch supporting integrator data for the table
    return Promise.all([
      // Get all connections if there are any integrations
      integrations?.length > 0
        ? fetchConnections()
        : Promise.resolve({ connections: [] }),
      // Get the operations that are used in the integrations
      ids?.length > 0
        ? fetchBulkOperations({ ids })
        : Promise.resolve({ operations: [] }),
    ]).then(([{ connections }, { operations }]) => {
      return {
        ...response,
        integrations: integrations.map(integration => ({
          ...integration,
          // Add the connection and operation names to the records
          connectionName: connections?.find(
            conn => conn.id === integration.connectionId,
          )?.name,
          operationName: operations?.find(
            op => op.id === integration.operationId,
          )?.name,
        })),
      };
    });
  });

const dataSource = ({ kappSlug }) => ({
  fn: fetchIntegrationsWithSupportingData,
  params: paramData => [
    {
      include: 'details',
      kappSlug,
      ...generateSortParams(paramData),
      ...generatePaginationParams(paramData),
    },
  ],
  transform: result => ({
    data: result.integrations,
    nextPageToken: result.nextPageToken,
  }),
});

const filters = () => () => [{ name: 'name', label: 'Name', type: 'text' }];

const columns = [
  {
    value: 'name',
    title: 'Name',
    sortable: true,
    toggleable: false,
    columnOrder: 'first',
  },
  {
    value: 'connectionId',
    title: 'Connection ID',
    sortable: false,
    toggleable: true,
  },
  {
    value: 'connectionName',
    title: 'Connection',
    sortable: false,
    toggleable: true,
  },
  {
    value: 'operationId',
    title: 'Operation ID',
    sortable: false,
    toggleable: true,
  },
  {
    value: 'operationName',
    title: 'Operation',
    sortable: false,
    toggleable: true,
  },
  {
    value: 'createdAt',
    title: 'Created At',
    sortable: true,
    toggleable: true,
  },
  {
    value: 'createdBy',
    title: 'Created By',
    sortable: true,
    toggleable: true,
  },
  {
    value: 'updatedAt',
    title: 'Updated At',
    sortable: true,
    toggleable: true,
  },
  {
    value: 'updatedBy',
    title: 'Updated By',
    sortable: true,
    toggleable: true,
  },
];

export const IntegrationTable = generateTable({
  tableOptions: ['kappSlug'],
  columns,
  filters,
  dataSource,
});

IntegrationTable.displayName = 'IntegrationTable';

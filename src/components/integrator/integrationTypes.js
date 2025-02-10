import { getIn } from 'immutable';

export const integrationTypes = [
  { label: 'HTTP', value: 'http' },
  { label: 'PostgreSQL', value: 'postgres' },
  // { label: 'SMTP', value: 'smtp' },
];

// Helper function for getting the label for a given type value
integrationTypes.getLabel = value =>
  integrationTypes.find(t => t.value === value)?.label || value;

export default integrationTypes;

export const getConnectionMetadata = connection => {
  const type = getIn(connection, ['config', 'configType']);

  switch (type) {
    case 'http':
      return {
        // Details content to render for each option in a list of connections
        optionDetail: getIn(connection, ['config', 'baseUrl']),
        // Documentation link
        docsLink: getIn(connection, ['documentationLink']),
        // Properties to list in page/modal headings
        headingData: [
          {
            label: 'Base URL',
            value: getIn(connection, ['config', 'baseUrl']),
          },
          {
            label: 'Auth',
            value:
              {
                basic: 'Basic',
                client_credentials: 'Client Credentials',
                http_bearer_token: 'HTTP Bearer Token',
                raw_bearer_token: 'Raw Bearer Token',
              }[getIn(connection, ['config', 'auth', 'authType'])] || 'None',
          },
        ].filter(o => o.value),
        // Table columns for the operations table of this type of connection.
        // Objects define columns to add, and strings define default columns to
        // show. The order of the items is defines the order of the columns.
        operationColumns: [
          {
            value: 'method',
            title: 'Method',
            components: { BodyCell: HTTPMethodCell },
            toggleable: true,
          },
          'name',
          'updatedAt',
          'actions',
        ],
      };
    case 'postgres':
    default:
      return {
        headingData: [],
        operationColumns: ['name', 'updatedAt', 'actions'],
      };
  }
};

export const getOperationMetadata = operation => {
  const type = getIn(operation, ['config', 'configType']);

  switch (type) {
    case 'http':
      return {
        // Details content to render for each option in a list of operations
        optionDetail: getIn(operation, ['config', 'method']),
        // Documentation link
        docsLink: getIn(operation, ['documentationLink']),
        // Properties to list in page/modal headings
        headingData: [
          {
            label: 'Request Path',
            value: getIn(operation, ['config', 'path']),
          },
          {
            label: 'Method',
            value: getIn(operation, ['config', 'method']),
          },
        ].filter(o => o.value),
      };
    case 'postgres':
    default:
      return { headingData: [] };
  }
};

const HTTPMethodCell = ({ row }) => (
  <td>
    <span className="badge badge-info">{row.getIn(['config', 'method'])}</span>
  </td>
);

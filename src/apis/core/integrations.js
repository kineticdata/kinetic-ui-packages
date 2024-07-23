import { apiGroup } from '../http';

export const {
  fetchIntegrations,
  fetchIntegration,
  createIntegration,
  updateIntegration,
  deleteIntegration,
} = apiGroup({
  name: 'Integration',
  dataOption: 'integration',
  plural: {
    requiredOptions: ['kappSlug'],
    url: ({ kappSlug }) => `/kapps/${kappSlug}/integrations`,
    transform: response => response.data,
  },
  singular: {
    requiredOptions: ['kappSlug', 'name'],
    url: ({ name, kappSlug }) => `/kapps/${kappSlug}/integrations/${name}`,
    transform: response => ({
      integration: response.data.integration,
    }),
  },
});

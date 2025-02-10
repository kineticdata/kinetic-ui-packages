import {
  apiGroup,
  handleErrors,
  headerBuilder,
  paramBuilder,
  validateOptions,
} from '../http';
import axios from 'axios';
import { bundle } from '../../helpers';

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

export const executeIntegration = (options = {}) => {
  validateOptions('executeOperation', ['kappSlug', 'integrationName'], options);
  const { kappSlug, formSlug, integrationName, parameters = {} } = options;
  const params = { ...paramBuilder(options) };

  return axios
    .post(
      `${bundle.apiLocation()}/integrations/kapps/${kappSlug}${
        formSlug ? `/forms/${formSlug}` : ''
      }/${integrationName}`,
      parameters,
      { params, headers: headerBuilder(options) },
    )
    .then(response => ({ data: response.data }))
    .catch(handleErrors);
};

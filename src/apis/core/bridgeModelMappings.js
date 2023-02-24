import { apiGroup } from '../http';

export const {
  fetchBridgeModelMappings,
  fetchBridgeModelMapping,
  createBridgeModelMapping,
  updateBridgeModelMapping,
  deleteBridgeModelMapping,
} = apiGroup({
  name: 'BridgeModelMapping',
  dataOption: 'bridgeModelMapping',
  plural: {
    requiredOptions: ['modelName'],
    url: ({ modelName }) => `/models/${modelName}/mappings`,

    transform: response => ({
      bridgeModelMappings: response.data.mappings,
    }),
  },
  singular: {
    requiredOptions: ['modelName', 'mappingName'],
    url: ({ modelName, mappingName }) =>
      `/models/${encodeURIComponent(modelName)}/mappings/${encodeURIComponent(
        mappingName,
      )}`,
    transform: response => ({
      bridgeModelMapping: response.data.mapping,
    }),
  },
});

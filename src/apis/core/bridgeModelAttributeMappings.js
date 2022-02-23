import { apiGroup } from '../http';

export const {
  fetchBridgeModelAttributeMappings,
  fetchBridgeModelAttributeMapping,
  createBridgeModelAttributeMapping,
  updateBridgeModelAttributeMapping,
  deleteBridgeModelAttributeMapping,
} = apiGroup({
  name: 'BridgeModelAttributeMapping',
  dataOption: 'bridgeModelAttributeMapping',
  plural: {
    requiredOptions: ['modelName', 'mappingName'],
    url: ({ modelName, mappingName }) =>
      `/models/${modelName}/mappings/${mappingName}/attributes`,
    transform: response => ({
      bridgeModelAttributeMappings: response.data.attributes,
    }),
  },
  singular: {
    requiredOptions: ['modelName', 'mappingName', 'attributeName'],
    url: ({ modelName, mappingName, attributeName }) =>
      `/models/${modelName}/mappings/${mappingName}/attributes/${encodeURIComponent(
        attributeName,
      )}`,
    transform: response => ({
      bridgeModelAttributeMapping: response.data.attribute,
    }),
  },
});

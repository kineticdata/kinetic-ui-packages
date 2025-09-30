import { apiGroup } from '../http';

export const {
  fetchFileResources,
  fetchFileResource,
  createFileResource,
  updateFileResource,
  deleteFileResource,
} = apiGroup({
  name: 'FileResource',
  dataOption: 'fileResource',
  plural: {
    requiredOptions: [],
    url: () => '/fileResources',
    transform: response => response.data,
  },
  singular: {
    requiredOptions: ['fileResourceSlug'],
    url: ({ fileResourceSlug }) => `/fileResources/${fileResourceSlug}`,
    transform: response => response.data,
  },
});

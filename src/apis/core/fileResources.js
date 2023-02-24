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
    transform: response => ({ fileResources: response.data.fileResources }),
  },
  singular: {
    requiredOptions: ['fileResourceSlug'],
    url: ({ fileResourceSlug }) => `/fileResources/${fileResourceSlug}`,
    transform: response => ({ fileResource: response.data.fileResource }),
  },
});

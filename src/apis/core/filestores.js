import { apiGroup } from '../http';

export const {
  fetchFilestores,
  fetchFilestore,
  createFilestore,
  updateFilestore,
  deleteFilestore,
} = apiGroup({
  name: 'Filestore',
  dataOption: 'filestore',
  plural: {
    requiredOptions: [],
    url: ({ agentSlug = 'system' }) =>
      `/app/components/agents/${agentSlug}/app/api/v1/filestores`,
    transform: response => ({ filestores: response.data.filestores }),
  },
  singular: {
    requiredOptions: ['filestoreSlug'],
    url: ({ agentSlug = 'system', filestoreSlug }) =>
      `/app/components/agents/${agentSlug}/app/api/v1/filestores/${filestoreSlug}`,
    transform: response => ({ filestore: response.data.filestore }),
  },
});

import { apiGroup } from '../http';

export const {
  fetchWebApis,
  fetchWebApi,
  createWebApi,
  updateWebApi,
  deleteWebApi,
} = apiGroup({
  name: 'WebApi',
  dataOption: 'webApi',
  plural: {
    requiredOptions: [],
    url: ({ kappSlug }) =>
      kappSlug ? `/kapps/${kappSlug}/webApis` : `/webApis`,
    transform: response => ({
      webApis: response.data.webApis,
    }),
  },
  singular: {
    requiredOptions: ['slug'],
    url: ({ slug, kappSlug }) =>
      kappSlug ? `/kapps/${kappSlug}/webApis/${slug}` : `/webApis/${slug}`,
    transform: response => ({
      webApi: response.data.webApi,
    }),
  },
});

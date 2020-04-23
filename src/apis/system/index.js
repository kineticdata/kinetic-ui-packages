import axios from 'axios';
import { handleErrors, headerBuilder, paramBuilder } from '../http';
import { bundle } from '../../helpers';

export const fetchTenants = (options = {}) => {
  // Build URL and fetch the space.
  return axios
    .get('/app/system-coordinator/api/v1/tenants', {
      __bypassInitInterceptor: true,
      params: paramBuilder(options),
      headers: headerBuilder(options),
    })
    .then(response => ({ space: response.data.space }))
    .catch(handleErrors);
};

export const fetchTenant = (options = {}) => {
  const { spaceSlug } = options;
  if (!spaceSlug) {
    throw new Error('fetchTenant failed! The option "spaceSlug" is required.');
  }
  // Build URL and fetch the space.
  return axios
    .get(`/app/system-coordinator/api/v1/tenants/${spaceSlug}`, {
      __bypassInitInterceptor: true,
      params: paramBuilder(options),
      headers: headerBuilder(options),
    })
    .then(response => ({ space: response.data.space }))
    .catch(handleErrors);
};

export const updateTenant = (options = {}) => {
  const { slug, tenant } = options;
  if (!tenant) {
    throw new Error('updateTenant failed! The option "tenant" is required.');
  }
  if (!slug) {
    throw new Error('updateTenant failed! The option "slug" is required.');
  }

  return axios
    .put(`/app/system-coordinator/api/v1/tenants/${slug}`, tenant, {
      __bypassInitInterceptor: true,
      params: paramBuilder(options),
      headers: headerBuilder(options),
    })
    .then(response => ({ tenant: response.data.tenant }))
    .catch(handleErrors);
};

export const createTenant = (options = {}) => {
  const { tenant } = options;
  if (!tenant) {
    throw new Error('createTenant failed! The option "tenant" is required.');
  }

  return axios
    .post('/app/system-coordinator/api/v1/tenants', tenant, {
      __bypassInitInterceptor: true,
      params: paramBuilder(options),
      headers: headerBuilder(options),
    })
    .then(response => ({ tenant: response.data.tenant }))
    .catch(handleErrors);
};

export const fetchSystem = (options = {}) => {
  const { spaceSlug } = options;
  if (!spaceSlug) {
    throw new Error('fetchTenant failed! The option "spaceSlug" is required.');
  }
  // Build URL and fetch the space.
  return axios
    .get(`/app/system-coordinator/api/v1/tenants/${spaceSlug}`, {
      params: paramBuilder(options),
      headers: headerBuilder(options),
    })
    .then(response => ({ space: response.data.space }))
    .catch(handleErrors);
};

export const fetchTaskDbAdapters = (options = {}) => {
  // Build URL and fetch the space.
  return (
    axios
      .get(`/app/system-coordinator/api/v1/meta/task-db-adapters`, {
        __bypassInitInterceptor: true,
        params: paramBuilder(options),
        headers: headerBuilder(options),
      })
      .then(response => response.data)
      // .then(response => ({ space: response.data.space }))
      .catch(handleErrors)
  );
};

export const fetchTaskDbAdapter = (options = {}) => {
  // Build URL and fetch the space.
  return axios
    .get(
      `/app/system-coordinator/api/v1/meta/task-db-adapters/${options.type}`,
      {
        __bypassInitInterceptor: true,
        params: paramBuilder(options),
        headers: headerBuilder(options),
      },
    )
    .then(response => ({ adapter: response.data.adapter }))
    .catch(handleErrors);
};

export const fetchSystemDefaultTaskDbAdapter = (options = {}) => {
  // Build URL and fetch the space.
  return axios
    .get(`/app/system-coordinator/api/v1/platform/default-task-db-adapter`, {
      __bypassInitInterceptor: true,
      params: paramBuilder(options),
      headers: headerBuilder(options),
    })
    .then(response => ({ adapter: response.data.adapter }))
    .catch(handleErrors);
};

export const updateSystemDefaultTaskDbAdapter = (options = {}) => {
  const { adapter } = options;
  if (!adapter) {
    throw new Error(
      'updateSystemDefaultTaskDbAdapter failed! The option "adapter" is required.',
    );
  }

  return axios
    .put(
      `/app/system-coordinator/api/v1/platform/default-task-db-adapter`,
      adapter,
      {
        __bypassInitInterceptor: true,
        params: paramBuilder(options),
        headers: headerBuilder(options),
      },
    )
    .then(response => ({ adapter: response.data.adapter }))
    .catch(handleErrors);
};

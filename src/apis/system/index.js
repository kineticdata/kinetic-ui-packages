import axios from 'axios';
import { handleErrors, headerBuilder, paramBuilder } from '../http';

export const fetchTenants = (options = {}) => {
  // Build URL and fetch the space.
  return axios
    .get('/app/system-coordinator/api/v1/tenants', {
      params: paramBuilder(options),
      headers: headerBuilder(options),
    })
    .then(response => ({
      tenants: response.data.tenants,
      nextPageToken: response.data.nextPageToken,
    }))
    .catch(handleErrors);
};

export const fetchTenant = (options = {}) => {
  const { slug } = options;
  if (!slug) {
    throw new Error('fetchTenant failed! The option "slug" is required.');
  }
  // Build URL and fetch the space.
  return axios
    .get(`/app/system-coordinator/api/v1/tenants/${slug}`, {
      params: paramBuilder(options),
      headers: headerBuilder(options),
    })
    .then(response => ({ tenant: response.data.tenant }))
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
      params: paramBuilder(options),
      headers: headerBuilder(options),
    })
    .then(response => ({ tenant: response.data.tenant }))
    .catch(handleErrors);
};

export const deleteTenant = (options = {}) => {
  const { slug } = options;
  if (!slug) {
    throw new Error('createTenant failed! The option "slug" is required.');
  }

  return axios
    .delete(`/app/system-coordinator/api/v1/tenants/${slug}`, {
      params: {
        ...paramBuilder(options),
        deleteDatabase: options.deleteDatabase || undefined,
      },
      headers: headerBuilder(options),
    })
    .then(response => ({ tenant: response.data.tenant }))
    .catch(handleErrors);
};

export const fetchSystem = (options = {}) => {
  // Build URL and fetch the system config.
  return axios
    .get('/app/system-coordinator/components/core/app/api/v1/config', {
      params: paramBuilder(options),
      headers: headerBuilder(options),
    })
    .then(response => ({ system: response.data }))
    .catch(handleErrors);
};

export const updateSystem = (options = {}) => {
  const { system } = options;
  if (!system) {
    throw new Error('updateSystem failed! The option "system" is required.');
  }
  // Build URL and fetch the system config.
  return axios
    .put('/app/system-coordinator/components/core/app/api/v1/config', system, {
      params: paramBuilder(options),
      headers: headerBuilder(options),
    })
    .then(response => ({ system: response.data }))
    .catch(handleErrors);
};

export const fetchSystemUser = (options = {}) => {
  // Build URL and fetch the space.
  return axios
    .get('/app/system-coordinator/api/v1/platform/system-user', {
      params: paramBuilder(options),
      headers: headerBuilder(options),
    })
    .then(response => ({ user: response.data }))
    .catch(handleErrors);
};

export const updateSystemUser = (options = {}) => {
  const { user } = options;
  if (!user) {
    throw new Error('updateSystemUser failed! The option "user" is required.');
  }

  return axios
    .put('/app/system-coordinator/api/v1/platform/system-user', user, {
      params: paramBuilder(options),
      headers: headerBuilder(options),
    })
    .then(response => ({ user: response.data }))
    .catch(handleErrors);
};

export const fetchSystemIngress = (options = {}) => {
  // Build URL and fetch the space.
  return axios
    .get('/app/system-coordinator/api/v1/platform/ingress', {
      params: paramBuilder(options),
      headers: headerBuilder(options),
    })
    .then(response => ({ ingress: response.data }))
    .catch(handleErrors);
};

export const fetchTaskDbAdapters = (options = {}) => {
  // Build URL and fetch the space.
  return (
    axios
      .get(`/app/system-coordinator/api/v1/meta/task-db-adapters`, {
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
        params: paramBuilder(options),
        headers: headerBuilder(options),
      },
    )
    .then(response => ({ adapter: response.data.adapter }))
    .catch(handleErrors);
};

export const fetchSystemDefaultSmtpAdapter = (options = {}) => {
  // Build URL and fetch the space.
  return axios
    .get('/app/system-coordinator/api/v1/platform/default-smtp-adapter', {
      params: paramBuilder(options),
      headers: headerBuilder(options),
    })
    .then(response => ({ adapter: response.data.adapter }))
    .catch(handleErrors);
};

export const updateSystemDefaultSmtpAdapter = (options = {}) => {
  const { adapter } = options;
  if (!adapter) {
    throw new Error(
      'updateSystemDefaultSmtpAdapter failed! The option "adapter" is required.',
    );
  }

  return axios
    .put(
      '/app/system-coordinator/api/v1/platform/default-smtp-adapter',
      adapter,
      {
        params: paramBuilder(options),
        headers: headerBuilder(options),
      },
    )
    .then(response => ({ adapter: response.data.adapter }))
    .catch(handleErrors);
};

export const fetchSystemFilestore = (options = {}) => {
  // Build URL and fetch the space.
  return axios
    .get(
      '/app/system-coordinator/components/agent/app/api/v1/spaces/SYSTEM/filestores/system',
      {
        params: paramBuilder(options),
        headers: headerBuilder(options),
      },
    )
    .then(response => response.data)
    .catch(handleErrors);
};

export const updateSystemFilestore = (options = {}) => {
  const { filestore } = options;
  if (!filestore) {
    throw new Error(
      'updateSystemFilestore failed! The option "adapter" is required.',
    );
  }

  return axios
    .put(
      '/app/system-coordinator/components/agent/app/api/v1/spaces/SYSTEM/filestores/system',
      filestore,
      {
        params: paramBuilder(options),
        headers: headerBuilder(options),
      },
    )
    .then(response => ({ filestore: response.data.filestore }))
    .catch(handleErrors);
};

const VALID_RESTARTABLE_COMPONENTS = [
  'agent',
  'core',
  'discussions',
  'loghub',
  'topics',
  'indexer',
];
export const postPlatformComponentRestart = (options = {}) => {
  if (
    !options.component ||
    !VALID_RESTARTABLE_COMPONENTS.includes(options.component)
  ) {
    throw new Error(
      'postPlatformComponentRestart failed! The "component" option was missing or invalid.',
    );
  }

  return axios
    .post(
      `/app/system-coordinator/api/v1/platform/components/${
        options.component
      }/restart`,
    )
    .then(({ data }) => ({ component: data.component, message: data.message }))
    .catch(handleErrors);
};

export const fetchPlatformComponentStatus = (options = {}) =>
  axios
    .get('/app/system-coordinator/api/v1/platform/components')
    .then(({ data }) => ({ components: data.components }))
    .catch(handleErrors);

export const systemLogin = (options = {}) => {
  const { username, password } = options;

  return axios
    .post('/app/system-coordinator/login', { username, password }, {})
    .then(response => response.data)
    .catch(handleErrors);
};

export const refreshSystemToken = (options = {}) => {
  return axios
    .post(
      '/app/system-coordinator/refresh',
      {},
      {
        params: paramBuilder(options),
        headers: headerBuilder(options),
      },
    )
    .then(response => response.data)
    .catch(handleErrors);
};

export const fetchCassandraConfig = (options = {}) => {
  return axios
    .get(
      '/app/system-coordinator/api/v1/platform/cassandra',
      {},
      {
        params: paramBuilder(options),
        headers: headerBuilder(options),
      },
    )
    .then(response => ({ adapter: response.data.adapter }))
    .catch(handleErrors);
};

export const fetchElasticSearchConfig = (options = {}) => {
  return axios
    .get(
      '/app/system-coordinator/api/v1/platform/elasticsearch',
      {},
      {
        params: paramBuilder(options),
        headers: headerBuilder(options),
      },
    )
    .then(response => ({ adapter: response.data.adapter }))
    .catch(handleErrors);
};

export const fetchSystemSecurity = (options = {}) => {
  return axios
    .get(
      '/app/system-coordinator/api/v1/platform/system-security',
      {},
      {
        params: paramBuilder(options),
        headers: headerBuilder(options),
      },
    )
    .then(response => ({ systemSecurity: response.data }))
    .catch(handleErrors);
};

export const updateSystemSecurity = (options = {}) => {
  const { systemSecurity } = options;
  if (!systemSecurity) {
    throw new Error(
      'updateSystemSecurity failed! The option "systemSecurity" is required.',
    );
  }

  return axios
    .put(
      `/app/system-coordinator/api/v1/platform/system-security`,
      systemSecurity,
      { params: paramBuilder(options), headers: headerBuilder(options) },
    )
    .then(response => ({ systemSecurity: response.data }))
    .catch(handleErrors);
};

export const fetchSystemLicense = (options = {}) => {
  return axios
    .get('/app/system-coordinator/components/core/app/api/v1/license', {
      params: paramBuilder(options),
      headers: headerBuilder(options),
    })
    .then(response => ({ system: response.data }))
    .catch(handleErrors);
};

export const deleteSystemLicense = (options = {}) => {
  return axios
    .delete('/app/system-coordinator/components/core/app/api/v1/license', {
      params: paramBuilder(options),
      headers: headerBuilder(options),
    })
    .then(response => ({ system: response.data }))
    .catch(handleErrors);
};

export const resetSystemLicense = (options = {}) => {
  return axios
    .put('/app/system-coordinator/components/core/app/api/v1/license/reset', {
      params: paramBuilder(options),
      headers: headerBuilder(options),
    })
    .then(response => ({ system: response.data }))
    .catch(handleErrors);
};

export const importSystemLicense = (options = {}) => {
  const { content } = options;

  const data = new FormData();
  data.set('content', content);
  const headers = { 'Content-Type': 'multipart/form-data' };

  return axios
    .post('/app/system-coordinator/components/core/app/api/v1/license', data, {
      headers,
    })
    .then(response => ({ system: response.data }))
    .catch(handleErrors);
};

export const fetchSystemLicenseStats = (options = {}) => {
  return axios
    .get(
      '/app/system-coordinator/components/core/app/api/v1/license/statistics',
      {
        params: paramBuilder(options),
        headers: headerBuilder(options),
      },
    )
    .then(response => ({ system: response.data }))
    .catch(handleErrors);
};

export const fetchSystemLicenseCheck = (options = {}) => {
  return axios
    .get('/app/system-coordinator/components/core/app/api/v1/license/check', {
      params: paramBuilder(options),
      headers: headerBuilder(options),
    })
    .then(response => ({ system: response.data }))
    .catch(handleErrors);
};

export const fetchSystemBackgroundTasks = (options = {}) => {
  return axios
    .get('/app/system-coordinator/api/v1/backgroundTasks', {
      params: paramBuilder(options),
      headers: headerBuilder(options),
    })
    .then(response => ({ backgroundTasks: response.data.backgroundTasks }))
    .catch(handleErrors);
};

export const fetchSystemBackgroundTask = (options = {}) => {
  const { id } = options;
  if (!id) {
    throw new Error(
      'fetchSystemBackgroundTask failed! The option "id" is required.',
    );
  }
  return axios
    .get(`/app/system-coordinator/api/v1/backgroundTasks/${id}`, {
      params: paramBuilder(options),
      headers: headerBuilder(options),
    })
    .then(response => ({ backgroundTask: response.data.backgroundTask }))
    .catch(handleErrors);
};

export const deleteSystemBackgroundTask = (options = {}) => {
  const { id } = options;
  if (!id) {
    throw new Error(
      'deleteSystemBackgroundTask failed! The option "id" is required.',
    );
  }
  return axios
    .delete(`/app/system-coordinator/api/v1/backgroundTasks/${id}`, {
      params: paramBuilder(options),
      headers: headerBuilder(options),
    })
    .then(response => ({ backgroundTask: response.data.backgroundTask }))
    .catch(handleErrors);
};

export const rotateEncryptionKey = (options = {}) => {
  const { spaceSlug } = options;
  return axios
    .post(
      spaceSlug
        ? `/app/system-coordinator/api/v1/tenants/${spaceSlug}/rotateEncryptionKey`
        : '/app/system-coordinator/api/v1/platform/rotateEncryptionKey',
      {},
      {
        params: paramBuilder(options),
        headers: headerBuilder(options),
      },
    )
    .then(response => ({ system: response.data }))
    .catch(handleErrors);
};

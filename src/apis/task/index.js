import axios from 'axios';
import { handleErrors, validateOptions } from '../http';
import { bundle } from '../../helpers';

export const buildTreeId = options =>
  options.definitionId
    ? options.definitionId
    : options.sourceName && options.sourceGroup
    ? `${options.sourceName} :: ${options.sourceGroup} :: ${options.name}`
    : options.name;

const generateNextPageToken = data =>
  data.offset >= 0 && data.limit && data.count
    ? data.offset + data.limit > data.count
      ? null
      : data.limit + data.offset
    : null;

export const fetchTrees = (options = {}) =>
  axios
    .get(`${bundle.spaceLocation()}/app/components/task/app/api/v2/trees`, {
      params: {
        type: options.type,
        limit: options.limit,
        include: options.include,
        offset: options.offset,
        source: options.source || undefined,
        group: options.group || undefined,
        groupFragment: options.groupFragment || undefined,
        name: options.name || undefined,
        nameFragment: options.nameFragment || undefined,
        ownerEmail: options.ownerEmail || undefined,
        status: options.status || undefined,
        orderBy: options.orderBy,
        direction: options.direction,
      },
    })
    .then(response => ({
      trees: response.data.trees,
      nextPageToken: generateNextPageToken(response.data),
    }))
    .catch(handleErrors);

export const fetchTree = (options = {}) => {
  validateOptions('fetchTree', ['name'], options);
  const id = buildTreeId(options);

  return axios
    .get(
      `${bundle.spaceLocation()}/app/components/task/app/api/v2/trees/${id}`,
      {
        params: {
          include: options.include,
        },
      },
    )
    .then(response => ({
      tree: response.data,
    }))
    .catch(handleErrors);
};

export const updateTree = (options = {}) => {
  validateOptions('updateTree', ['name', 'tree'], options);
  const id = buildTreeId(options);

  return axios
    .put(
      `${bundle.spaceLocation()}/app/components/task/app/api/v2/trees/${id}`,
      options.tree,
      {
        params: {
          include: options.include,
        },
      },
    )
    .then(response => ({
      tree: response.data.tree,
    }))
    .catch(handleErrors);
};

export const createTree = (options = {}) => {
  validateOptions('createTree', ['tree'], options);
  return axios
    .post(
      `${bundle.spaceLocation()}/app/components/task/app/api/v2/trees`,
      options.tree,
      {
        params: {
          include: options.include,
        },
      },
    )
    .then(response => response.data)
    .catch(handleErrors);
};

export const deleteTree = (options = {}) => {
  validateOptions('deleteTree', ['name'], options);
  const id = buildTreeId(options);

  return axios
    .delete(
      `${bundle.spaceLocation()}/app/components/task/app/api/v2/trees/${id}`,
    )
    .then(response => ({
      tree: response.data,
    }))
    .catch(handleErrors);
};

export const cloneTree = (options = {}) => {
  validateOptions('cloneTree', ['newName', 'name'], options);
  const id = buildTreeId(options);

  return axios
    .post(
      `${bundle.spaceLocation()}/app/components/task/app/api/v2/trees/${id}/clone`,
      {
        name: options.newName,
        sourceName: options.newSourceName,
        sourceGroup: options.newSourceGroup,
        definitionId: options.newDefinitionId,
      },
    )
    .then(response => ({
      tree: response.data.tree,
    }))
    .catch(handleErrors);
};

export const exportTree = (options = {}) => {
  validateOptions('exportTree', ['name'], options);
  const id = buildTreeId(options);

  return axios
    .get(
      `${bundle.spaceLocation()}/app/components/task/app/api/v2/trees/${id}/export`,
    )
    .then(response => ({
      tree: response.data,
    }))
    .catch(handleErrors);
};

export const importTree = (options = {}) => {
  const { content, contentUrl, force } = options;

  let data = {};
  let headers = {};

  if (contentUrl) {
    data = { contentUrl };
  } else {
    data = new FormData();
    data.set('content', content);
    headers = { 'Content-Type': 'multipart/form-data' };
  }

  return axios
    .post(
      `${bundle.spaceLocation()}/app/components/task/app/api/v2/trees`,
      data,
      {
        headers,
        params: {
          force,
        },
      },
    )
    .then(response => ({ tree: response.data }))
    .catch(handleErrors);
};

export const fetchTreeCounts = (options = {}) => {
  const id = buildTreeId(options);
  return axios
    .get(
      `${bundle.spaceLocation()}/app/components/task/app/api/v2/trees/${id}/counts`,
    )
    .then(response => ({ counts: response.data }))
    .catch(handleErrors);
};

export const fetchSources = (options = {}) =>
  axios
    .get(`${bundle.spaceLocation()}/app/components/task/app/api/v2/sources`, {
      params: {
        include: options.include,
      },
    })
    .then(response => ({
      sources: response.data.sourceRoots,
    }))
    .catch(handleErrors);

export const fetchSource = (options = {}) => {
  validateOptions('fetchSource', ['sourceName'], options);

  return axios
    .get(
      `${bundle.spaceLocation()}/app/components/task/app/api/v2/sources/${
        options.sourceName
      }`,
      {
        params: {
          include: options.include,
        },
      },
    )
    .then(response => ({
      source: response.data,
    }))
    .catch(handleErrors);
};

export const updateSource = (options = {}) => {
  validateOptions('updateSource', ['sourceName', 'source'], options);
  return axios
    .put(
      `${bundle.spaceLocation()}/app/components/task/app/api/v2/sources/${
        options.sourceName
      }`,
      options.source,
      {
        params: {
          include: options.include,
        },
      },
    )
    .then(response => ({
      source: response.data,
    }))
    .catch(handleErrors);
};

export const deleteSource = (options = {}) => {
  const { sourceName } = options;
  if (!sourceName) {
    throw new Error(
      'deleteSource failed! The option "sourceName" is required.',
    );
  }
  return axios
    .delete(
      `${bundle.spaceLocation()}/app/components/task/app/api/v2/sources/${sourceName}`,
    )
    .then(response => ({
      source: response.data,
    }))
    .catch(handleErrors);
};

export const createSource = (options = {}) => {
  validateOptions('createSource', ['source'], options);
  return axios
    .post(
      `${bundle.spaceLocation()}/app/components/task/app/api/v2/sources`,
      options.source,
      {
        params: {
          include: options.include,
        },
      },
    )
    .then(response => ({
      source: response.data,
    }))
    .catch(handleErrors);
};

export const validateSource = (options = {}) => {
  validateOptions('validateSource', ['sourceName'], options);
  return axios
    .put(
      `${bundle.spaceLocation()}/app/components/task/app/api/v2/sources/${
        options.sourceName
      }/validate`,
      null,
      {
        params: {
          include: options.include,
        },
      },
    )
    .then(response => response.data)
    .catch(handleErrors);
};

export const fetchSourceAdapters = (options = {}) =>
  axios
    .get(
      `${bundle.spaceLocation()}/app/components/task/app/api/v2/meta/sourceAdapters`,
      {
        params: { include: options.include },
      },
    )
    .then(response => ({
      sourceAdapters: response.data.sourceAdapters,
    }))
    .catch(handleErrors);

export const updateDeferredTask = (options = {}) => {
  validateOptions('updateDeferredTask', ['token'], options);
  return axios
    .put(
      `${bundle.spaceLocation()}/app/components/task/app/api/v2/runs/task/${
        options.token
      }`,
      {
        message: options.message || '',
      },
    )
    .then(response => response.data)
    .catch(handleErrors);
};

export const completeDeferredTask = (options = {}) => {
  validateOptions('completeDeferredTask', ['token', 'results'], options);
  return axios
    .post(
      `${bundle.spaceLocation()}/app/components/task/app/api/v2/runs/task/${
        options.token
      }`,
      {
        results: options.results,
        message: options.message || '',
      },
    )
    .then(response => response.data)
    .catch(handleErrors);
};

export const fetchTaskCategories = (options = {}) =>
  axios
    .get(
      `${bundle.spaceLocation()}/app/components/task/app/api/v2/categories`,
      {
        params: {
          include: options.include,
        },
      },
    )
    .then(response => ({
      categories: response.data.categories,
    }))
    .catch(handleErrors);

export const createTaskCategory = (options = {}) => {
  validateOptions('createTaskCategory', ['category'], options);
  return axios
    .post(
      `${bundle.spaceLocation()}/app/components/task/app/api/v2/categories`,
      options.category,
      {
        params: {
          include: options.include,
        },
      },
    )
    .then(response => ({
      category: response.data.category,
    }))
    .catch(handleErrors);
};

export const fetchTaskCategory = (options = {}) => {
  validateOptions('fetchTaskCategory', ['categoryName'], options);
  return axios
    .get(
      `${bundle.spaceLocation()}/app/components/task/app/api/v2/categories/${
        options.categoryName
      }`,
      {
        params: {
          include: options.include,
        },
      },
    )
    .then(response => ({
      category: response.data,
    }))
    .catch(handleErrors);
};

export const deleteTaskCategory = (options = {}) => {
  validateOptions('deleteTaskCategory', ['categoryName'], options);
  return axios
    .delete(
      `${bundle.spaceLocation()}/app/components/task/app/api/v2/categories/${
        options.categoryName
      }`,
      {
        params: {
          include: options.include,
        },
      },
    )
    .then(response => ({
      category: response.data.category,
    }))
    .catch(handleErrors);
};

export const updateTaskCategory = (options = {}) => {
  validateOptions('updateTaskCategory', ['categoryName', 'category'], options);
  return axios
    .put(
      `${bundle.spaceLocation()}/app/components/task/app/api/v2/categories/${
        options.categoryName
      }`,
      options.category,
      {
        params: {
          include: options.include,
        },
      },
    )
    .then(response => ({
      category: response.data.category,
    }))
    .catch(handleErrors);
};

export const fetchPolicyRules = (options = {}) => {
  return axios
    .get(
      `${bundle.spaceLocation()}/app/components/task/app/api/v2/policyRules`,
      {
        params: {
          include: options.include,
          type: options.type,
        },
      },
    )
    .then(response => ({
      policyRules: response.data.policyRules,
    }))
    .catch(handleErrors);
};

export const createPolicyRule = (options = {}) => {
  validateOptions('createPolicyRule', ['policy', 'policyType'], options);
  return axios
    .post(
      `${bundle.spaceLocation()}/app/components/task/app/api/v2/policyRules/${
        options.policyType
      }`,
      options.policy,
      {
        params: {
          include: options.include,
        },
      },
    )
    .then(response => ({
      policyRule: response.data.policyRule,
    }))
    .catch(handleErrors);
};

export const fetchPolicyRule = (options = {}) => {
  validateOptions('fetchPolicyRule', ['policyName', 'policyType'], options);
  return axios
    .get(
      `${bundle.spaceLocation()}/app/components/task/app/api/v2/policyRules/${
        options.policyType
      }/${options.policyName}`,
      {
        params: {
          include: options.include,
        },
      },
    )
    .then(response => ({
      policyRule: response.data,
    }))
    .catch(handleErrors);
};

export const deletePolicyRule = (options = {}) => {
  validateOptions('deletePolicyRule', ['policyName', 'policyType'], options);
  return axios
    .delete(
      `${bundle.spaceLocation()}/app/components/task/app/api/v2/policyRules/${
        options.policyType
      }/${options.policyName}`,
      {
        params: {
          include: options.include,
        },
      },
    )
    .then(response => ({
      policyRule: response.data.policyRule,
    }))
    .catch(handleErrors);
};

export const updatePolicyRule = (options = {}) => {
  validateOptions(
    'updatePolicyRule',
    ['policyName', 'policy', 'policyType'],
    options,
  );
  return axios
    .put(
      `${bundle.spaceLocation()}/app/components/task/app/api/v2/policyRules/${
        options.policyType
      }/${options.policyName}`,
      options.policy,
      {
        params: {
          include: options.include,
        },
      },
    )
    .then(response => ({
      policyRule: response.data.policyRule,
    }))
    .catch(handleErrors);
};

export const fetchSystemErrors = (options = {}) =>
  axios
    .get(
      `${bundle.spaceLocation()}/app/components/task/app/api/v2/systemErrors`,
      {
        params: {
          include: options.include,
        },
      },
    )
    .then(response => ({ systemErrors: response.data.errors }))
    .catch(handleErrors);

export const fetchSystemError = (options = {}) => {
  validateOptions('fetchSystemError', ['errorId'], options);
  return axios
    .get(
      `${bundle.spaceLocation()}/app/components/task/app/api/v2/systemErrors/${
        options.errorId
      }`,
      {
        params: {
          include: options.include,
        },
      },
    )
    .then(response => ({ systemError: response.data }))
    .catch(handleErrors);
};

export const resolveSystemError = (options = {}) => {
  validateOptions('resolveSystemError', ['ids', 'resolution'], options);
  return axios
    .post(
      `${bundle.spaceLocation()}/app/components/task/app/api/v2/systemErrors/resolve`,
      { ids: options.ids, resolution: options.resolution },
    )
    .then(response => ({
      message: response.data.message,
    }))
    .catch(handleErrors);
};

export const fetchHandlers = (options = {}) =>
  axios
    .get(`${bundle.spaceLocation()}/app/components/task/app/api/v2/handlers`, {
      params: {
        include: options.include,
      },
    })
    .then(response => ({
      handlers: response.data.handlers,
    }))
    .catch(handleErrors);

export const fetchHandler = (options = {}) => {
  validateOptions('fetchHandler', ['definitionId'], options);
  return axios
    .get(
      `${bundle.spaceLocation()}/app/components/task/app/api/v2/handlers/${
        options.definitionId
      }`,
      {
        params: {
          include: options.include,
        },
      },
    )
    .then(response => ({
      handler: response.data,
    }))
    .catch(handleErrors);
};

export const createHandler = (options = {}) => {
  const { packageUrl, packageFile, force } = options;

  let data = {};
  let headers = {};

  if (packageUrl) {
    data = { packageUrl };
  } else {
    data = new FormData();
    data.set('package', packageFile);
    headers = { 'Content-Type': 'multipart/form-data' };
  }

  return axios
    .post(
      `${bundle.spaceLocation()}/app/components/task/app/api/v2/handlers`,
      data,
      {
        headers,
        params: {
          force,
        },
      },
    )
    .then(response => response.data)
    .catch(error => ({
      error: error.response.data,
    }));
};

export const updateHandler = (options = {}) => {
  validateOptions('updateHandler', ['definitionId', 'handler'], options);
  return axios
    .put(
      `${bundle.spaceLocation()}/app/components/task/app/api/v2/handlers/${
        options.definitionId
      }`,
      options.handler,
      {
        params: {
          include: options.include,
        },
      },
    )
    .then(response => ({
      handler: response.data,
    }))
    .catch(handleErrors);
};

export const deleteHandler = (options = {}) => {
  const { definitionId } = options;
  if (!definitionId) {
    throw new Error(
      'deleteHandler failed! The option "definitionId" is required.',
    );
  }
  return axios
    .delete(
      `${bundle.spaceLocation()}/app/components/task/app/api/v2/handlers/${definitionId}`,
    )
    .then(response => ({
      handler: response.data,
    }))
    .catch(handleErrors);
};

export const fetchUsage = (options = {}) => {
  const id = buildTreeId(options);
  const path =
    options.usageType === 'handler'
      ? `${bundle.spaceLocation()}/app/components/task/app/api/v2/handlers/${
          options.definitionId
        }/usage`
      : `${bundle.spaceLocation()}/app/components/task/app/api/v2/trees/${id}/usage`;

  return axios
    .get(path, {
      params: {
        include: options.include,
      },
    })
    .then(response => ({
      usages:
        options.usageType === 'handler'
          ? response.data.handlerUsage
          : options.usageType === 'routine'
          ? response.data.routineUsage
          : [],
      totalTrees: response.data.totalTrees,
      totalRoutines: response.data.totalRoutines,
      totalNodes: response.data.totalNodes,
    }))
    .catch(handleErrors);
};

export const fetchHandlerDurations = (options = {}) => {
  return axios
    .get(
      `${bundle.spaceLocation()}/app/components/task/app/api/v2/handlers/${
        options.definitionId
      }/durations`,
    )
    .then(response => response.data)
    .catch(handleErrors);
};

export const fetchMissingRoutines = (options = {}) => {
  return axios
    .get(
      `${bundle.spaceLocation()}/app/components/task/app/api/v2/trees/missing`,
      {
        params: {
          include: options.include,
        },
      },
    )
    .then(response => ({
      missingRoutines: response.data.missingRoutines,
    }))
    .catch(handleErrors);
};

export const fetchMissingHandlers = (options = {}) => {
  return axios
    .get(
      `${bundle.spaceLocation()}/app/components/task/app/api/v2/handlers/missing`,
      {
        params: {
          include: options.include,
        },
      },
    )
    .then(response => ({
      missingHandlers: response.data.missingHandlers,
    }))
    .catch(handleErrors);
};

export const stopEngine = (options = {}) =>
  axios
    .post(
      options.spaceSlug
        ? `/app/system-coordinator/components/task/${options.spaceSlug}/app/api/v2/engine`
        : `${bundle.spaceLocation()}/app/components/task/app/api/v2/engine`,
      {
        action: 'stop',
        asynchronous: options.asynchronous || 'false',
      },
    )
    .then(response => response.data)
    .catch(handleErrors);

export const startEngine = (options = {}) =>
  axios
    .post(
      options.spaceSlug
        ? `/app/system-coordinator/components/task/${options.spaceSlug}/app/api/v2/engine`
        : `${bundle.spaceLocation()}/app/components/task/app/api/v2/engine`,
      {
        action: 'start',
        asynchronous: options.asynchronous || 'false',
      },
    )
    .then(response => response.data)
    .catch(handleErrors);

export const fetchEngineStatus = (options = {}) =>
  axios
    .get(
      options.spaceSlug
        ? `/app/system-coordinator/components/task/${options.spaceSlug}/app/api/v2/engine`
        : `${bundle.spaceLocation()}/app/components/task/app/api/v2/engine`,
    )
    .then(response => response.data)
    .catch(handleErrors);

export const fetchEngineLicense = () =>
  axios
    .get(
      `${bundle.spaceLocation()}/app/components/task/app/api/v2/config/license`,
    )
    .then(response => response.data)
    .catch(handleErrors);

export const fetchEngineSettings = (options = {}) =>
  axios
    .get(
      options.spaceSlug
        ? `/app/system-coordinator/components/task/${options.spaceSlug}/app/api/v2/config/engine`
        : `${bundle.spaceLocation()}/app/components/task/app/api/v2/config/engine`,
    )
    .then(response => ({
      settings: response.data.properties,
    }))
    .catch(handleErrors);

export const updateEngineSettings = (options = {}) =>
  axios
    .put(
      options.spaceSlug
        ? `/app/system-coordinator/components/task/${options.spaceSlug}/app/api/v2/config/engine`
        : `${bundle.spaceLocation()}/app/components/task/app/api/v2/config/engine`,
      options.settings,
    )
    .then(response => ({
      message: response.data.message,
    }))
    .catch(handleErrors);

export const fetchTaskRuns = (options = {}) =>
  axios
    .get(`${bundle.spaceLocation()}/app/components/task/app/api/v2/runs`, {
      params: {
        type: options.type,
        limit: options.limit,
        include: options.include,
        offset: options.offset,
        id: options.id || undefined,
        source: options.source || undefined,
        includeSystemRuns: options.includeSystemRuns || undefined,
        group: options.group || undefined,
        groupFragment: options.groupFragment || undefined,
        treeType: options.treeType || undefined,
        sourceId: options.sourceId || undefined,
        tree: options.tree || undefined,
        treeFragment: options.treeFragment || undefined,
        ownerEmail: options.ownerEmail || undefined,
        status: options.status || undefined,
        orderBy: options.orderBy,
        direction: options.direction,
        count: options.count || undefined,
        start: options.start || undefined,
        end: options.end || undefined,
      },
    })
    .then(response => ({
      runs: response.data.runs,
      count: response.data.count,
      nextPageToken: generateNextPageToken(response.data),
    }))
    .catch(handleErrors);

export const fetchTaskRun = (options = {}) => {
  validateOptions('fetchTaskRun', ['runId'], options);

  return axios
    .get(
      `${bundle.spaceLocation()}/app/components/task/app/api/v2/runs/${
        options.runId
      }`,
      {
        params: {
          include: options.include,
        },
      },
    )
    .then(response => ({
      run: response.data,
    }))
    .catch(handleErrors);
};

export const updateTaskRun = (options = {}) => {
  validateOptions('updateTaskRun', ['runId', 'run'], options);

  return axios.put(
    `${bundle.spaceLocation()}/app/components/task/app/api/v2/runs/${
      options.runId
    }`,
    options.run,
    {
      include: options.include,
    },
  );
};

export const createTaskRun = (options = {}) => {
  validateOptions('createTaskRun', ['run'], options);
  const data =
    options.run.sourceData || options.run.sourceData === ''
      ? options.run.sourceData
      : options.run;

  return axios
    .post(
      `${bundle.spaceLocation()}/app/components/task/app/api/v2/runs`,
      data,
      {
        include: options.include,
        params: {
          sourceName: options.sourceName || undefined,
          sourceGroup: options.sourceGroup || undefined,
          name: options.name || undefined,
        },
        headers: { 'Content-Type': 'text/plain' },
      },
    )
    .then(response => ({
      run: response.data,
    }))
    .catch(handleErrors);
};

export const fetchTaskTriggers = (options = {}) =>
  axios
    .get(
      `${bundle.spaceLocation()}/app/components/task/app/api/v2/triggers${
        options.triggerStatus ? '/' + options.triggerStatus : ''
      }`,
      {
        params: {
          limit: options.limit,
          include: options.include,
          offset: options.offset,
          source: options.source || undefined,
          group: options.group || undefined,
          sourceId: options.sourceId || undefined,
          tree: options.treeName || undefined,
          treeId: options.treeId || undefined,
          treeType: options.treeType || undefined,
          action: options.action || undefined,
          branchId: options.branchId || undefined,
          runId: options.runId || undefined,
          managementAction: options.managementAction || undefined,
          selectionCriterion: options.selectionCriterion || undefined,
          status: options.status || undefined,
          token: options.token || undefined,
          timeline: options.orderBy,
          direction: options.direction,
          start: options.start,
          end: options.end,
        },
      },
    )
    .then(response => ({
      triggers: response.data.triggers,
      nextPageToken: generateNextPageToken(response.data),
    }))
    .catch(handleErrors);

export const createTaskTrigger = (options = {}) => {
  validateOptions('createTaskTrigger', ['runId', 'nodeId'], options);
  return axios
    .post(
      `${bundle.spaceLocation()}/app/components/task/app/api/v2/runs/${
        options.runId
      }/triggers`,
      {
        nodeId: options.nodeId,
        branchId: options.branchId || undefined,
        loopIndex: options.loopIndex || undefined,
      },
    )
    .then(response => response.data)
    .catch(handleErrors);
};

export const fetchTaskRunErrors = (options = {}) =>
  axios
    .get(`${bundle.spaceLocation()}/app/components/task/app/api/v2/errors`, {
      params: {
        limit: options.limit,
        include: options.include,
        offset: options.offset,
        timeline: options.timeline,
        direction: options.direction,
        start: options.start,
        end: options.end,
        status: options.status || undefined,
        source: options.source || undefined,
        sourceId: options.sourceId || undefined,
        group: options.group || undefined,
        tree: options.tree || undefined,
        nodeId: options.nodeId || undefined,
        handlerId: options.handlerId || undefined,
        runId: options.runId || undefined,
        type: options.type || undefined,
        id: options.id || undefined,
        relatedItem1Id: options.relatedItem1Id || undefined,
        relatedItem1Type: options.relatedItem1Type || undefined,
        relatedItem2Id: options.relatedItem1Id || undefined,
        relatedItem2Type: options.relatedItem1Type || undefined,
        count: options.count || undefined,
      },
    })
    .then(response => ({
      runErrors: response.data.errors,
      count: response.data.count,
      nextPageToken: generateNextPageToken(response.data),
    }))
    .catch(handleErrors);

export const fetchTaskRunError = (options = {}) => {
  validateOptions('fetchTaskRunError', ['errorId'], options);

  return axios
    .get(
      `${bundle.spaceLocation()}/app/components/task/app/api/v2/errors/${
        options.errorId
      }`,
      {
        params: {
          include: options.include,
        },
      },
    )
    .then(response => ({
      runError: response.data,
    }))
    .catch(handleErrors);
};

export const updateRunTaskResults = (options = {}) => {
  validateOptions(
    'updateRunTaskResults',
    ['runId', 'taskId', 'results'],
    options,
  );
  const resultKey = options.type || 'results';

  return axios
    .put(
      `${bundle.spaceLocation()}/app/components/task/app/api/v2/runs/${
        options.runId
      }/tasks/${options.taskId}`,
      { [resultKey]: options.results },
      {
        params: {
          include: options.include,
        },
      },
    )
    .then(response => ({
      message: response.data,
    }))
    .catch(handleErrors);
};

export const resolveTaskErrors = (options = {}) => {
  validateOptions(
    'resolveTaskErrors',
    ['ids', 'action', 'resolution'],
    options,
  );

  return axios
    .post(
      `${bundle.spaceLocation()}/app/components/task/app/api/v2/errors/resolve`,
      {
        ids: options.ids,
        action: options.action,
        resolution: options.resolution,
        params: {
          include: options.include,
        },
      },
    )
    .then(response => ({
      message: response.data,
    }))
    .catch(handleErrors);
};

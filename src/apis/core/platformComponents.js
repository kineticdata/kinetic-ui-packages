import axios from 'axios';

import { bundle, buildAgentPath } from '../../helpers';
import {
  handleErrors,
  headerBuilder,
  paramBuilder,
  validateOptions,
} from '../http';

export const fetchTaskComponent = (options = {}) => {
  validateOptions('fetchTaskComponent', [], options);
  return axios
    .get(`${bundle.apiLocation()}/platformComponents/task`, {
      params: paramBuilder(options),
      headers: headerBuilder(options),
    })
    .then(response => ({
      task: response.data.task,
    }))
    .catch(handleErrors);
};

export const updateTaskComponent = (options = {}) => {
  validateOptions('updateTaskComponent', ['task'], options);
  return axios
    .put(`${bundle.apiLocation()}/platformComponents/task`, options.task, {
      params: paramBuilder(options),
      headers: headerBuilder(options),
    })
    .then(response => ({
      task: response.data.task,
    }))
    .catch(handleErrors);
};

export const fetchAgentComponents = (options = {}) => {
  return axios
    .get(`${bundle.apiLocation()}/platformComponents/agents`, {
      params: paramBuilder(options),
      headers: headerBuilder(options),
    })
    .then(response => ({
      agents: response.data.agents,
    }))
    .catch(handleErrors);
};

export const fetchAgentComponent = (options = {}) => {
  validateOptions('fetchAgentComponent', ['slug'], options);
  return axios
    .get(`${bundle.apiLocation()}/platformComponents/agents/${options.slug}`, {
      params: paramBuilder(options),
      headers: headerBuilder(options),
    })
    .then(response => ({
      agent: response.data.agent,
    }))
    .catch(handleErrors);
};

export const createAgentComponent = (options = {}) => {
  validateOptions('createAgentComponent', ['agent'], options);
  return axios
    .post(`${bundle.apiLocation()}/platformComponents/agents`, options.agent, {
      params: paramBuilder(options),
      headers: headerBuilder(options),
    })
    .then(response => ({
      agent: response.data.agent,
    }))
    .catch(handleErrors);
};

export const updateAgentComponent = (options = {}) => {
  validateOptions('updateAgentComponent', ['slug', 'agent'], options);
  return axios
    .put(
      `${bundle.apiLocation()}/platformComponents/agents/${options.slug}`,
      options.agent,
      {
        params: paramBuilder(options),
        headers: headerBuilder(options),
      },
    )
    .then(response => ({
      agent: response.data.agent,
    }))
    .catch(handleErrors);
};

export const deleteAgentComponent = (options = {}) => {
  validateOptions('deleteAgentComponent', ['slug'], options);
  return axios
    .delete(
      `${bundle.apiLocation()}/platformComponents/agents/${options.slug}`,
      {
        params: paramBuilder(options),
        headers: headerBuilder(options),
      },
    )
    .then(response => ({
      agent: response.data.agent,
    }))
    .catch(handleErrors);
};

export const validateAgent = (options = {}) => {
  validateOptions('validateAgent', [], options);
  return axios
    .get(`${buildAgentPath(options)}/app/api/v1/bridges`, {
      params: paramBuilder(options),
      headers: headerBuilder(options),
    })
    .then(response => ({
      successMessage: `${options.agentSlug} has been successfully validated.`,
    }))
    .catch(handleErrors);
};

export const fetchAgentComponentVersion = (options = {}) => {
  validateOptions('validateAgent', [], options);
  return axios
    .get(`${buildAgentPath(options)}/app/api/v1/version`, {
      params: paramBuilder(options),
      headers: headerBuilder(options),
    })
    .then(response => ({
      version: response.data.version,
    }))
    .catch(handleErrors);
};

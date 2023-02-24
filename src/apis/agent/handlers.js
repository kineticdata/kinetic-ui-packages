import axios from 'axios';
import {
  handleErrors,
  headerBuilder,
  paramBuilder,
  validateOptions,
} from '../http';
import { buildAgentPath } from '../../helpers';

export const fetchAgentHandlers = (options = {}) => {
  validateOptions('fetchAgentHandlers', [], options);
  return axios
    .get(`${buildAgentPath(options)}/app/api/v1/handlers`, {
      params: paramBuilder(options),
      headers: headerBuilder(options),
    })
    .then(response => ({ handlers: response.data.handlers }))
    .catch(handleErrors);
};

export const fetchAgentHandler = (options = {}) => {
  validateOptions('fetchAgentHandler', ['handlerSlug'], options);
  return axios
    .get(
      `${buildAgentPath(options)}/app/api/v1/handlers/${options.handlerSlug}`,
      {
        params: paramBuilder(options),
        headers: headerBuilder(options),
      },
    )
    .then(response => ({ handler: response.data.handler }))
    .catch(handleErrors);
};

export const createAgentHandler = (options = {}) => {
  validateOptions('createAgentHandler', ['handler'], options);
  return axios
    .post(`${buildAgentPath(options)}/app/api/v1/handlers/`, options.handler, {
      params: paramBuilder(options),
      headers: headerBuilder(options),
    })
    .then(response => ({ handler: response.data.handler }))
    .catch(handleErrors);
};

export const updateAgentHandler = (options = {}) => {
  validateOptions('updateAgentHandler', ['handlerSlug', 'handler'], options);
  return axios
    .put(
      `${buildAgentPath(options)}/app/api/v1/handlers/${options.handlerSlug}`,
      options.handler,
      { params: paramBuilder(options), headers: headerBuilder(options) },
    )
    .then(response => ({ handler: response.data.handler }))
    .catch(handleErrors);
};

export const deleteAgentHandler = (options = {}) => {
  validateOptions('deleteAgentHandler', ['handlerSlug'], options);
  return axios
    .delete(
      `${buildAgentPath(options)}/app/api/v1/handlers/${options.handlerSlug}`,
      {
        params: paramBuilder(options),
        headers: headerBuilder(options),
      },
    )
    .then(response => ({ handler: response.data.handler }))
    .catch(handleErrors);
};

export const testAgentHandler = (options = {}) => {
  validateOptions(
    'testAgentHandler',
    ['agentSlug', 'handlerSlug', 'parameters'],
    options,
  );

  const parameters = options.parameters.reduce((params, parameter) => {
    params[parameter.name] = parameter.value;
    return params;
  }, {});

  return axios
    .post(
      `${buildAgentPath(options)}/app/api/v1/handlers/${
        options.handlerSlug
      }/execute`,
      {
        ...parameters,
      },
    )
    .catch(handleErrors);
};

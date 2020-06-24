import axios from 'axios';
import { bundle } from '../../helpers';
import { handleErrors, headerBuilder, paramBuilder } from '../http';

const getEndpointPrefix = () => `${bundle.apiLocation()}/translations`;

const validateOptions = (functionName, requiredOptions, options) => {
  const missing = requiredOptions.filter(
    requiredOption => !options[requiredOption],
  );

  if (missing.length > 0) {
    throw new Error(
      `${functionName} failed! The following required options are missing: ${missing}`,
    );
  }
};

export const fetchAvailableLocales = (options = {}) => {
  const paramModifier = params =>
    options.localeCode
      ? {
          ...params,
          localized: options.localeCode,
        }
      : params;
  return axios
    .get(`${bundle.apiLocation()}/meta/locales`, {
      params: paramModifier(paramBuilder(options)),
      headers: headerBuilder(options),
    })
    .then(response => ({
      locales: response.data.locales,
    }))
    .catch(handleErrors);
};

export const clearTranslationsCache = (options = {}) => {
  return axios
    .delete(`${getEndpointPrefix()}/cache`, {
      params: paramBuilder(options),
      headers: headerBuilder(options),
    })
    .then(response => ({
      message: response.data.message,
    }))
    .catch(handleErrors);
};

export const fetchStagedTranslations = (options = {}) => {
  const paramModifier = params =>
    options.contextName
      ? {
          ...params,
          context: options.contextName,
        }
      : params;
  return axios
    .get(`${getEndpointPrefix()}/staged`, {
      params: paramModifier(paramBuilder(options)),
      headers: headerBuilder(options),
    })
    .then(response => ({
      changes: response.data.changes,
    }))
    .catch(handleErrors);
};

export const fetchDefaultLocale = (options = {}) => {
  return axios
    .get(`${getEndpointPrefix()}/settings/defaultLocale`, {
      params: paramBuilder(options),
      headers: headerBuilder(options),
    })
    .then(response => ({
      defaultLocale: response.data.defaultLocale,
    }))
    .catch(handleErrors);
};

export const setDefaultLocale = (options = {}) => {
  validateOptions('setDefaultLocale', ['localeCode'], options);
  return axios
    .put(
      `${getEndpointPrefix()}/settings/defaultLocale`,
      { code: options.localeCode },
      {
        params: paramBuilder(options),
        headers: headerBuilder(options),
      },
    )
    .then(response => ({
      defaultLocale: response.data.defaultLocale,
    }))
    .catch(handleErrors);
};

export const fetchEnabledLocales = (options = {}) => {
  return axios
    .get(`${getEndpointPrefix()}/settings/locales`, {
      params: paramBuilder(options),
      headers: headerBuilder(options),
    })
    .then(response => ({
      locales: response.data.locales,
    }))
    .catch(handleErrors);
};

export const enableLocale = (options = {}) => {
  validateOptions('enableLocale', ['localeCode'], options);
  return axios
    .post(
      `${getEndpointPrefix()}/settings/locales`,
      { code: options.localeCode },
      {
        params: paramBuilder(options),
        headers: headerBuilder(options),
      },
    )
    .then(response => ({
      locale: response.data.locale,
    }))
    .catch(handleErrors);
};

export const disableLocale = (options = {}) => {
  validateOptions('disableLocale', ['localeCode'], options);
  return axios
    .delete(`${getEndpointPrefix()}/settings/locales/${options.localeCode}`, {
      params: paramBuilder(options),
      headers: headerBuilder(options),
    })
    .then(response => ({
      locale: response.data.locale,
    }))
    .catch(handleErrors);
};

export const fetchContexts = (options = {}) => {
  const paramModifier = params => {
    if (options.custom) {
      return { ...params, custom: true };
    } else if (options.expected) {
      return { ...params, expected: true };
    } else if (options.unexpected) {
      return { ...params, unexpected: true };
    } else {
      return params;
    }
  };
  return axios
    .get(`${getEndpointPrefix()}/contexts`, {
      params: paramModifier(paramBuilder(options)),
      headers: headerBuilder(options),
    })
    .then(response => ({
      contexts: response.data.contexts.map(c => ({
        name: c.name,
        kapp: c.name.startsWith('kapps') ? c.name.split('.')[1] : null,
        form: c.name.startsWith('kapps')
          ? c.name.split('.')[3]
          : c.name.startsWith('datastore')
          ? c.name.split('.')[2]
          : null,
      })),
    }))
    .catch(handleErrors);
};

export const createContext = (options = {}) => {
  validateOptions('createContext', ['context'], options);
  return axios
    .post(`${getEndpointPrefix()}/contexts`, options.context, {
      params: paramBuilder(options),
      headers: headerBuilder(options),
    })
    .then(response => ({
      context: response.data.context,
    }))
    .catch(handleErrors);
};

export const updateContext = (options = {}) => {
  validateOptions('updateContext', ['contextName', 'context'], options);
  return axios
    .put(
      `${getEndpointPrefix()}/contexts/${options.contextName}`,
      options.context,
      {
        params: paramBuilder(options),
        headers: headerBuilder(options),
      },
    )
    .then(response => ({
      context: response.data.context,
    }))
    .catch(handleErrors);
};

export const deleteContext = (options = {}) => {
  validateOptions('deleteContext', ['contextName'], options);
  return axios
    .delete(`${getEndpointPrefix()}/contexts/${options.contextName}`, {
      params: paramBuilder(options),
      headers: headerBuilder(options),
    })
    .then(response => ({
      context: response.data.context,
    }))
    .catch(handleErrors);
};

export const fetchContextKeys = (options = {}) => {
  validateOptions('fetchContextKeys', ['contextName'], options);
  return axios
    .get(`${getEndpointPrefix()}/contexts/${options.contextName}/keys`, {
      params: paramBuilder(options),
      headers: headerBuilder(options),
    })
    .then(response => ({
      keys: response.data.keys,
    }))
    .catch(handleErrors);
};

export const updateContextKey = (options = {}) => {
  validateOptions(
    'updateContextKey',
    ['contextName', 'keyHash', 'key'],
    options,
  );
  return axios
    .put(
      `${getEndpointPrefix()}/contexts/${options.contextName}/keys/${
        options.keyHash
      }`,
      options.key,
      {
        params: paramBuilder(options),
        headers: headerBuilder(options),
      },
    )
    .then(response => ({
      message: response.data.message,
    }))
    .catch(handleErrors);
};

export const fetchTranslations = (options = {}) => {
  if (options.cache) {
    validateOptions(
      'fetchTranslations',
      ['contextName', 'localeCode'],
      options,
    );
  }
  const paramModifier = params => {
    const result = { ...params };
    if (options.cache) {
      result.cache = true;
    }
    if (options.contextName) {
      result.context = options.contextName;
    }
    if (options.localeCode) {
      result.locale = options.localeCode;
    }
    if (options.keyHash) {
      result.keyHash = options.keyHash;
    }
    if (options.missing) {
      result.missing = options.missing;
    }
    if (options.export && !options.cache) {
      result.download = true;
    }
    return result;
  };
  return axios
    .get(`${getEndpointPrefix()}/entries`, {
      params: paramModifier(paramBuilder(options)),
      headers: headerBuilder(options),
    })
    .then(response => ({
      entries: response.data.entries ? response.data.entries : response.data,
    }))
    .catch(handleErrors);
};

export const upsertTranslations = (options = {}) => {
  let data = null;
  if (options.import) {
    validateOptions('upsertTranslations', ['file'], options);
    data = new FormData();
    data.append('file', options.file);
  } else if (options.translations) {
    validateOptions('upsertTranslations', ['translations'], options);
    data = options.translations;
  } else {
    validateOptions('upsertTranslations', ['translation'], options);
    data = options.translation;
  }
  const paramModifier = params =>
    options.import ? { ...params, import: options.import } : params;
  const headerModifier = headers =>
    options.import
      ? { ...headers, 'Content-Type': 'multipart/form-data' }
      : headers;
  return axios
    .post(`${getEndpointPrefix()}/entries`, data, {
      params: paramModifier(paramBuilder(options)),
      headers: headerModifier(headerBuilder(options)),
    })
    .then(response => ({
      message: response.data.message,
    }))
    .catch(handleErrors);
};

export const deleteTranslations = (options = {}) => {
  if (options.keyHash) {
    validateOptions('deleteTranslations', ['contextName'], options);
  }
  const paramModifier = params => {
    const result = { ...params };
    if (options.contextName) {
      result.context = options.contextName;
    }
    if (options.localeCode) {
      result.locale = options.localeCode;
    }
    if (options.keyHash) {
      result.keyHash = options.keyHash;
    }
    return result;
  };
  return axios
    .delete(`${getEndpointPrefix()}/entries`, {
      params: paramModifier(paramBuilder(options)),
      headers: headerBuilder(options),
    })
    .then(response => ({
      message: response.data.message,
    }))
    .catch(handleErrors);
};

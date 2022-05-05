import axios from 'axios';
import { Map } from 'immutable';
import { bundle } from '../helpers';

const types = {
  400: 'badRequest',
  401: 'unauthorized',
  403: 'forbidden',
  404: 'notFound',
  405: 'methodNotAllowed',
};

export const handleErrors = error => {
  // handle a javascript runtime exception by re-throwing it, this is in case we
  // make a mistake in a `then` block in one of our api functions.
  if (error instanceof Error && !error.response) {
    throw error;
  }

  if (axios.isCancel(error)) {
    return { error: 'Canceled by user request.' };
  }

  // Destructure out the information needed.
  const { data = {}, status: statusCode, statusText, headers } = error.response;
  const type = types[statusCode];
  const { error: errorMessage, errorKey: key = null, message, ...rest } = data;
  const result =
    headers && !headers['content-type'].startsWith('application/json')
      ? { message: 'An unexpected error occurred.', statusCode }
      : statusCode === 503
        ? {
            statusCode,
            message:
              'The platform component you are using is not available. Please contact your administrator.',
          }
        : typeof data === 'string'
          ? { message: data, statusCode, key }
          : {
              ...rest,
              message: errorMessage || message || statusText,
              key,
              statusCode,
            };
  if (type) {
    result[type] = true;
  }
  return { error: result };
};

export const paramBuilder = options => {
  const params = {};

  if (options.include) params.include = options.include;
  if (options.limit >= 0) params.limit = options.limit;
  if (options.pageToken) params.pageToken = options.pageToken;
  if (options.q) params.q = options.q;
  if (options.direction) params.direction = options.direction;
  if (options.orderBy) params.orderBy = options.orderBy;
  if (options.manage) params.manage = options.manage;
  if (options.export) params.export = options.export;
  if (options.days) params.days = options.days;
  if (options.count) params.count = options.count;

  return params;
};

export const headerBuilder = options => {
  const headers = {};
  if (!options.public) {
    headers['X-Kinetic-AuthAssumed'] = 'true';
  }
  return headers;
};

export const validateOptions = (functionName, requiredOptions, options) => {
  const missing = requiredOptions.filter(
    requiredOption => !options[requiredOption],
  );
  if (missing.length > 0) {
    throw new Error(
      `${functionName} failed! The following required options are missing: ${missing}`,
    );
  }
};

export const apiFunction = ({
  name,
  method,
  dataOption,
  requiredOptions,
  url,
  transform,
}) => (options = {}) => {
  validateOptions(
    name,
    dataOption ? [...requiredOptions, dataOption] : requiredOptions,
    options,
  );
  const urlPostfix = url(options);
  return axios({
    method,
    url: urlPostfix.startsWith('/app')
      ? urlPostfix
      : bundle.apiLocation() + urlPostfix,
    data: dataOption && options[dataOption],
    params: paramBuilder(options),
    headers: headerBuilder(options),
  })
    .then(transform)
    .catch(handleErrors);
};

export const apiGroup = ({ dataOption, name, plural, singular }) => ({
  [`fetch${name}s`]: apiFunction({
    name: `fetch${name}s`,
    method: 'get',
    ...plural,
  }),
  [`fetch${name}`]: apiFunction({
    name: `fetch${name}`,
    method: 'get',
    ...singular,
  }),
  [`create${name}`]: apiFunction({
    name: `create${name}`,
    dataOption,
    method: 'post',
    ...plural,
    transform: singular.transform,
  }),
  [`update${name}`]: apiFunction({
    name: `update${name}`,
    dataOption,
    method: 'put',
    ...singular,
  }),
  [`delete${name}`]: apiFunction({
    name: `delete${name}`,
    method: 'delete',
    ...singular,
  }),
});

export const formPath = ({ form, kapp }) =>
  !kapp
    ? form
      ? `${bundle.spaceLocation()}/app/forms/${form}`
      : `${bundle.spaceLocation()}/app/forms`
    : form
      ? `${bundle.spaceLocation()}/${kapp || bundle.kappSlug()}/${form}`
      : `${bundle.spaceLocation()}/${kapp || bundle.kappSlug()}`;

export const submissionPath = ({ submission, datastore }) =>
  datastore
    ? submission
      ? `${bundle.spaceLocation()}/app/datastore/submissions/${submission}`
      : `${bundle.spaceLocation()}/app/datastore/submissions`
    : submission
      ? `${bundle.spaceLocation()}/submissions/${submission}`
      : `${bundle.spaceLocation()}/submissions`;

export const corePath = ({ submission, kapp, form, datastore }) =>
  submission
    ? submissionPath({ datastore, submission })
    : formPath({ form, kapp });

export const operations = Map({
  startsWith: (field, value) => `${field} =* "${value}"`,
  equals: (field, value) => `${field} = "${value}"`,
  lt: (field, value) => `${field} < "${value}"`,
  lteq: (field, value) => `${field} <= "${value}"`,
  gt: (field, value) => `${field} > "${value}"`,
  gteq: (field, value) => `${field} >= "${value}"`,
  in: (field, value) => `${field} IN (${value.map(v => `"${v}"`).join(', ')})`,
  between: (field, value) =>
    `${field} BETWEEN ("${value.get(0)}", "${value.get(1)}")`,
});

const searchFilters = filters => {
  const q = Map(filters)
    .filter(filter => filter.getIn(['value'], '') !== '')
    .map((filter, key) => {
      const mode = filter.getIn(['column', 'filter']);
      const op = operations.get(mode, operations.get('startsWith'));

      return op(key, filter.get('value'));
    })
    .toIndexedSeq()
    .toList()
    .join(' AND ');

  return q.length > 0 ? { q } : {};
};

export const generateSortParams = ({ sortColumn, sortDirection }) =>
  sortColumn
    ? {
        orderBy: sortColumn,
        direction: sortDirection,
      }
    : {};

export const generatePaginationParams = ({ pageSize, nextPageToken }) =>
  pageSize && nextPageToken
    ? {
        limit: pageSize,
        pageToken: nextPageToken,
      }
    : pageSize
      ? { limit: pageSize }
      : {};

const sortParams = (sortColumn, sortDirection) =>
  sortColumn
    ? {
        orderBy: sortColumn,
        direction: sortDirection,
      }
    : {};

export const generateCESearchParams = ({
  pageSize,
  filters,
  sortColumn,
  sortDirection,
  nextPageToken,
}) => ({
  limit: pageSize,
  pageToken: nextPageToken,
  ...searchFilters(filters),
  ...sortParams(sortColumn, sortDirection),
});

export const transformCoreResult = envelope => (result, paramData) => {
  const count = paramData.nextPageToken
    ? result.count + paramData.pageTokens.size * paramData.pageSize
    : result.count;

  return {
    data: result[envelope],
    nextPageToken: result.nextPageToken,
    count,
  };
};

import { axios } from '../../store';
import { bundle } from '../../helpers';
import { handleErrors, headerBuilder } from '../http';

const parseNDLog = logLine => {
  try {
    return JSON.parse(logLine);
  } catch (e) {
    console.warn('Failed to parse ND log line: ', logLine);
  }
  return {};
};

export const fetchLogs = (options = {}) => {
  const format = options.format || 'ndjson';

  return axios
    .get(`${bundle.spaceLocation()}/app/loghub/api/v1/logs`, {
      params: {
        limit: options.limit || 500,
        format,
        q: options.q,
        pageToken: options.nextPageToken,
        start: options.start,
        end: options.end,
      },
      headers: headerBuilder(options),
    })
    .then(response => {
      if (typeof response.data === 'object') {
        return {
          logs: [],
          nextPageToken: response.data.metadata.nextPageToken,
        };
      } else if (
        typeof response.data === 'string' &&
        !response.data.startsWith('{')
      ) {
        return {
          error: response.data,
        };
      }

      const logs = response.data
        .split('\n')
        .filter(ll => ll !== '')
        .map(parseNDLog);

      const last = logs[logs.length - 1];

      if (last.metadata) {
        logs.pop();
        return {
          logs,
          nextPageToken: last.metadata.nextPageToken,
        };
      }

      return {
        logs,
      };
    })
    .catch(handleErrors);
};

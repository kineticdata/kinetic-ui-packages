import axios from 'axios';
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

export const fetchLogsVersion = () =>
  axios
    .get(`${bundle.spaceLocation()}/app/loghub/api/v1/version`, {})
    .then(response => response.data)
    .catch(response => ({ error: response }));

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
        tail: options.tail,
      },
      headers: headerBuilder(options),
    })
    .then(response => {
      if (typeof response.data === 'object') {
        return {
          logs: [response.data],
          nextPageToken: response.data.metadata
            ? response.data.metadata.nextPageToken
            : null,
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

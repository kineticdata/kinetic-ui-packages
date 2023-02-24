import axios from 'axios';
import { buildAgentPath } from '../../helpers';
import { handleErrors, headerBuilder, paramBuilder } from '../http';

const validateOptions = (functionName, requiredOptions, options) => {
  const validTypes = ['bridge', 'filestore', 'handler'];

  const invalidType = !validTypes.includes(options.type);

  const missing = requiredOptions.filter(
    requiredOption => !options[requiredOption],
  );

  if (missing.length > 0) {
    throw new Error(
      `${functionName} failed! The following required options are missing: ${missing}`,
    );
  }
  if (invalidType) {
    throw new Error(
      `${functionName} failed! The provided adapter type (${
        options.attributeType
      }) is not valid. Must be one of ${validTypes.join(', ')}`,
    );
  }
};

export const fetchAdapters = (options = {}) => {
  validateOptions('fetchAdapters', ['type'], options);
  return axios
    .get(
      `${
        options.slug
          ? '/app/system-coordinator/components/agent'
          : buildAgentPath(options)
      }/app/api/v1/adapters?type=${options.type}`,
      {
        params: paramBuilder(options),
        headers: headerBuilder(options),
      },
    )
    .then(response => ({ adapters: response.data.adapters }))
    .catch(handleErrors);
};

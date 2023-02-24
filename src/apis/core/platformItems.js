import axios from 'axios';
import { bundle } from '../../helpers';
import {
  handleErrors,
  headerBuilder,
  paramBuilder,
  validateOptions,
} from '../http';

export const fetchPlatformItem = options => {
  validateOptions('fetchPlatformItem', ['type', 'id'], options);

  const path =
    options.type === 'Space'
      ? `${bundle.apiLocation()}/space`
      : `${bundle.apiLocation()}/items/${options.type}/${options.id}`;

  const include =
    options.type === 'Form'
      ? 'kapp,kapp.space'
      : options.type === 'Kapp'
        ? 'space'
        : '';

  return (
    axios
      .get(path, {
        params: paramBuilder({ ...options, include }),
        headers: headerBuilder(options),
      })
      .then(response => ({
        platformItem:
          response.data.space || response.data.kapp || response.data.form,
      }))
      // Clean up any errors we receive. Make sure this the last thing so that it
      // cleans up any errors.
      .catch(handleErrors)
  );
};

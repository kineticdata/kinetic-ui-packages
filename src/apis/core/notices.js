import axios from 'axios';
import { bundle } from '../../helpers';
import { handleErrors, paramBuilder, headerBuilder } from '../http';

export const fetchNotices = (options = {}) => {
  return axios
    .get(bundle.apiLocation() + '/notices', {
      params: paramBuilder(options),
      headers: headerBuilder(options),
    })
    .then(response => ({ notices: response.data.notices }))
    .catch(handleErrors);
};

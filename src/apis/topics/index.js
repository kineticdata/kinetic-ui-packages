import axios from 'axios';
import { bundle } from '../../helpers';

const baseUrl = () => `${bundle.spaceLocation()}/app/topics`;

export const fetchTopicsVersion = () =>
  axios
    .request({
      url: `${baseUrl()}/api/v1/version`,
      method: 'get',
    })
    .then(response => response.data)
    .catch(response => ({ error: response }));

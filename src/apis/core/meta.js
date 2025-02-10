import axios from 'axios';
import { bundle } from '../../helpers';
import { handleErrors, headerBuilder } from '../http';

export const fetchLocales = () =>
  axios.get(`${bundle.apiLocation()}/meta/locales`);

export const fetchTimezones = () =>
  axios.get(`${bundle.apiLocation()}/meta/timezones`);

export const fetchSpaceWebhookEvents = (options = {}) =>
  axios
    .get(`${bundle.apiLocation()}/meta/webhooks/events/space`, {
      headers: headerBuilder(options),
    })
    .then(response => response.data)
    .catch(handleErrors);

export const fetchKappWebhookEvents = (options = {}) =>
  axios
    .get(`${bundle.apiLocation()}/meta/webhooks/events/kapp`, {
      headers: headerBuilder(options),
    })
    .then(response => response.data)
    .catch(handleErrors);

export const fetchSpaMeta = () =>
  axios
    .get(`${bundle.apiLocation()}/meta/spa`, {
      __bypassInitInterceptor: true,
      headers: {
        'X-Kinetic-ForcePreflight': 'ice-cream-cone',
      },
    })
    .then(response => response.data)
    .catch(handleErrors);

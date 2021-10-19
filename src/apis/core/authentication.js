import axios from 'axios';
import { bundle } from '../../helpers';
import { fetchProfile } from './profile';
import { handleErrors } from '../http';

export const login = ({ username, password }) =>
  axios
    .post(
      `${bundle.spaceLocation()}/app/login.do`,
      {
        j_username: username,
        j_password: password,
      },
      {
        __bypassAuthInterceptor: true,
      },
    )
    .catch(handleErrors);

export const logoutDirect = () =>
  axios.get(`${bundle.spaceLocation()}/app/logout`);

const checkedOrigin = process.env.REACT_APP_API_HOST
  ? process.env.REACT_APP_API_HOST
  : typeof window !== 'undefined'
    ? window.location.origin
    : null;

const clientId = process.env.REACT_APP_OAUTH_CLIENT_ID
  ? process.env.REACT_APP_OAUTH_CLIENT_ID
  : process.env.NODE_ENV === 'production'
    ? 'system'
    : 'system-dev';

export const retrieveJwt = () =>
  new Promise(resolve => {
    const iframe = document.createElement('iframe');
    iframe.src =
      bundle.spaceLocation() +
      '/app/oauth/authorize?grant_type=implicit&response_type=token&client_id=' +
      clientId;
    iframe.title = 'oauth jwt iframe';
    iframe.style.cssText = 'display: none';

    const listener = e => {
      if (e.origin === checkedOrigin && e.data.token) {
        window.removeEventListener('message', listener);
        document.body.removeChild(iframe);
        resolve(e.data.token);
      }
      if (e.origin === checkedOrigin && e.data.type === 'ping') {
        e.source.postMessage({ type: 'pong' }, e.origin);
      }
    };

    window.addEventListener('message', listener);
    document.body.appendChild(iframe);
  });

export const singleSignOn = (spaceSlug, dimensions, target = '_blank') =>
  new Promise(resolve => {
    const options = { ...dimensions, ...getPopupPosition(window, dimensions) };
    const endpoint =
      bundle.spaceLocation() + '/app/saml/login/alias/' + spaceSlug;
    const popup = window.open(endpoint, target, stringifyOptions(options));

    if (!popup) {
      resolve({
        error: 'Enterprise Sign In popup was blocked by the browser.',
      });
      return;
    }

    // Create an event handler that closes the popup window if we focus the
    // parent window
    const windowFocusHandler = () => {
      popup.close();
      window.removeEventListener('focus', windowFocusHandler);
    };
    window.addEventListener('focus', windowFocusHandler);

    // use a larger interval in dev mode because we are going to be checking
    // by making an ajax call
    const popupPollingInterval = 2000;
    let pollCounter = 30;

    // Check the status of the popup window. If closed or open for too long,
    // show error. Otherwise, check if profile is avilable to verify successful
    // authentication.
    const checkPopup = async () => {
      if (popup.closed) {
        resolve({ error: 'Enterprise Sign In was cancelled.' });
      } else if (await profileAvailable()) {
        popup.close();
        resolve({});
      } else {
        if (pollCounter > 0) {
          pollCounter--;
          setTimeout(checkPopup, popupPollingInterval);
        } else {
          popup.close();
          resolve({ error: 'Enterprise Sign In timed out.' });
        }
      }
    };

    // Start the recursive checkPopup calls.
    setTimeout(checkPopup, popupPollingInterval);
  });

// Checks to see if the user has been authenticated via SSO by checking if the
// profile endpoint successfully returns data.
const profileAvailable = async () =>
  new Promise(async resolve => {
    try {
      const result = await fetchProfile({ public: true });
      resolve(!!result.profile);
    } catch (e) {
      resolve(false);
    }
  });

// window.open takes a string of options rather than a JS object so we use this
// helper to do that conversion.
const stringifyOptions = options =>
  Object.keys(options)
    .reduce(
      (reduction, option) => [...reduction, `${option}=${options[option]}`],
      [],
    )
    .join(',');

// Given the dimensions of the popup and the parent window returns the correct
// position for the popup to be centered within the parent.
const getPopupPosition = (window, { width, height }) => ({
  top: window.screenY + window.innerHeight / 2 - height / 2,
  left: window.screenX + window.innerWidth / 2 - width / 2,
});

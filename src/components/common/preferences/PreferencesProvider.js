import { regHandlers } from '../../../reducer';
import { regSaga } from '../../../saga';
import { call, put, takeEvery, takeLatest } from 'redux-saga/effects';
import { action, dispatch, useSelector } from '../../../store';
import { useEffect, useMemo } from 'react';
import { Map } from 'immutable';
import { shallowEqual } from 'react-redux';
import { fetchUserPreferences, upsertUserPreference } from '../../../apis';

/**
 * Preferences are stored as key-value pairs, where both the key and value are
 * strings. These can be stored either in a browser session, or persisted in
 * the database. We can also set temporary preferences which are only stored in
 * redux, and thus will reset when the app is reloaded.
 *
 * This implementation expects that the key persisted in session or the db will
 * consist of a prefix and key(suffix) value, where both contain lowercase
 * alphanumeric characters and dashes, with no consecutive dashes. This
 * implementation then combines the two parts with a double dash to create the
 * full key. The reason for having the two parts is to allow us to group
 * preferences together by using the same prefix, which will make it easier to
 * retrieve groups of preferences.
 *
 * The value must be saves as a string. In order to use other datatypes, you
 * will need to convert the data when retrieving and updating preferences.
 *
 * Persisted preference examples:
 *  'kapp-forms-table--filterable': 'true'
 *  'kapp-forms-table--filters': '{"name": "A", "type": "Service"}'
 *  'workflow-table--columns': '["name", "event", "updatedAt"]'
 *
 * Retrieved preference structure (as stored in redux):
 *  {
 *    kapp-forms-table: {
 *      filterable: 'true',
 *      filters: '{"name": "A", "type": "Service"}'
 *    },
 *    workflow-table: {
 *      columns: '["name", "event", "updatedAt"]'
 *    }
 *  }
 */

regHandlers({
  INIT_PREFERENCES: state => state.set('preferences', Map()),
  LOAD_PREFERENCES: (state, { payload }) => state.set('preferences', payload),
  SET_PREFERENCE_PERSISTENT: (state, { payload: { prefix, key, value } }) =>
    state.setIn(['preferences', prefix, key], value),
  SET_PREFERENCE_SESSION: (state, { payload: { prefix, key, value } }) =>
    state.setIn(['preferences', prefix, key], value),
  SET_PREFERENCE_TEMP: (state, { payload: { prefix, key, value } }) =>
    state.setIn(['preferences', prefix, key], value),
});

regSaga(
  takeLatest('INIT_PREFERENCES', function*({ payload: loggedIn }) {
    // Get preferences from session storage
    let preferences = Map({ ...sessionStorage });
    if (loggedIn) {
      // If user is logged in, get their persisted preferences
      const persisted = yield call(fetchUserPreferences);

      if (persisted.userPreferences) {
        // Combine both preference lists
        preferences = preferences.merge(
          Object.fromEntries(
            persisted.userPreferences.map(({ key, value }) => [key, value]),
          ),
        );
      }
    }

    yield put(
      action(
        'LOAD_PREFERENCES',
        preferences
          // Split each key into a prefix and key(suffix), using an empty
          // string if a prefix is missing
          .mapKeys(key => {
            const keyArray = key.split(/--(.*)/);
            if (keyArray.length > 1) return keyArray.slice(0, 2);
            else if (keyArray.length === 1) return ['', keyArray[0]];
            else return ['', ''];
          })
          // Group the preferences by the prefix
          .groupBy((val, key) => key[0])
          // Update each group to change theirs keys to remove the prefix
          .map(val => val.mapKeys(key => key[1])),
      ),
    );
  }),
);

regSaga(
  takeEvery('SET_PREFERENCE_PERSISTENT', function*({
    payload: { prefix, key, value },
  }) {
    if (typeof value === 'string') {
      // Persist the preference in the database
      yield call(upsertUserPreference, {
        userPreference: {
          key: `${prefix}--${key}`,
          value,
        },
      });
    } else {
      console.error(
        `User preference values must be strings. The value for key '${key}' was of type '${typeof value}'.`,
      );
    }
  }),
);

regSaga(
  takeEvery('SET_PREFERENCE_SESSION', function*({
    payload: { prefix, key, value },
  }) {
    if (typeof value === 'string') {
      // Persist the preference in session storage
      yield call(
        [sessionStorage, sessionStorage.setItem],
        `${prefix}--${key}`,
        value,
      );
    } else {
      console.error(
        `User preference values must be strings. The value for key '${key}' was of type '${typeof value}'.`,
      );
    }
  }),
);

/**
 * Sets a preference value for a given prefix and key
 * @param {String} prefix The prefix part of the preference key.
 * @param {String} key The key(suffix) part of the preference key.
 * @param {String} value The value to store for the preference key.
 * @param {('persist'|'session'|'temp')} duration How long to store the
 *  preference for. Defaults to `session`.
 *  - `persist` will store it forever.
 *  - `session` will store it for the current browser session.
 *  - `temp` will store it for the current instance of the webpage.
 */
const setPreference = (prefix, key, value, duration) =>
  dispatch(
    duration === 'persist'
      ? 'SET_PREFERENCE_PERSISTENT'
      : duration === 'temp'
        ? 'SET_PREFERENCE_TEMP'
        : 'SET_PREFERENCE_SESSION',
    { prefix, key, value },
  );

/**
 * Generate a setter function for preferences with a given prefix.
 * @param prefix The prefix context to use for the returned updater function.
 *  Prefixes should be lowercase, alphanumeric and dashes only, and should not
 *  contain multiple consecutive dashes.
 * @returns {PreferenceUpdater}
 */
const setPreferenceForPrefix = prefix => (key, value, duration) =>
  dispatch(
    duration === 'persist'
      ? 'SET_PREFERENCE_PERSISTENT'
      : duration === 'temp'
        ? 'SET_PREFERENCE_TEMP'
        : 'SET_PREFERENCE_SESSION',
    { prefix, key, value },
  );

/**
 * @callback PreferenceUpdater
 * @param {String} key The key to update within the current prefix context.
 *  Keys should be lowercase, alphanumeric and dashes only, and should not
 *  contain multiple consecutive dashes.
 * @param {String} value The value to store for the preference key.
 * @param {('persist'|'session'|'temp')} duration How long to store the
 *  preference for. Defaults to `session`.
 *  - `persist` will store it forever.
 *  - `session` will store it for the current browser session.
 *  - `temp` will store it for the current instance of the webpage.
 */

/**
 * Hook for retrieving user preferences for a given prefix and getting an
 * update function.
 *
 * @param {String} prefix A prefix that defines a group of preferences to allow
 *  for fetching multiple at once. Prefixes should be lowercase, alphanumeric
 *  and dashes only, and should not contain multiple consecutive dashes.
 * @param {String|String[]|Function} [keys] Defines which keys for the given
 *  prefix to return. Providing a string returns the value for a single key.
 *  Providing an array returns a map of preferences matching the given keys.
 *  Providing a function allows you to extra whichever preferences you want and
 *  return them in any format. Keys should be lowercase, alphanumeric
 *  and dashes only, and should not contain multiple consecutive dashes.
 * @returns {[any,PreferenceUpdater]} Returns a tuple with the preferences as
 *  the first value, and an update function for updating the preference values.
 *  The update function takes a key, value, and optional duration parameter
 */
const usePreferences = (prefix = '', keys) => {
  const preferences = useSelector(state => {
    const prefixedPreferences = state.getIn(['preferences', prefix], Map());
    return typeof keys === 'function'
      ? keys(prefixedPreferences.toJS())
      : Array.isArray(keys)
        ? prefixedPreferences.filter((v, key) => keys.includes(key)).toJS()
        : typeof keys === 'string'
          ? prefixedPreferences.get(keys)
          : prefixedPreferences.toJS();
  }, shallowEqual);

  return useMemo(() => [preferences, setPreferenceForPrefix(prefix)], [
    preferences,
    prefix,
  ]);
};

/**
 * @param {String} value JSON string to parse into a JS object.
 * @param {Object} [defaultValue] Value to return if the `value` param isn't
 *  valid JSON.
 * @returns {Object}
 */
const fromJSONString = (value, defaultValue) => {
  try {
    return value && typeof value === 'string'
      ? JSON.parse(value)
      : defaultValue || null;
  } catch (e) {
    return defaultValue || null;
  }
};

/**
 * @param {Object} value JS object to convert into a JSON string.
 * @returns {String}
 */
const toJSONString = value => {
  try {
    return value && typeof value === 'object' ? JSON.stringify(value) : '';
  } catch (e) {
    return '';
  }
};

/**
 * @param {String} value Boolean string to parse into a boolean variable.
 * @param {boolean} [defaultValue] Value to return if the `value` param is empty.
 * @returns {boolean}
 */
const fromBooleanString = (value, defaultValue) =>
  value && typeof value === 'string'
    ? value?.toLowerCase() === 'true'
    : typeof defaultValue === 'boolean'
      ? defaultValue
      : null;

/**
 * @param {boolean} value Boolean variable to convert to a string.
 * @returns {string}
 */
const toBooleanString = value =>
  typeof value === 'boolean' ? (value ? 'true' : 'false') : '';

export { usePreferences, setPreference };

export const preferenceUtils = {
  fromJSONString,
  toJSONString,
  fromBooleanString,
  toBooleanString,
};

export const PreferencesProvider = ({ loggedIn, children }) => {
  useEffect(
    () => {
      dispatch('INIT_PREFERENCES', loggedIn);
    },
    [loggedIn],
  );

  return children;
};

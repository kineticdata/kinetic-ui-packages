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
 * alphanumeric characters and dashes. This implementation then combines the
 * two parts with 4 consecutive dashes (----) to create the full key. The
 * reason for having the two parts is to allow us to group preferences together
 * by using the same prefix, which will make it easier to retrieve groups of
 * preferences.
 *
 * The value must be saved as a string. In order to use other datatypes, you
 * will need to convert the data when retrieving and updating preferences.
 *
 * Persisted preference examples:
 *  'kapp-forms-table----filter-toggle': 'true'
 *  'kapp-forms-table----initial-filters': '{"name": "A", "type": "Service"}'
 *  'workflow-table----columns': '["name", "event", "updatedAt"]'
 *
 * Retrieved preference structure (as stored in redux):
 *  {
 *    kapp-forms-table: {
 *      'filter-toggle': 'true',
 *      'initial-filters': '{"name": "A", "type": "Service"}'
 *    },
 *    workflow-table: {
 *      'columns': '["name", "event", "updatedAt"]'
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
  takeLatest('INIT_PREFERENCES', function* ({ payload: loggedIn }) {
    // Create preferences map
    let preferences = Map();
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
    // Get preferences from session storage
    preferences = preferences.merge({ ...sessionStorage });

    yield put(
      action(
        'LOAD_PREFERENCES',
        preferences
          // Split each key into a prefix and key(suffix), using an empty
          // string if a prefix is missing
          .mapKeys(key => {
            const keyArray = key.split(/(.*)----/);
            if (keyArray.length > 1) return keyArray.slice(1, 3);
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
  takeEvery(
    'SET_PREFERENCE_PERSISTENT',
    function* ({ payload: { prefix, key, value } }) {
      if (typeof value === 'string') {
        // Persist the preference in the database
        yield call(upsertUserPreference, {
          userPreference: {
            key: `${prefix}----${key}`,
            value,
          },
        });
      } else {
        console.error(
          `User preference values must be strings. The value for key '${key}' was of type '${typeof value}'.`,
        );
      }
    },
  ),
);

regSaga(
  takeEvery(
    'SET_PREFERENCE_SESSION',
    function* ({ payload: { prefix, key, value } }) {
      if (typeof value === 'string') {
        // Persist the preference in session storage
        yield call(
          [sessionStorage, sessionStorage.setItem],
          `${prefix}----${key}`,
          value,
        );
      } else {
        console.error(
          `User preference values must be strings. The value for key '${key}' was of type '${typeof value}'.`,
        );
      }
    },
  ),
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
 * A class for defining a Preference record with getters and setters for
 * different data types.
 * @class
 * @property {string} prefix The prefix of the preference
 * @property {string} key The key of the preference
 * @property {string} value The value of the preference
 */
class Preference {
  #prefix;
  #key;
  #value;
  constructor(prefix, key, value) {
    this.#prefix = prefix;
    this.#key = key;
    this.#value = value;
    this.asBool = this.asBool.bind(this);
    this.asJSON = this.asJSON.bind(this);
    this.set = this.set.bind(this);
    this.setBool = this.setBool.bind(this);
    this.setJSON = this.setJSON.bind(this);
  }

  /**
   * Get the preference prefix
   * @returns {String}
   */
  get prefix() {
    return this.#prefix;
  }
  /**
   * Get the preference key
   * @returns {String}
   */
  get key() {
    return this.#key;
  }
  /**
   * Get the preference value as a string
   * @returns {String}
   */
  get value() {
    return this.#value;
  }

  /**
   * Get the preference value as a boolean, defaulting to the provided
   *  `defaultValue` if there is no preference set.
   * @param {boolean} [defaultValue]
   * @returns {boolean}
   */
  asBool(defaultValue) {
    return fromBooleanString(this.#value, defaultValue);
  }

  /**
   * Get the preference values as a JSON object, defaulting to the provided
   *  `defaultValue` if there is no preference set, or the set preference is
   *  not a valid JSON string
   * @param {Object} [defaultValue]
   * @returns {Object}
   */
  asJSON(defaultValue) {
    return fromJSONString(this.#value, defaultValue);
  }

  /**
   * Saves the provided value for this preference for the given duration
   * @param {string} value The value to save
   * @param {('persist'|'session'|'temp')} [duration] How long to save the
   *  preference for. Defaults to `session`.
   *  - `persist` will store it forever.
   *  - `session` will store it for the current browser session.
   *  - `temp` will store it for the current instance of the webpage.
   */
  set(value, duration) {
    setPreference(this.#prefix, this.#key, value, duration);
  }

  /**
   * Saves the provided boolean value for this preference for the given duration
   * @param {boolean} value The boolean value to save
   * @param {('persist'|'session'|'temp')} [duration] How long to save the
   *  preference for. Defaults to `session`.
   *  - `persist` will store it forever.
   *  - `session` will store it for the current browser session.
   *  - `temp` will store it for the current instance of the webpage.
   */
  setBool(value, duration) {
    setPreference(this.#prefix, this.#key, toBooleanString(value), duration);
  }

  /**
   * Saves the provided JSON value for this preference for the given duration
   * @param {Object} value The JSON value to save
   * @param {('persist'|'session'|'temp')} [duration] How long to save the
   *  preference for. Defaults to `session`.
   *  - `persist` will store it forever.
   *  - `session` will store it for the current browser session.
   *  - `temp` will store it for the current instance of the webpage.
   */
  setJSON(value, duration) {
    setPreference(this.#prefix, this.#key, toJSONString(value), duration);
  }
}

/**
 * Hook for retrieving user preferences for a given prefix.
 *
 * @param {String} prefix A prefix that defines a group of preferences to allow
 *  for fetching multiple related preferences at once. Prefixes should be
 *  lowercase, alphanumeric and dashes only, and should not contain multiple
 *  consecutive dashes.
 * @param {String[]} [keys] List of preference keys for the given prefix to
 *  return. Keys should be lowercase, alphanumeric and dashes only, and should
 *  not contain multiple consecutive dashes.
 * @returns {Object.<string,Preference>} Returns a map of preferences for the
 *  provided `keys`. Each preference is a class with getters and setters for
 *  various data types.
 */
const usePreferences = (prefix = '', keys) => {
  const preferences = useSelector(state => {
    const prefixPrefs = state.getIn(['preferences', prefix], Map());
    return Array.isArray(keys)
      ? keys.reduce(
          (prefs, key) => ({ ...prefs, [key]: prefixPrefs.get(key, '') }),
          {},
        )
      : prefixPrefs.toJS();
  }, shallowEqual);

  return useMemo(
    () =>
      Object.fromEntries(
        Object.entries(preferences).map(([key, value]) => [
          key,
          new Preference(prefix, key, value),
        ]),
      ),
    [preferences, prefix],
  );
};

export { usePreferences, setPreference };

export const PreferencesProvider = ({ loggedIn, children }) => {
  useEffect(() => {
    dispatch('INIT_PREFERENCES', loggedIn);
  }, [loggedIn]);

  return children;
};

/**
 * @param {String} value JSON string to parse into a JS object.
 * @param {Object} [defaultValue] Value to return if the `value` param isn't
 *  valid JSON.
 * @returns {Object}
 */
function fromJSONString(value, defaultValue) {
  try {
    return value && typeof value === 'string'
      ? JSON.parse(value)
      : defaultValue || null;
  } catch (e) {
    return defaultValue || null;
  }
}

/**
 * @param {Object} value JS object to convert into a JSON string.
 * @returns {String}
 */
function toJSONString(value) {
  try {
    return value && typeof value === 'object' ? JSON.stringify(value) : '';
  } catch (e) {
    return '';
  }
}

/**
 * @param {String} value Boolean string to parse into a boolean variable.
 * @param {boolean} [defaultValue] Value to return if the `value` param is empty.
 * @returns {boolean}
 */
function fromBooleanString(value, defaultValue) {
  return value && typeof value === 'string'
    ? value?.toLowerCase() === 'true'
    : typeof defaultValue === 'boolean'
      ? defaultValue
      : null;
}

/**
 * @param {boolean} value Boolean variable to convert to a string.
 * @returns {string}
 */
function toBooleanString(value) {
  return typeof value === 'boolean' ? (value ? 'true' : 'false') : '';
}

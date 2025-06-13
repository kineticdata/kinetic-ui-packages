# Preferences

Preferences are used within our consoles to save setting states for the user’s UI, so that things like filters or table sorting can be persisted throughout a session, or permanently until they are changed.

Preferences can be stored in 3 different ways:

- **Persistent** - Stored in the database. These will exist until the user changes them or resets their preferences.
- **Session** - Store in a browser’s session storage. These exist until the browser session ends.
- **Temporary** - Stored only in application state. These exist until the user reloads the web app.

Preferences are stored as key-value pairs, where both the key and value are strings. The keys allow only lowercase alphanumeric characters and dashes to ensure they are URL safe for compatibility with our API. The value must be stored as a string to ensure compatibility with our API and session storage, but you may store complex objects by converting them to JSON strings.

The `usePreferences` hook abstracts the key-value pattern, and uses a `prefix`, `key`, and `value`. This allows us to group a number of preferences with a prefix for easy retrieval.

```javascript
// The `usePreferences` hook accepts two parameters:
// 1: A prefix to group multiple preferences together for easy retrieval.
// 2: A list of keys within that prefix for the preferences you want.
const preferences = usePreferences('home-page', ['default-tab', 'show-tour']);
// The hook returns a map of Preference objects for each key provided.
const defaultTabPref = preferences['default-tab'];
const showTourPref = preferences['show-tour'];
```

Each `Preference` object gives you access to its value, as well as functions to get the value converted to a different format (Boolean of JSON).

```javascript
// Access the string value of the preference.
const defaultTab = defaultTabPref.value;
// Get the value of the preference converted to a boolean. The `asBoolean` function
// accepts a default boolean value to use if the preference doesn't exist.
const isDefaultTabOpen = defaultTabPref.asBoolean(defaultValue);
// Getthe value of the preference converted to a JSON object. The `asJSON` function
// accepts a default object value to use if the preference doesn't exist or isn't a
// valid JSON string.
const defaultTabSettings = defaultTabPref.asJSON(defaultValue);
```

Each `Preference` object also has functions for setting the preference value in the different supported formats so you don’t have to do the conversion to a string. The setter functions take the new value as the first parameter, and a duration string as the second parameter, which defines how long the preference will be stored for (`persist` to store permanently, `session` to store for the current session, `temp` to store for the current app instance – defaults to session).

```javascript
// Set the string value.
defaultTabPref.set(newValueString, duration);
// Set a boolean value which will be converted to a `true` or `false` string.
defaultTabPref.setBool(newValueBool, duration);
// Set a JSON Object value which will be stringified.
defaultTabPref.setJSON(newValueObject, duration);
```

## Preferences In Use

The below table lists all the preferences that are currently used within the application. The `${...}` syntax in the prefixes means the prefix is dynamic based on the provided value.

| Prefix                                                                                                                                                               | Key               | Type      | Duration  |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------- | --------- | --------- |
| **Attribute Definitions Table**                                                                                                                                      |                   |           |           |
| `space-attribute-definitions-${attributeType}-table`<br>`kapp-${kappSlug}-attribute-definitions-${attributeType}-table`                                              | `filter-toggle`   | `Boolean` | `persist` |
|                                                                                                                                                                      | `initial-filters` | `Object`  | `session` |
|                                                                                                                                                                      | `column-set`      | `Array`   | `persist` |
|                                                                                                                                                                      | `column-sort`     | `Object`  | `session` |
| **Categories Table**                                                                                                                                                 |                   |           |           |
| `kapp-${kappSlug}-categories-table`                                                                                                                                  | `filter-toggle`   | `Boolean` | `persist` |
|                                                                                                                                                                      | `initial-filters` | `Object`  | `session` |
|                                                                                                                                                                      | `column-set`      | `Array`   | `persist` |
|                                                                                                                                                                      | `column-sort`     | `Object`  | `session` |
| **Index Definitions Table**                                                                                                                                          |                   |           |           |
| `kapp-${kappSlug}-indexes-definitions-table`<br>`kapp-${kappSlug}-form-${formSlug}-indexes-definitions-table`<br>`kapp-${kappSlug}-shared-indexes-definitions-table` | `column-set`      | `Array`   | `persist` |
|                                                                                                                                                                      | `column-sort`     | `Object`  | `session` |
| **Index Fields Table**                                                                                                                                               |                   |           |           |
| `kapp-${kappSlug}-indexes-fields-table`                                                                                                                              | `column-set`      | `Array`   | `persist` |
|                                                                                                                                                                      | `column-sort`     | `Object`  | `session` |
| **Form Types Table**                                                                                                                                                 |                   |           |           |
| `kapp-${kappSlug}-form-types-table`                                                                                                                                  | `filter-toggle`   | `Boolean` | `persist` |
|                                                                                                                                                                      | `initial-filters` | `Object`  | `session` |
|                                                                                                                                                                      | `column-set`      | `Array`   | `persist` |
|                                                                                                                                                                      | `column-sort`     | `Object`  | `session` |
| **Forms Table**                                                                                                                                                      |                   |           |           |
| `kapp-${kappSlug}-forms-table`                                                                                                                                       | `filter-toggle`   | `Boolean` | `persist` |
|                                                                                                                                                                      | `initial-filters` | `Object`  | `session` |
|                                                                                                                                                                      | `column-set`      | `Array`   | `persist` |
|                                                                                                                                                                      | `column-sort`     | `Object`  | `session` |
| **Security Definitions Table**                                                                                                                                       |                   |           |           |
| `space-security-definitions-table`<br>`kapp-${kappSlug}-security-definitions-table`                                                                                  | `filter-toggle`   | `Boolean` | `persist` |
|                                                                                                                                                                      | `initial-filters` | `Object`  | `session` |
|                                                                                                                                                                      | `column-set`      | `Array`   | `persist` |
|                                                                                                                                                                      | `column-sort`     | `Object`  | `session` |
| **Submissions Table**                                                                                                                                                |                   |           |           |
| `kapp-${kappSlug}-submissions-table`<br>`kapp-${kappSlug}-form-${formSlug}-submissions-table`                                                                        | `initial-filters` | `Object`  | `session` |
|                                                                                                                                                                      | `column-set`      | `Object`  | `persist` |
| **Workflow New Node Tasks List**                                                                                                                                     |                   |           |           |
| `workflow-tasks-list`                                                                                                                                                | `initial-tab`     | `String`  | `session` |
|                                                                                                                                                                      | `list-sort`       | `String`  | `session` |
|                                                                                                                                                                      | `recents`         | `Array`   | `persist` |
|                                                                                                                                                                      | `favorites`       | `Array`   | `persist` |
| **Webhooks Table**                                                                                                                                                   |                   |           |           |
| `space-webhooks-table`<br>`kapp-${kappSlug}-webhooks-table`                                                                                                          | `filter-toggle`   | `Boolean` | `persist` |
|                                                                                                                                                                      | `initial-filters` | `Object`  | `session` |
|                                                                                                                                                                      | `column-set`      | `Array`   | `persist` |
|                                                                                                                                                                      | `column-sort`     | `Object`  | `session` |

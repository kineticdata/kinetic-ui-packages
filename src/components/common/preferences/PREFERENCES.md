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

The below tables list all the preferences that are currently used within the application. The `${...}` syntax in the prefixes means the prefix is dynamic based on the provided value.

### Table Preferences

All tables have (mostly) identical preferences that are saved for them. This first table below shows what those preferences are, and the second table below shows the prefixes that use those preferences.

**Table Preference Keys**

| Key               | Type     | Duration  |
| ----------------- | -------- | --------- |
| `initial-filters` | `Object` | `session` |
| `column-set`      | `Array`  | `persist` |
| `column-sort`     | `Object` | `session` |

**Table Preference Prefixes**

| Prefix                                                          | Comments                      |
| --------------------------------------------------------------- | ----------------------------- |
| **Agent Handlers Table**                                        |                               |
| `space-plugins-agent-handlers-table`                            |                               |
| **Attribute Definitions Table**                                 |                               |
| `space-attribute-definitions-${attributeType}-table`            |                               |
| `kapp-${kappSlug}-attribute-definitions-${attributeType}-table` |                               |
| **Bridges Table**                                               |                               |
| `space-plugins-bridges-table`                                   |                               |
| **Categories Table**                                            |                               |
| `kapp-${kappSlug}-categories-table`                             |                               |
| **Connections Table**                                           |                               |
| `space-plugins-connections-table`                               |                               |
| **Errors Table**                                                |                               |
| `space-activity-errors-table`                                   |                               |
| **Index Definitions Table**                                     | Doesn't use `initial-filters` |
| `kapp-${kappSlug}-indexes-definitions-table`                    |                               |
| `kapp-${kappSlug}-form-${formSlug}-indexes-definitions-table`   |                               |
| `kapp-${kappSlug}-shared-indexes-definitions-table`             |                               |
| **Index Fields Table**                                          | Doesn't use `initial-filters` |
| `kapp-${kappSlug}-indexes-fields-table`                         |                               |
| **File Resources Table**                                        |                               |
| `space-file-resource-table`                                     |                               |
| **Form Types Table**                                            |                               |
| `kapp-${kappSlug}-form-types-table`                             |                               |
| **Filestores Table**                                            |                               |
| `space-plugins-filestores-table`                                |                               |
| **Forms Table**                                                 |                               |
| `kapp-${kappSlug}-forms-table`                                  |                               |
| **Handlers Table**                                              |                               |
| `space-plugins-handlers-table`                                  |                               |
| **Kapps Table**                                                 |                               |
| `space-kapps-table`                                             |                               |
| **Logs Table**                                                  | Doesn't use `column-sort`     |
| `space-logs-table`                                              |                               |
| **Missing Handler Usage Table**                                 |                               |
| `space-missing-handler-usage-table`                             |                               |
| **Missing Routine Usage Table**                                 |                               |
| `space-missing-routine-usage-table`                             |                               |
| **Models Table**                                                |                               |
| `space-bridge-model-table`                                      |                               |
| **Kapp Integrations Table**                                     |                               |
| `kapp-${kappSlug}-integrations-table`                           |                               |
| **Operations Table**                                            |                               |
| `space-plugins-operations-table`                                |                               |
| **Routines Table**                                              |                               |
| `space-workflow-routines-table`                                 |                               |
| **Runs Table**                                                  |                               |
| `space-activity-runs-table`                                     |                               |
| **Security Definitions Table**                                  |                               |
| `space-security-definitions-table`                              |                               |
| `kapp-${kappSlug}-security-definitions-table`                   |                               |
| **Sources Table**                                               |                               |
| `space-plugins-sources-table`                                   |                               |
| **Submissions Table**                                           | Doesn't use `column-sort`     |
| `kapp-${kappSlug}-submissions-table`                            |                               |
| `kapp-${kappSlug}-form-${formSlug}-submissions-table`           |                               |
| **System Errors Table**                                         |                               |
| `space-workflow-system-errors-table`                            |                               |
| **Teams Table**                                                 |                               |
| `space-teams-table`                                             |                               |
| **Translation Contexts Table**                                  |                               |
| `space-translations-contexts-table`                             |                               |
| **Translations Shared Table**                                   |                               |
| `space-translations-shared-table`                               |                               |
| **Translations Staged Table**                                   |                               |
| `space-translations-staged-table`                               |                               |
| **Trees Table**                                                 |                               |
| `space-workflow-trees-table`                                    |                               |
| **Triggers Table**                                              |                               |
| `space-${triggerStatus}-activity-triggers-table`                |                               |
| **Users Table**                                                 |                               |
| `space-users-table`                                             |                               |
| **WebAPIs Table**                                               |                               |
| `space-workflow-webapi-table`                                   |                               |
| `kapp-${kappSlug}-workflow-webapi-table`                        |                               |
| **Webhook Jobs Table**                                          |                               |
| `space-activity-webhook-jobs-table`                             |                               |
| `kapp-${kappSlug}-activity-webhook-jobs-table`                  |                               |
| **Webhooks Table**                                              |                               |
| `space-webhooks-table`                                          |                               |
| `kapp-${kappSlug}-webhooks-table`                               |                               |
| **Workflows Table**                                             |                               |
| `space-workflow-table`                                          |                               |
| `kapp-${kappSlug}-workflow-table`                               |                               |
| `kapp-${kappSlug}-form-${formSlug}-workflow-table`              |                               |

### Other Preferences

The below table lists other preferences used within the app.

| Prefix                           | Key           | Type     | Duration  |
| -------------------------------- | ------------- | -------- | --------- |
| **Workflow New Node Tasks List** |               |          |           |
| `workflow-tasks-list`            | `initial-tab` | `String` | `session` |
|                                  | `list-sort`   | `String` | `session` |
|                                  | `recents`     | `Array`  | `persist` |
|                                  | `favorites`   | `Array`  | `persist` |

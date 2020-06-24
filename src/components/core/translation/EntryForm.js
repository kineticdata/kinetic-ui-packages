import { generateForm } from '../../form/Form';
import {
  fetchEnabledLocales,
  fetchContexts,
  fetchContextKeys,
  upsertTranslations,
} from '../../../apis';
import { Map, List } from 'immutable';

const dataSources = ({ contextName, keyHash }) => ({
  contexts: {
    fn: fetchContexts,
    params: () => [{ expected: true }],
    transform: result => result.contexts,
  },
  keys: {
    fn: fetchContextKeys,
    params: () => [{ contextName: contextName ? contextName : 'shared' }],
    transform: result =>
      keyHash ? result.keys.filter(k => k.hash === keyHash) : List(),
  },
  locales: {
    fn: fetchEnabledLocales,
    params: [{ include: 'authorization,details' }],
    transform: result => result.locales,
  },
});

const handleSubmit = ({ contextName }) => values =>
  new Promise((resolve, reject) => {
    const translation = values.toJS();
    upsertTranslations({ translation }).then(({ message, error }) => {
      if (message) {
        resolve(message); // needs fix
      } else {
        reject(error || 'There was an error saving the entry');
      }
    });
  });

const fields = ({ locale, contextName, keyHash }) => ({
  contexts,
  keys,
  locales,
}) => {
  return (
    contexts &&
    keys &&
    locales && [
      {
        name: 'context',
        label: 'Context',
        type: 'text',
        required: true,
        initialValue: contextName && contextName,
        enabled: !contextName,
        options: ({ contexts }) =>
          contexts &&
          contexts.map(con => {
            return Map({
              value: con.get('name'),
              label: con.get('name'),
            });
          }),
      },
      {
        name: 'locale',
        label: 'Locale',
        type: 'text',
        required: true,
        initialValue: locale && locale,
        enabled: !locale,
        options: ({ locales }) =>
          locales &&
          locales.map(loc => {
            return Map({
              value: loc.get('code'),
              label: loc.get('code'),
            });
          }),
      },
      {
        name: 'key',
        label: 'Key',
        type: 'text',
        enabled: !keyHash,
        initialValue: keys && keys.get(0) && keys.get(0).get('name'),
        required: true,
      },
      {
        name: 'value',
        label: 'Value',
        type: 'text',
        required: true,
      },
    ]
  );
};

export const EntryForm = generateForm({
  formOptions: ['tab', 'locale', 'contextName', 'keyHash'],
  dataSources,
  fields,
  handleSubmit,
});

EntryForm.displayName = 'EntryForm';

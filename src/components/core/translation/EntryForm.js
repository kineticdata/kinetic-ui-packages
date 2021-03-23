import { generateForm } from '../../form/Form';
import {
  fetchEnabledLocales,
  fetchContexts,
  fetchContextKeys,
  upsertTranslations,
  fetchTranslations,
} from '../../../apis';
import { Map, List } from 'immutable';
import { handleFormErrors } from '../../form/Form.helpers';

const dataSources = ({ contextName, keyHash, locale }) => ({
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
  entry: {
    fn: fetchTranslations,
    params: () =>
      contextName && keyHash && locale && [{ contextName, localeCode: locale }],
    transform: result => {
      const currentEntry = result.entries.find(
        entry => entry.keyHash === keyHash,
      );
      return currentEntry ? currentEntry.value : '';
    },
  },
});

const handleSubmit = () => values => {
  const translation = values.toJS();
  return upsertTranslations({ translation }).then(
    handleFormErrors('message', 'There was an error saving the Entry.'),
  );
};

const fields = ({ locale, contextName, keyHash }) => ({
  contexts,
  keys,
  locales,
  entry,
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
        initialValue: entry ? entry : '',
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

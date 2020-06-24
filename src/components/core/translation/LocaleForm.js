import { List, Map } from 'immutable';
import { generateForm } from '../../form/Form';
import { fetchAvailableLocales, enableLocale } from '../../../apis';

const dataSources = () => ({
  locales: {
    fn: fetchAvailableLocales,
    params: [],
    transform: result => result.locales,
  },
});

const handleSubmit = () => values => {
  const localeCode = values.toJS();
  return enableLocale({ localeCode: localeCode.code });
};

const fields = () => () => [
  {
    name: 'code',
    label: 'Locale',
    type: 'text',
    options: ({ locales }) =>
      locales
        ? locales.map(locale =>
            Map({
              value: locale.get('code'),
              label: locale.get('name'),
            }),
          )
        : List(),
  },
];

export const LocaleForm = generateForm({
  dataSources,
  fields,
  handleSubmit,
});

LocaleForm.displayName = 'LocaleForm';

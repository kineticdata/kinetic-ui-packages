import React from 'react';
import { Map } from 'immutable';
import { bundle } from '../../../helpers';
import { I18nContext } from './I18nContext';
import { fetchTranslations } from '../../../apis/core/translations';

export class I18nProvider extends React.Component {
  constructor(props) {
    super(props);
    this.state = { translations: Map() };
    this.loading = Map();
    // this effectively enables translations for the CE client-side code
    bundle.config = bundle.config || {};
    bundle.config.translations = bundle.config.translations || {};
  }

  componentDidMount() {
    if (this.props.locale) {
      this.loadTranslations(this.props.locale, 'shared', true);
    }
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevProps.locale !== this.props.locale) {
      this.loadTranslations(this.props.locale, 'shared', true);
    }
    if (
      !this.state.translations.equals(prevState.translations) &&
      this.state.translations.get(this.props.locale) &&
      bundle.config
    ) {
      this.populateBundleTranslations(this.props.locale);
    }
  }

  populateBundleTranslations = locale => {
    bundle.config.translations = {
      ...bundle.config.translations,
      ...this.state.translations.get(locale).toJS(),
    };
  };

  loadTranslations = (locale, context, isPublic) => {
    if (!this.loading.hasIn([locale, context])) {
      this.loading = this.loading.setIn([locale, context], true);
      // check to see if the translation context was already loaded by the CE
      // client-side code (like if K.load is used in a form event)
      fetchTranslations({
        cache: true,
        contextName: context,
        localeCode: locale,
        public: isPublic,
      }).then(({ error, entries }) => {
        if (entries) {
          this.setState(state => ({
            translations: state.translations.setIn(
              [locale, context],
              Map(entries.map(entry => [entry.key, entry.value])),
            ),
          }));
        } else {
          this.setState(state => ({
            translations: state.translations.setIn([locale, context], Map()),
          }));
        }
      });
    } else {
      // If the context is already loaded for the locale but we're loading due
      // to the locale changing then we need to populate the bundle's translation
      // config from the already-loaded translations.
      this.populateBundleTranslations(locale);
    }
  };

  render() {
    if (this.state.translations) {
      return (
        <I18nContext.Provider
          value={{
            context: this.props.context || 'shared',
            locale: this.props.locale || 'en',
            translations: this.state.translations,
            loadTranslations: this.loadTranslations,
          }}
        >
          {this.props.children}
        </I18nContext.Provider>
      );
    } else {
      return null;
    }
  }
}

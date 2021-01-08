import React from 'react';
import { Map, Set } from 'immutable';
import isarray from 'isarray';
import { fetchSubmission } from '../../../apis';
import { I18nContext } from './I18nContext';

const submissionContexts = {};
export class I18n extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: !!props.submissionId,
      context: props.context,
    };
  }

  componentDidMount() {
    if (this.state.loading) {
      // If submissionId is passed in, we need to fetch the submission to build the context
      if (this.props.submissionId) {
        // If submission was already fetched, use previous result
        if (submissionContexts.hasOwnProperty(this.props.submissionId)) {
          this.setState(state => ({
            loading: false,
            context:
              submissionContexts[this.props.submissionId] || this.state.context,
          }));
        } else {
          // Otherwise fetch the submission
          fetchSubmission({
            id: this.props.submissionId,
            datastore: !!this.props.datastore,
            include: 'form,form.kapp',
          }).then(({ submission }) => {
            // Build context using submission data
            const context = submission
              ? !submission.form.kapp.slug
                ? `forms.${submission.form.slug}`
                : `kapps.${submission.form.kapp.slug}.forms.${
                    submission.form.slug
                  }`
              : null;
            // Store the context for the submissionId
            submissionContexts[this.props.submissionId] = context;
            // Update loading state to false and set correct context
            this.setState(state => ({
              loading: false,
              context: context || this.state.context,
            }));
          });
        }
      } else {
        this.setState(state => ({
          ...state,
          loading: false,
        }));
      }
    }
  }

  render() {
    return !this.state.loading ? (
      <I18nContext.Consumer>
        {({ context, locale, translations, loadTranslations }) => {
          // If render funtion is passed, or children is a string or array of strings,
          // return the translation of the children string
          if (
            typeof this.props.render === 'function' ||
            typeof this.props.children === 'string' ||
            (isarray(this.props.children) &&
              this.props.children.every(c => typeof c === 'string'))
          ) {
            return (
              <I18nTranslate
                context={this.state.context || context}
                locale={locale}
                translations={translations}
                loadTranslations={loadTranslations}
                public={this.props.public}
                render={this.props.render}
              >
                {this.props.children}
              </I18nTranslate>
            );
          }
          // Otherwise wrap children in a new instance of I18nProvider with the new context
          else if (this.state.context) {
            return (
              <I18nContext.Provider
                value={{
                  context: this.state.context,
                  locale: locale,
                  translations: translations,
                  loadTranslations: loadTranslations,
                }}
              >
                <I18nTranslate
                  context={this.state.context}
                  locale={locale}
                  translations={translations}
                  loadTranslations={loadTranslations}
                  public={this.props.public}
                >
                  {this.props.children}
                </I18nTranslate>
              </I18nContext.Provider>
            );
          }
          // Otherwise return children
          else {
            return this.props.children;
          }
        }}
      </I18nContext.Consumer>
    ) : null;
  }
}

export class I18nTranslate extends React.Component {
  componentDidMount() {
    this.props.loadTranslations(
      this.props.locale,
      this.props.context,
      this.props.public,
    );
  }

  componentDidUpdate(prevProps) {
    if (
      this.props.context !== prevProps.context ||
      this.props.locale !== prevProps.locale
    ) {
      this.props.loadTranslations(
        this.props.locale,
        this.props.context,
        this.props.public,
      );
    }
  }

  render() {
    if (
      this.props.translations.hasIn([this.props.locale, this.props.context])
    ) {
      if (typeof this.props.render === 'function') {
        return this.props.render(translate(this.props));
      } else if (typeof this.props.children === 'string') {
        return translate(this.props)(this.props.children);
      } else if (
        isarray(this.props.children) &&
        this.props.children.every(c => typeof c === 'string')
      ) {
        return translate(this.props)(this.props.children.join(''));
      } else {
        return this.props.children;
      }
    } else {
      //TODO:I changed this because translations doesn't exist in the SPUI yet.
      return typeof this.props.children === 'string'
        ? this.props.children
        : null;
    }
  }
}

const translate = ({ context, locale, translations }) => key => {
  trackKeys(context, key);
  if (window.highlightTranslations) {
    // Surround translated text with asterisks to easily see what's wrapped
    return `*${translations.getIn([locale, context, key]) ||
      translations.getIn([locale, 'shared', key]) ||
      key}*`;
  } else {
    return (
      translations.getIn([locale, context, key]) ||
      translations.getIn([locale, 'shared', key]) ||
      key
    );
  }
};

let trackedKeys = Map();
const trackKeys = (context, key) => {
  trackedKeys = trackedKeys.has(key)
    ? trackedKeys.set(key, trackedKeys.get(key).add(context))
    : trackedKeys.set(key, Set([context]));
  window.bundle = window.bundle || {};
  window.bundle.config = window.bundle.config || {};
  window.bundle.config.translationKeys = trackedKeys.toJS();
};

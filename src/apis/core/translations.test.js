import axios from 'axios';
import createError from 'axios/lib/core/createError';
import {
  fetchAvailableLocales,
  clearTranslationsCache,
  fetchStagedTranslations,
  fetchDefaultLocale,
  setDefaultLocale,
  fetchEnabledLocales,
  enableLocale,
  disableLocale,
  fetchContexts,
  createContext,
  updateContext,
  deleteContext,
  fetchContextKeys,
  updateContextKey,
  fetchTranslations,
  upsertTranslations,
  deleteTranslations,
} from './translations';

jest.mock('axios');

// Mock out the bundle object from a dependency.
jest.mock('../../helpers', () => ({
  bundle: {
    apiLocation: () => 'space/app/api/v1',
  },
}));

describe('translations api', () => {
  describe('fetchAvailableLocales', () => {
    beforeEach(() => {
      axios.get.mockReset();
    });

    test('success fetch', async () => {
      axios.get.mockResolvedValue({
        status: 200,
        data: {
          locales: [{}, {}],
        },
      });
      const result = await fetchAvailableLocales();
      expect(axios.get.mock.calls).toEqual([
        [
          'space/app/api/v1/meta/locales',
          { params: {}, headers: { 'X-Kinetic-AuthAssumed': 'true' } },
        ],
      ]);
      expect(result).toEqual({
        locales: [{}, {}],
      });
    });

    test('success fetch localized', async () => {
      axios.get.mockResolvedValue({
        status: 200,
        data: {
          locales: [{}, {}],
        },
      });
      const result = await fetchAvailableLocales({ localeCode: 'en' });
      expect(axios.get.mock.calls).toEqual([
        [
          'space/app/api/v1/meta/locales',
          {
            params: { localized: 'en' },
            headers: { 'X-Kinetic-AuthAssumed': 'true' },
          },
        ],
      ]);
      expect(result).toEqual({
        locales: [{}, {}],
      });
    });

    test('forbidden', async () => {
      axios.get.mockRejectedValue(
        createError('Request failed with status code 403', null, 403, null, {
          status: 403,
          statusText: 'Forbidden',
        }),
      );
      const result = await fetchAvailableLocales();
      expect(axios.get.mock.calls).toEqual([
        [
          'space/app/api/v1/meta/locales',
          { params: {}, headers: { 'X-Kinetic-AuthAssumed': 'true' } },
        ],
      ]);
      expect(result).toEqual({
        error: {
          forbidden: true,
          statusCode: 403,
          key: null,
          message: 'Forbidden',
        },
      });
    });
  });

  describe('clearTranslationsCache', () => {
    beforeEach(() => {
      axios.delete.mockReset();
    });

    test('success clear', async () => {
      axios.delete.mockResolvedValue({
        status: 200,
        data: {
          message: 'success',
        },
      });
      const result = await clearTranslationsCache();
      expect(axios.delete.mock.calls).toEqual([
        [
          'space/app/api/v1/translations/cache',
          { params: {}, headers: { 'X-Kinetic-AuthAssumed': 'true' } },
        ],
      ]);
      expect(result).toEqual({
        message: 'success',
      });
    });

    test('forbidden', async () => {
      axios.delete.mockRejectedValue(
        createError('Request failed with status code 403', null, 403, null, {
          status: 403,
          statusText: 'Forbidden',
        }),
      );
      const result = await clearTranslationsCache();
      expect(axios.delete.mock.calls).toEqual([
        [
          'space/app/api/v1/translations/cache',
          { params: {}, headers: { 'X-Kinetic-AuthAssumed': 'true' } },
        ],
      ]);
      expect(result).toEqual({
        error: {
          forbidden: true,
          statusCode: 403,
          key: null,
          message: 'Forbidden',
        },
      });
    });
  });

  describe('fetchStagedTranslations', () => {
    beforeEach(() => {
      axios.get.mockReset();
    });

    test('success all staged translations', async () => {
      axios.get.mockResolvedValue({
        status: 200,
        data: { changes: [{}, {}] },
      });
      const result = await fetchStagedTranslations();
      expect(axios.get.mock.calls).toEqual([
        [
          'space/app/api/v1/translations/staged',
          { params: {}, headers: { 'X-Kinetic-AuthAssumed': 'true' } },
        ],
      ]);
      expect(result).toEqual({
        changes: [{}, {}],
      });
    });

    test('success staged translations by contexts', async () => {
      axios.get.mockResolvedValue({
        status: 200,
        data: { changes: [{}, {}] },
      });
      const result = await fetchStagedTranslations({
        contextName: 'custom.test',
      });
      expect(axios.get.mock.calls).toEqual([
        [
          'space/app/api/v1/translations/staged',
          {
            params: { context: 'custom.test' },
            headers: { 'X-Kinetic-AuthAssumed': 'true' },
          },
        ],
      ]);
      expect(result).toEqual({
        changes: [{}, {}],
      });
    });

    test('forbidden', async () => {
      axios.get.mockRejectedValue(
        createError('Request failed with status code 403', null, 403, null, {
          status: 403,
          statusText: 'Forbidden',
        }),
      );
      const result = await fetchStagedTranslations();
      expect(axios.get.mock.calls).toEqual([
        [
          'space/app/api/v1/translations/staged',
          { params: {}, headers: { 'X-Kinetic-AuthAssumed': 'true' } },
        ],
      ]);
      expect(result).toEqual({
        error: {
          forbidden: true,
          statusCode: 403,
          key: null,
          message: 'Forbidden',
        },
      });
    });
  });

  describe('fetchDefaultLocale', () => {
    beforeEach(() => {
      axios.get.mockReset();
    });

    test('success fetch', async () => {
      axios.get.mockResolvedValue({
        status: 200,
        data: {
          defaultLocale: { code: 'en' },
        },
      });
      const result = await fetchDefaultLocale();
      expect(axios.get.mock.calls).toEqual([
        [
          'space/app/api/v1/translations/settings/defaultLocale',
          { params: {}, headers: { 'X-Kinetic-AuthAssumed': 'true' } },
        ],
      ]);
      expect(result).toEqual({
        defaultLocale: { code: 'en' },
      });
    });

    test('forbidden', async () => {
      axios.get.mockRejectedValue(
        createError('Request failed with status code 403', null, 403, null, {
          status: 403,
          statusText: 'Forbidden',
        }),
      );
      const result = await fetchDefaultLocale();
      expect(axios.get.mock.calls).toEqual([
        [
          'space/app/api/v1/translations/settings/defaultLocale',
          { params: {}, headers: { 'X-Kinetic-AuthAssumed': 'true' } },
        ],
      ]);
      expect(result).toEqual({
        error: {
          forbidden: true,
          statusCode: 403,
          key: null,
          message: 'Forbidden',
        },
      });
    });
  });

  describe('setDefaultLocale', () => {
    beforeEach(() => {
      axios.put.mockReset();
    });

    test('success set', async () => {
      axios.put.mockResolvedValue({
        status: 200,
        data: {
          defaultLocale: { code: 'en' },
        },
      });
      const result = await setDefaultLocale({ localeCode: 'en' });
      expect(axios.put.mock.calls).toEqual([
        [
          'space/app/api/v1/translations/settings/defaultLocale',
          { code: 'en' },
          { params: {}, headers: { 'X-Kinetic-AuthAssumed': 'true' } },
        ],
      ]);
      expect(result).toEqual({
        defaultLocale: { code: 'en' },
      });
    });

    test('missing localeCode', () => {
      expect(() => {
        setDefaultLocale({});
      }).toThrowError(
        'setDefaultLocale failed! The following required options are missing: localeCode',
      );
    });

    test('forbidden', async () => {
      axios.put.mockRejectedValue(
        createError('Request failed with status code 403', null, 403, null, {
          status: 403,
          statusText: 'Forbidden',
        }),
      );
      const result = await setDefaultLocale({ localeCode: 'en' });
      expect(axios.put.mock.calls).toEqual([
        [
          'space/app/api/v1/translations/settings/defaultLocale',
          { code: 'en' },
          { params: {}, headers: { 'X-Kinetic-AuthAssumed': 'true' } },
        ],
      ]);
      expect(result).toEqual({
        error: {
          forbidden: true,
          statusCode: 403,
          key: null,
          message: 'Forbidden',
        },
      });
    });
  });

  describe('fetchEnabledLocales', () => {
    beforeEach(() => {
      axios.get.mockReset();
    });

    test('success fetch', async () => {
      axios.get.mockResolvedValue({
        status: 200,
        data: {
          locales: [{}, {}],
        },
      });
      const result = await fetchEnabledLocales();
      expect(axios.get.mock.calls).toEqual([
        [
          'space/app/api/v1/translations/settings/locales',
          { params: {}, headers: { 'X-Kinetic-AuthAssumed': 'true' } },
        ],
      ]);
      expect(result).toEqual({
        locales: [{}, {}],
      });
    });

    test('forbidden', async () => {
      axios.get.mockRejectedValue(
        createError('Request failed with status code 403', null, 403, null, {
          status: 403,
          statusText: 'Forbidden',
        }),
      );
      const result = await fetchEnabledLocales();
      expect(axios.get.mock.calls).toEqual([
        [
          'space/app/api/v1/translations/settings/locales',
          { params: {}, headers: { 'X-Kinetic-AuthAssumed': 'true' } },
        ],
      ]);
      expect(result).toEqual({
        error: {
          forbidden: true,
          statusCode: 403,
          key: null,
          message: 'Forbidden',
        },
      });
    });
  });

  describe('enableLocale', () => {
    beforeEach(() => {
      axios.post.mockReset();
    });

    test('success enable locale', async () => {
      axios.post.mockResolvedValue({
        status: 200,
        data: {
          locale: { code: 'en' },
        },
      });
      const result = await enableLocale({ localeCode: 'en' });
      expect(axios.post.mock.calls).toEqual([
        [
          'space/app/api/v1/translations/settings/locales',
          { code: 'en' },
          { params: {}, headers: { 'X-Kinetic-AuthAssumed': 'true' } },
        ],
      ]);
      expect(result).toEqual({
        locale: { code: 'en' },
      });
    });

    test('missing localeCode', () => {
      expect(() => {
        enableLocale({});
      }).toThrowError(
        'enableLocale failed! The following required options are missing: localeCode',
      );
    });

    test('forbidden', async () => {
      axios.post.mockRejectedValue(
        createError('Request failed with status code 403', null, 403, null, {
          status: 403,
          statusText: 'Forbidden',
        }),
      );
      const result = await enableLocale({ localeCode: 'en' });
      expect(axios.post.mock.calls).toEqual([
        [
          'space/app/api/v1/translations/settings/locales',
          { code: 'en' },
          { params: {}, headers: { 'X-Kinetic-AuthAssumed': 'true' } },
        ],
      ]);
      expect(result).toEqual({
        error: {
          forbidden: true,
          statusCode: 403,
          key: null,
          message: 'Forbidden',
        },
      });
    });
  });

  describe('disableLocale', () => {
    beforeEach(() => {
      axios.delete.mockReset();
    });

    test('success disable locale', async () => {
      axios.delete.mockResolvedValue({
        status: 200,
        data: {
          locale: { code: 'en' },
        },
      });
      const result = await disableLocale({ localeCode: 'en' });
      expect(axios.delete.mock.calls).toEqual([
        [
          'space/app/api/v1/translations/settings/locales/en',
          { params: {}, headers: { 'X-Kinetic-AuthAssumed': 'true' } },
        ],
      ]);
      expect(result).toEqual({
        locale: { code: 'en' },
      });
    });

    test('missing localeCode', () => {
      expect(() => {
        disableLocale({});
      }).toThrowError(
        'disableLocale failed! The following required options are missing: localeCode',
      );
    });

    test('forbidden', async () => {
      axios.delete.mockRejectedValue(
        createError('Request failed with status code 403', null, 403, null, {
          status: 403,
          statusText: 'Forbidden',
        }),
      );
      const result = await disableLocale({ localeCode: 'en' });
      expect(axios.delete.mock.calls).toEqual([
        [
          'space/app/api/v1/translations/settings/locales/en',
          { params: {}, headers: { 'X-Kinetic-AuthAssumed': 'true' } },
        ],
      ]);
      expect(result).toEqual({
        error: {
          forbidden: true,
          statusCode: 403,
          key: null,
          message: 'Forbidden',
        },
      });
    });
  });

  describe('fetchContexts', () => {
    beforeEach(() => {
      axios.get.mockReset();
    });

    test('success fetch custom', async () => {
      axios.get.mockResolvedValue({
        status: 200,
        data: {
          contexts: [{ name: 'custom.foo' }],
        },
      });
      const result = await fetchContexts({ custom: true });
      expect(axios.get.mock.calls).toEqual([
        [
          'space/app/api/v1/translations/contexts',
          {
            params: { custom: true },
            headers: { 'X-Kinetic-AuthAssumed': 'true' },
          },
        ],
      ]);
      expect(result).toEqual({
        contexts: [{ name: 'custom.foo', kapp: null, form: null }],
      });
    });

    test('success fetch expected', async () => {
      axios.get.mockResolvedValue({
        status: 200,
        data: {
          contexts: [
            { name: 'custom.foo' },
            { name: 'kapps.kappSlug.forms.formSlug' },
            { name: 'datastore.forms.formSlug' },
          ],
        },
      });
      const result = await fetchContexts({ expected: true });
      expect(axios.get.mock.calls).toEqual([
        [
          'space/app/api/v1/translations/contexts',
          {
            params: { expected: true },
            headers: { 'X-Kinetic-AuthAssumed': 'true' },
          },
        ],
      ]);
      expect(result).toEqual({
        contexts: [
          { name: 'custom.foo', kapp: null, form: null },
          {
            name: 'kapps.kappSlug.forms.formSlug',
            kapp: 'kappSlug',
            form: 'formSlug',
          },
          { name: 'datastore.forms.formSlug', kapp: null, form: 'formSlug' },
        ],
      });
    });

    test('success fetch unexpected', async () => {
      axios.get.mockResolvedValue({
        status: 200,
        data: {
          contexts: [{ name: 'kapps.kappSlug.forms.deletedFormSlug' }],
        },
      });
      const result = await fetchContexts({ unexpected: true });
      expect(axios.get.mock.calls).toEqual([
        [
          'space/app/api/v1/translations/contexts',
          {
            params: { unexpected: true },
            headers: { 'X-Kinetic-AuthAssumed': 'true' },
          },
        ],
      ]);
      expect(result).toEqual({
        contexts: [
          {
            name: 'kapps.kappSlug.forms.deletedFormSlug',
            kapp: 'kappSlug',
            form: 'deletedFormSlug',
          },
        ],
      });
    });

    test('failure fetch tooManyFlags', async () => {
      axios.get.mockRejectedValue(
        createError('Request failed with status code 400', null, 400, null, {
          status: 400,
          statusText:
            'The custom, expected, and unexpected flags can only be specified independently.',
        }),
      );
      const result = await fetchContexts({ expected: true, unexpected: true });
      expect(axios.get.mock.calls).toEqual([
        [
          'space/app/api/v1/translations/contexts',
          {
            params: { expected: true },
            headers: { 'X-Kinetic-AuthAssumed': 'true' },
          },
        ],
      ]);
      expect(result).toEqual({
        error: {
          badRequest: true,
          statusCode: 400,
          key: null,
          message:
            'The custom, expected, and unexpected flags can only be specified independently.',
        },
      });
    });

    test('forbidden', async () => {
      axios.get.mockRejectedValue(
        createError('Request failed with status code 403', null, 403, null, {
          status: 403,
          statusText: 'Forbidden',
        }),
      );
      const result = await fetchContexts();
      expect(axios.get.mock.calls).toEqual([
        [
          'space/app/api/v1/translations/contexts',
          { params: {}, headers: { 'X-Kinetic-AuthAssumed': 'true' } },
        ],
      ]);
      expect(result).toEqual({
        error: {
          forbidden: true,
          statusCode: 403,
          key: null,
          message: 'Forbidden',
        },
      });
    });
  });

  describe('createContext', () => {
    beforeEach(() => {
      axios.post.mockReset();
    });

    test('success create', async () => {
      axios.post.mockResolvedValue({
        status: 200,
        data: {
          context: {},
        },
      });
      const result = await createContext({ context: { name: 'custom.test' } });
      expect(axios.post.mock.calls).toEqual([
        [
          'space/app/api/v1/translations/contexts',
          { name: 'custom.test' },
          { params: {}, headers: { 'X-Kinetic-AuthAssumed': 'true' } },
        ],
      ]);
      expect(result).toEqual({
        context: {},
      });
    });

    test('missing context', () => {
      expect(() => {
        createContext({});
      }).toThrowError(
        'createContext failed! The following required options are missing: context',
      );
    });

    test('forbidden', async () => {
      axios.post.mockRejectedValue(
        createError('Request failed with status code 403', null, 403, null, {
          status: 403,
          statusText: 'Forbidden',
        }),
      );
      const result = await createContext({ context: {} });
      expect(axios.post.mock.calls).toEqual([
        [
          'space/app/api/v1/translations/contexts',
          {},
          { params: {}, headers: { 'X-Kinetic-AuthAssumed': 'true' } },
        ],
      ]);
      expect(result).toEqual({
        error: {
          forbidden: true,
          statusCode: 403,
          key: null,
          message: 'Forbidden',
        },
      });
    });
  });

  describe('updateContext', () => {
    beforeEach(() => {
      axios.put.mockReset();
    });

    test('success update', async () => {
      axios.put.mockResolvedValue({
        status: 200,
        data: {
          context: {},
        },
      });
      const result = await updateContext({
        contextName: 'custom.test',
        context: { name: 'custom.other' },
      });
      expect(axios.put.mock.calls).toEqual([
        [
          'space/app/api/v1/translations/contexts/custom.test',
          { name: 'custom.other' },
          { params: {}, headers: { 'X-Kinetic-AuthAssumed': 'true' } },
        ],
      ]);
      expect(result).toEqual({
        context: {},
      });
    });

    test('missing contextName', () => {
      expect(() => {
        updateContext({ context: {} });
      }).toThrowError(
        'updateContext failed! The following required options are missing: contextName',
      );
    });

    test('missing context', () => {
      expect(() => {
        updateContext({ contextName: 'custom.test' });
      }).toThrowError(
        'updateContext failed! The following required options are missing: context',
      );
    });

    test('forbidden', async () => {
      axios.put.mockRejectedValue(
        createError('Request failed with status code 403', null, 403, null, {
          status: 403,
          statusText: 'Forbidden',
        }),
      );
      const result = await updateContext({
        contextName: 'custom.test',
        context: {},
      });
      expect(axios.put.mock.calls).toEqual([
        [
          'space/app/api/v1/translations/contexts/custom.test',
          {},
          { params: {}, headers: { 'X-Kinetic-AuthAssumed': 'true' } },
        ],
      ]);
      expect(result).toEqual({
        error: {
          forbidden: true,
          statusCode: 403,
          key: null,
          message: 'Forbidden',
        },
      });
    });
  });

  describe('deleteContext', () => {
    beforeEach(() => {
      axios.delete.mockReset();
    });

    test('success delete', async () => {
      axios.delete.mockResolvedValue({
        status: 200,
        data: {
          context: {},
        },
      });
      const result = await deleteContext({ contextName: 'custom.test' });
      expect(axios.delete.mock.calls).toEqual([
        [
          'space/app/api/v1/translations/contexts/custom.test',
          { params: {}, headers: { 'X-Kinetic-AuthAssumed': 'true' } },
        ],
      ]);
      expect(result).toEqual({
        context: {},
      });
    });

    test('missing contextName', () => {
      expect(() => {
        deleteContext();
      }).toThrowError(
        'deleteContext failed! The following required options are missing: contextName',
      );
    });

    test('forbidden', async () => {
      axios.delete.mockRejectedValue(
        createError('Request failed with status code 403', null, 403, null, {
          status: 403,
          statusText: 'Forbidden',
        }),
      );
      const result = await deleteContext({ contextName: 'custom.test' });
      expect(axios.delete.mock.calls).toEqual([
        [
          'space/app/api/v1/translations/contexts/custom.test',
          { params: {}, headers: { 'X-Kinetic-AuthAssumed': 'true' } },
        ],
      ]);
      expect(result).toEqual({
        error: {
          forbidden: true,
          statusCode: 403,
          key: null,
          message: 'Forbidden',
        },
      });
    });
  });

  describe('fetchContextKeys', () => {
    beforeEach(() => {
      axios.get.mockReset();
    });

    test('success fetch', async () => {
      axios.get.mockResolvedValue({
        status: 200,
        data: {
          keys: [{}, {}],
        },
      });
      const result = await fetchContextKeys({ contextName: 'custom.test' });
      expect(axios.get.mock.calls).toEqual([
        [
          'space/app/api/v1/translations/contexts/custom.test/keys',
          { params: {}, headers: { 'X-Kinetic-AuthAssumed': 'true' } },
        ],
      ]);
      expect(result).toEqual({
        keys: [{}, {}],
      });
    });

    test('missing contextName', () => {
      expect(() => {
        fetchContextKeys();
      }).toThrowError(
        'fetchContextKeys failed! The following required options are missing: contextName',
      );
    });

    test('forbidden', async () => {
      axios.get.mockRejectedValue(
        createError('Request failed with status code 403', null, 403, null, {
          status: 403,
          statusText: 'Forbidden',
        }),
      );
      const result = await fetchContextKeys({ contextName: 'custom.test' });
      expect(axios.get.mock.calls).toEqual([
        [
          'space/app/api/v1/translations/contexts/custom.test/keys',
          { params: {}, headers: { 'X-Kinetic-AuthAssumed': 'true' } },
        ],
      ]);
      expect(result).toEqual({
        error: {
          forbidden: true,
          statusCode: 403,
          key: null,
          message: 'Forbidden',
        },
      });
    });
  });

  describe('updateContextKey', () => {
    beforeEach(() => {
      axios.put.mockReset();
    });

    test('success update', async () => {
      axios.put.mockResolvedValue({
        status: 200,
        data: {
          message: 'success',
        },
      });
      const result = await updateContextKey({
        contextName: 'custom.test',
        keyHash: 'asdf',
        key: { name: 'newKey' },
      });
      expect(axios.put.mock.calls).toEqual([
        [
          'space/app/api/v1/translations/contexts/custom.test/keys/asdf',
          { name: 'newKey' },
          { params: {}, headers: { 'X-Kinetic-AuthAssumed': 'true' } },
        ],
      ]);
      expect(result).toEqual({
        message: 'success',
      });
    });

    test('missing contextName', () => {
      expect(() => {
        updateContextKey({ keyHash: 'asdf', key: {} });
      }).toThrowError(
        'updateContextKey failed! The following required options are missing: contextName',
      );
    });

    test('missing keyHash', () => {
      expect(() => {
        updateContextKey({ contextName: 'custom.test', key: {} });
      }).toThrowError(
        'updateContextKey failed! The following required options are missing: keyHash',
      );
    });

    test('missing key', () => {
      expect(() => {
        updateContextKey({ contextName: 'custom.test', keyHash: 'asdf' });
      }).toThrowError(
        'updateContextKey failed! The following required options are missing: key',
      );
    });

    test('forbidden', async () => {
      axios.put.mockRejectedValue(
        createError('Request failed with status code 403', null, 403, null, {
          status: 403,
          statusText: 'Forbidden',
        }),
      );
      const result = await updateContextKey({
        contextName: 'custom.test',
        keyHash: 'asdf',
        key: { name: 'newKey' },
      });
      expect(axios.put.mock.calls).toEqual([
        [
          'space/app/api/v1/translations/contexts/custom.test/keys/asdf',
          { name: 'newKey' },
          { params: {}, headers: { 'X-Kinetic-AuthAssumed': 'true' } },
        ],
      ]);
      expect(result).toEqual({
        error: {
          forbidden: true,
          statusCode: 403,
          key: null,
          message: 'Forbidden',
        },
      });
    });
  });

  describe('fetchTranslations', () => {
    beforeEach(() => {
      axios.get.mockReset();
    });

    test('success fetch cached', async () => {
      axios.get.mockResolvedValue({
        status: 200,
        data: {
          entries: [{}, {}],
        },
      });
      const result = await fetchTranslations({
        cache: true,
        contextName: 'custom.test',
        localeCode: 'en',
      });
      expect(axios.get.mock.calls).toEqual([
        [
          'space/app/api/v1/translations/entries',
          {
            params: { cache: true, context: 'custom.test', locale: 'en' },
            headers: { 'X-Kinetic-AuthAssumed': 'true' },
          },
        ],
      ]);
      expect(result).toEqual({
        entries: [{}, {}],
      });
    });

    test('missing contextName', () => {
      expect(() => {
        fetchTranslations({ cache: true, localeCode: 'en' });
      }).toThrowError(
        'fetchTranslations failed! The following required options are missing: contextName',
      );
    });

    test('missing localeCode', () => {
      expect(() => {
        fetchTranslations({ cache: true, contextName: 'custom.test' });
      }).toThrowError(
        'fetchTranslations failed! The following required options are missing: localeCode',
      );
    });

    test('success fetch by context and locale', async () => {
      axios.get.mockResolvedValue({
        status: 200,
        data: {
          entries: [{}, {}],
        },
      });
      const result = await fetchTranslations({
        contextName: 'custom.test',
        localeCode: 'en',
      });
      expect(axios.get.mock.calls).toEqual([
        [
          'space/app/api/v1/translations/entries',
          {
            params: { context: 'custom.test', locale: 'en' },
            headers: { 'X-Kinetic-AuthAssumed': 'true' },
          },
        ],
      ]);
      expect(result).toEqual({
        entries: [{}, {}],
      });
    });

    test('success fetch by context and keyHash', async () => {
      axios.get.mockResolvedValue({
        status: 200,
        data: {
          entries: [{}, {}],
        },
      });
      const result = await fetchTranslations({
        contextName: 'custom.test',
        keyHash: 'asdf',
      });
      expect(axios.get.mock.calls).toEqual([
        [
          'space/app/api/v1/translations/entries',
          {
            params: { context: 'custom.test', keyHash: 'asdf' },
            headers: { 'X-Kinetic-AuthAssumed': 'true' },
          },
        ],
      ]);
      expect(result).toEqual({
        entries: [{}, {}],
      });
    });

    test('success fetch missing', async () => {
      axios.get.mockResolvedValue({
        status: 200,
        data: {
          entries: [{}, {}],
        },
      });
      const result = await fetchTranslations({ missing: true });
      expect(axios.get.mock.calls).toEqual([
        [
          'space/app/api/v1/translations/entries',
          {
            params: { missing: true },
            headers: { 'X-Kinetic-AuthAssumed': 'true' },
          },
        ],
      ]);
      expect(result).toEqual({
        entries: [{}, {}],
      });
    });

    test('success export', async () => {
      axios.get.mockResolvedValue({
        status: 200,
        data: {
          entries: null,
        },
      });
      const result = await fetchTranslations({ export: 'csv' });
      expect(axios.get.mock.calls).toEqual([
        [
          'space/app/api/v1/translations/entries',
          {
            params: { export: 'csv', download: true },
            headers: { 'X-Kinetic-AuthAssumed': 'true' },
          },
        ],
      ]);
      expect(result).toEqual({
        entries: null,
      });
    });

    test('forbidden', async () => {
      axios.get.mockRejectedValue(
        createError('Request failed with status code 403', null, 403, null, {
          status: 403,
          statusText: 'Forbidden',
        }),
      );
      const result = await fetchTranslations();
      expect(axios.get.mock.calls).toEqual([
        [
          'space/app/api/v1/translations/entries',
          { params: {}, headers: { 'X-Kinetic-AuthAssumed': 'true' } },
        ],
      ]);
      expect(result).toEqual({
        error: {
          forbidden: true,
          statusCode: 403,
          key: null,
          message: 'Forbidden',
        },
      });
    });
  });

  describe('upsertTranslations', () => {
    beforeEach(() => {
      axios.post.mockReset();
    });

    test('success upsert single', async () => {
      axios.post.mockResolvedValue({
        status: 200,
        data: {
          message: 'success',
        },
      });
      const result = await upsertTranslations({
        translation: { value: 'test' },
      });
      expect(axios.post.mock.calls).toEqual([
        [
          'space/app/api/v1/translations/entries',
          { value: 'test' },
          { params: {}, headers: { 'X-Kinetic-AuthAssumed': 'true' } },
        ],
      ]);
      expect(result).toEqual({
        message: 'success',
      });
    });

    test('missing translation', () => {
      expect(() => {
        upsertTranslations();
      }).toThrowError(
        'upsertTranslations failed! The following required options are missing: translation',
      );
    });

    test('success upsert list', async () => {
      axios.post.mockResolvedValue({
        status: 200,
        data: {
          message: 'success',
        },
      });
      const result = await upsertTranslations({
        translations: [{ value: 'test' }],
      });
      expect(axios.post.mock.calls).toEqual([
        [
          'space/app/api/v1/translations/entries',
          [{ value: 'test' }],
          { params: {}, headers: { 'X-Kinetic-AuthAssumed': 'true' } },
        ],
      ]);
      expect(result).toEqual({
        message: 'success',
      });
    });

    test('success import', async () => {
      axios.post.mockResolvedValue({
        status: 200,
        data: {
          message: 'success',
        },
      });
      const testFile = new File([], 'test');
      const testFormData = new FormData();
      testFormData.append('file', testFile);
      const result = await upsertTranslations({
        import: 'csv',
        file: testFile,
      });
      expect(axios.post.mock.calls).toEqual([
        [
          'space/app/api/v1/translations/entries',
          testFormData,
          {
            params: { import: 'csv' },
            headers: {
              'Content-Type': 'multipart/form-data',
              'X-Kinetic-AuthAssumed': 'true',
            },
          },
        ],
      ]);
      expect(result).toEqual({
        message: 'success',
      });
    });

    test('missing file', () => {
      expect(() => {
        upsertTranslations({ import: 'csv' });
      }).toThrowError(
        'upsertTranslations failed! The following required options are missing: file',
      );
    });

    test('forbidden', async () => {
      axios.post.mockRejectedValue(
        createError('Request failed with status code 403', null, 403, null, {
          status: 403,
          statusText: 'Forbidden',
        }),
      );
      const result = await upsertTranslations({
        translation: { value: 'test' },
      });
      expect(axios.post.mock.calls).toEqual([
        [
          'space/app/api/v1/translations/entries',
          { value: 'test' },
          { params: {}, headers: { 'X-Kinetic-AuthAssumed': 'true' } },
        ],
      ]);
      expect(result).toEqual({
        error: {
          forbidden: true,
          statusCode: 403,
          key: null,
          message: 'Forbidden',
        },
      });
    });
  });

  describe('deleteTranslations', () => {
    beforeEach(() => {
      axios.delete.mockReset();
    });

    test('success delete by context', async () => {
      axios.delete.mockResolvedValue({
        status: 200,
        data: {
          message: 'success',
        },
      });
      const result = await deleteTranslations({ contextName: 'custom.test' });
      expect(axios.delete.mock.calls).toEqual([
        [
          'space/app/api/v1/translations/entries',
          {
            params: { context: 'custom.test' },
            headers: { 'X-Kinetic-AuthAssumed': 'true' },
          },
        ],
      ]);
      expect(result).toEqual({
        message: 'success',
      });
    });

    test('success delete by locale', async () => {
      axios.delete.mockResolvedValue({
        status: 200,
        data: {
          message: 'success',
        },
      });
      const result = await deleteTranslations({ localeCode: 'en' });
      expect(axios.delete.mock.calls).toEqual([
        [
          'space/app/api/v1/translations/entries',
          {
            params: { locale: 'en' },
            headers: { 'X-Kinetic-AuthAssumed': 'true' },
          },
        ],
      ]);
      expect(result).toEqual({
        message: 'success',
      });
    });

    test('success delete specific', async () => {
      axios.delete.mockResolvedValue({
        status: 200,
        data: {
          message: 'success',
        },
      });
      const result = await deleteTranslations({
        contextName: 'custom.test',
        localeCode: 'en',
        keyHash: 'asdf',
      });
      expect(axios.delete.mock.calls).toEqual([
        [
          'space/app/api/v1/translations/entries',
          {
            params: { context: 'custom.test', locale: 'en', keyHash: 'asdf' },
            headers: { 'X-Kinetic-AuthAssumed': 'true' },
          },
        ],
      ]);
      expect(result).toEqual({
        message: 'success',
      });
    });

    test('missing contextName', () => {
      expect(() => {
        deleteTranslations({ keyHash: 'asdf' });
      }).toThrowError(
        'deleteTranslations failed! The following required options are missing: contextName',
      );
    });

    test('forbidden', async () => {
      axios.delete.mockRejectedValue(
        createError('Request failed with status code 403', null, 403, null, {
          status: 403,
          statusText: 'Forbidden',
        }),
      );
      const result = await deleteTranslations();
      expect(axios.delete.mock.calls).toEqual([
        [
          'space/app/api/v1/translations/entries',
          { params: {}, headers: { 'X-Kinetic-AuthAssumed': 'true' } },
        ],
      ]);
      expect(result).toEqual({
        error: {
          forbidden: true,
          statusCode: 403,
          key: null,
          message: 'Forbidden',
        },
      });
    });
  });
});

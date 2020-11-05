import axios from 'axios';
import createError from 'axios/lib/core/createError';
import { createForm, fetchForm, fetchForms, updateForm } from './forms';
import { FormBuilder } from '../../../tests/utils/form_builder';
import {
  rejectPromiseWith,
  resolvePromiseWith,
} from '../../../tests/utils/promises';

jest.mock('axios');

// Mock out the bundle object from a dependency.
jest.mock('../../helpers', () => ({
  bundle: {
    apiLocation: () => 'form/app/api/v1',
    spaceLocation: () => '/kinetic/acme',
    kappSlug: () => 'mock-kapp',
  },
}));

describe('forms api', () => {
  describe('#fetchForms', () => {
    describe('when successful', () => {
      let response;
      let testForm;

      beforeEach(() => {
        response = {
          status: 200,
          data: {
            forms: [],
          },
        };
        testForm = new FormBuilder()
          .stub()
          .withAttribute('Attribute', 'value')
          .build();
        response.data.forms.push(testForm);
        axios.get = resolvePromiseWith(response);
      });

      test('does not return errors', () => {
        expect.assertions(1);
        return fetchForms().then(({ errors }) => {
          expect(errors).toBeUndefined();
        });
      });

      test('returns an array of forms', () => {
        expect.assertions(2);
        return fetchForms().then(({ forms }) => {
          expect(forms).toBeInstanceOf(Array);
          expect(forms[0]).toMatchObject({
            name: testForm.name,
            slug: testForm.slug,
          });
        });
      });

      test('returns attributes', () => {
        expect.assertions(2);
        return fetchForms({ xlatAttributes: true }).then(({ forms }) => {
          expect(forms[0].attributes).toBeDefined();
          expect(forms[0].attributes).toBeInstanceOf(Array);
        });
      });
    });
  });

  describe('#fetchForm', () => {
    describe('when successful', () => {
      let response;
      let testForm;
      let formSlug;

      beforeEach(() => {
        response = {
          status: 200,
          data: {
            form: {},
          },
        };
        testForm = new FormBuilder()
          .stub()
          .withAttribute('Attribute', 'value')
          .build();
        formSlug = testForm.slug;
        response.data.form = testForm;
        axios.get = resolvePromiseWith(response);
      });

      test('does not return errors', () => {
        expect.assertions(1);
        return fetchForm({ formSlug }).then(({ errors }) => {
          expect(errors).toBeUndefined();
        });
      });

      test('returns a form', () => {
        expect.assertions(1);
        return fetchForm({ formSlug }).then(({ form }) => {
          expect(form).toMatchObject({
            name: testForm.name,
            slug: testForm.slug,
          });
        });
      });

      test('returns attributes', () => {
        expect.assertions(2);
        return fetchForm({ formSlug }).then(({ form }) => {
          expect(form.attributes).toBeDefined();
          expect(form.attributes).toBeInstanceOf(Array);
        });
      });
    });

    describe('when unsuccessful', () => {
      let response;

      beforeEach(() => {
        response = {
          status: 500,
          data: {
            error: 'Failed',
          },
        };
        axios.get = rejectPromiseWith({ response });
      });

      test('throws an exception when no form slug is provided', () => {
        expect(() => {
          fetchForm({});
        }).toThrow();
      });

      test('does return errors', () => {
        expect.assertions(1);
        return fetchForm({ formSlug: 'fake', xlatAttributes: true }).then(
          ({ error }) => {
            expect(error).toBeDefined();
          },
        );
      });
    });
  });

  describe('createForm', () => {
    beforeEach(() => {
      axios.post.mockReset();
    });

    test('success', async () => {
      axios.post.mockResolvedValue({
        status: 200,
        data: {
          form: {
            name: 'Test Form',
            attributes: [{ name: 'Icon', values: ['fa-gear'] }],
          },
        },
      });
      const { form, error } = await createForm({
        kappSlug: 'catalog',
        form: {
          name: 'Test Form',
          attributes: [{ name: 'Icon', values: ['fa-gear'] }],
        },
        include: 'attributes,pages',
      });
      expect(axios.post.mock.calls).toEqual([
        [
          'form/app/api/v1/kapps/catalog/forms',
          {
            name: 'Test Form',
            attributes: [{ name: 'Icon', values: ['fa-gear'] }],
          },
          {
            params: { include: 'attributes,pages' },
            headers: { 'X-Kinetic-AuthAssumed': 'true' },
          },
        ],
      ]);
      expect(form).toEqual({
        name: 'Test Form',
        attributes: [{ name: 'Icon', values: ['fa-gear'] }],
      });
      expect(error).toBeUndefined();
    });

    test('space form', async () => {
      axios.post.mockResolvedValue({
        status: 200,
        data: {
          form: {
            name: 'Test Space Form',
            attributes: [{ name: 'Icon', values: ['fa-gear'] }],
          },
        },
      });
      const { form, error, errors, serverError } = await createForm({
        form: {
          name: 'Test Space Form',
          attributes: [{ name: 'Icon', values: ['fa-gear'] }],
        },
        include: 'attributes,pages',
      });
      expect(axios.post.mock.calls).toEqual([
        [
          'form/app/api/v1/forms',
          {
            name: 'Test Space Form',
            attributes: [{ name: 'Icon', values: ['fa-gear'] }],
          },
          {
            params: { include: 'attributes,pages' },
            headers: { 'X-Kinetic-AuthAssumed': 'true' },
          },
        ],
      ]);
      expect(form).toEqual({
        name: 'Test Space Form',
        attributes: [{ name: 'Icon', values: ['fa-gear'] }],
      });
      expect(error).toBeUndefined();
      expect(errors).toBeUndefined();
      expect(serverError).toBeUndefined();
    });

    test('missing form', () => {
      expect(() => {
        createForm({});
      }).toThrow('createForm failed! The option "form" is required.');
    });

    test('missing kappSlug allowed for space forms', () => {
      axios.post.mockResolvedValue({ status: 200, data: {} });
      expect(() => {
        createForm({
          form: {},
          kappSlug: null,
        });
      }).not.toThrowError();
    });

    test('bad request', async () => {
      axios.post.mockRejectedValue(
        createError('Request failed with status code 400', null, 400, null, {
          status: 400,
          statusText: 'Bad Request',
          data: { error: 'Invalid form' },
        }),
      );
      const { form, error } = await createForm({
        form: { name: null },
      });
      expect(form).toBeUndefined();
      expect(error).toEqual({
        badRequest: true,
        key: null,
        message: 'Invalid form',
        statusCode: 400,
      });
    });

    test('forbidden', async () => {
      axios.post.mockRejectedValue(
        createError('Request failed with status code 403', null, 403, null, {
          status: 403,
          statusText: 'Forbidden',
          data: {},
        }),
      );
      const { form, error } = await createForm({
        form: { name: 'Test' },
      });
      expect(form).toBeUndefined();
      expect(error).toEqual({
        statusCode: 403,
        key: null,
        message: 'Forbidden',
        forbidden: true,
      });
    });
  });

  describe('updateForm', () => {
    beforeEach(() => {
      axios.put.mockReset();
    });

    test('success', async () => {
      axios.put.mockResolvedValue({
        status: 200,
        data: {
          form: {
            name: 'Test Form',
            attributes: [{ name: 'Icon', values: ['fa-gear'] }],
          },
        },
      });
      const { form, error } = await updateForm({
        kappSlug: 'catalog',
        formSlug: 'test-form',
        form: {
          name: 'Test Form',
          attributes: [{ name: 'Icon', values: ['fa-gear'] }],
        },
        include: 'attributes,pages',
      });
      expect(axios.put.mock.calls).toEqual([
        [
          'form/app/api/v1/kapps/catalog/forms/test-form',
          {
            name: 'Test Form',
            attributes: [{ name: 'Icon', values: ['fa-gear'] }],
          },
          {
            params: { include: 'attributes,pages' },
            headers: { 'X-Kinetic-AuthAssumed': 'true' },
          },
        ],
      ]);
      expect(form).toEqual({
        name: 'Test Form',
        attributes: [{ name: 'Icon', values: ['fa-gear'] }],
      });
      expect(error).toBeUndefined();
    });

    test('space form', async () => {
      axios.put.mockResolvedValue({
        status: 200,
        data: {
          form: {
            name: 'Test Space Form',
            attributes: [{ name: 'Icon', values: ['fa-gear'] }],
          },
        },
      });
      const { form, error } = await updateForm({
        formSlug: 'test-form',
        form: {
          name: 'Test Space Form',
          attributes: [{ name: 'Icon', values: ['fa-gear'] }],
        },
        include: 'attributes,pages',
      });
      expect(axios.put.mock.calls).toEqual([
        [
          'form/app/api/v1/forms/test-form',
          {
            name: 'Test Space Form',
            attributes: [{ name: 'Icon', values: ['fa-gear'] }],
          },
          {
            params: { include: 'attributes,pages' },
            headers: { 'X-Kinetic-AuthAssumed': 'true' },
          },
        ],
      ]);
      expect(form).toEqual({
        name: 'Test Space Form',
        attributes: [{ name: 'Icon', values: ['fa-gear'] }],
      });
      expect(error).toBeUndefined();
    });

    test('missing form', () => {
      expect(() => {
        updateForm({ formSlug: 'test' });
      }).toThrow('updateForm failed! The option "form" is required.');
    });

    test('missing kappSlug allowed for space forms', () => {
      axios.put.mockResolvedValue({ status: 200, data: {} });
      expect(() => {
        updateForm({
          formSlug: 'test',
          form: {},
          kappSlug: null,
        });
      }).not.toThrowError();
    });

    test('missing formSlug', () => {
      expect(() => {
        updateForm({ form: {} });
      }).toThrow('updateForm failed! The option "formSlug" is required.');
    });

    test('bad request', async () => {
      axios.put.mockRejectedValue(
        createError('Request failed with status code 400', null, 400, null, {
          status: 400,
          statusText: 'Bad Request',
          data: { error: 'Invalid form' },
        }),
      );
      const { form, error } = await updateForm({
        formSlug: 'test',
        form: { name: null },
      });
      expect(form).toBeUndefined();
      expect(error).toEqual({
        badRequest: true,
        statusCode: 400,
        key: null,
        message: 'Invalid form',
      });
    });

    test('serverError', async () => {
      axios.put.mockRejectedValue(
        createError('Request failed with status code 403', null, 403, null, {
          status: 403,
          statusText: 'Forbidden',
          data: {},
        }),
      );
      const { form, error } = await updateForm({
        formSlug: 'test',
        form: { name: 'Test' },
      });
      expect(form).toBeUndefined();
      expect(error).toEqual({
        forbidden: true,
        key: null,
        statusCode: 403,
        message: 'Forbidden',
      });
    });
  });
});

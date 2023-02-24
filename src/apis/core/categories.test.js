import axios from 'axios';

import {
  fetchCategory,
  fetchCategories,
  createCategory,
  updateCategory,
} from './categories';
import { CategoryBuilder } from '../../../tests/utils/category_builder';
import {
  rejectPromiseWith,
  resolvePromiseWith,
} from '../../../tests/utils/promises';

// Mock out the bundle object from a dependency.
jest.mock('../../helpers', () => ({
  bundle: {
    apiLocation: () => 'category/app/api/v1',
    kappSlug: () => 'mock-kapp',
  },
}));

describe('categories api', () => {
  describe('#fetchCategories', () => {
    describe('when successful', () => {
      let response;
      let testCategory;

      beforeEach(() => {
        response = {
          status: 200,
          data: {
            categories: [],
          },
        };
        testCategory = new CategoryBuilder()
          .stub()
          .withAttribute('Attribute', 'value')
          .build();
        response.data.categories.push(testCategory);
        axios.get = resolvePromiseWith(response);
      });

      test('does not return errors', () => {
        expect.assertions(1);
        return fetchCategories().then(({ errors }) => {
          expect(errors).toBeUndefined();
        });
      });

      test('returns an array of categories', () => {
        expect.assertions(2);
        return fetchCategories().then(({ categories }) => {
          expect(categories).toBeInstanceOf(Array);
          expect(categories[0]).toMatchObject({
            name: testCategory.name,
            slug: testCategory.slug,
          });
        });
      });

      test('returns attributes', () => {
        expect.assertions(2);
        return fetchCategories().then(({ categories }) => {
          expect(categories[0].attributes).toBeDefined();
          expect(categories[0].attributes).toBeInstanceOf(Array);
        });
      });
    });
  });

  describe('#fetchCategory', () => {
    describe('when successful', () => {
      let response;
      let testCategory;
      let categorySlug;

      beforeEach(() => {
        response = {
          status: 200,
          data: {
            category: {},
          },
        };
        testCategory = new CategoryBuilder()
          .stub()
          .withAttribute('Attribute', 'value')
          .build();
        categorySlug = testCategory.slug;
        response.data.category = testCategory;
        axios.get = resolvePromiseWith(response);
      });

      test('does not return errors', () => {
        expect.assertions(1);
        return fetchCategory({ categorySlug }).then(({ errors }) => {
          expect(errors).toBeUndefined();
        });
      });

      test('returns a category', () => {
        expect.assertions(1);
        return fetchCategory({ categorySlug }).then(({ category }) => {
          expect(category).toMatchObject({
            name: testCategory.name,
            slug: testCategory.slug,
          });
        });
      });

      test('returns attributes', () => {
        expect.assertions(2);
        return fetchCategory({ categorySlug }).then(({ category }) => {
          expect(category.attributes).toBeDefined();
          expect(category.attributes).toBeInstanceOf(Array);
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

      test('throws an exception when no category slug is provided', () => {
        expect(() => {
          fetchCategory({});
        }).toThrow();
      });

      test('does return errors', () => {
        expect.assertions(1);
        return fetchCategory({ categorySlug: 'fake' }).then(({ error }) => {
          expect(error).toBeDefined();
        });
      });
    });
  });

  describe('#createCategory', () => {
    describe('when successful', () => {
      let response;
      let testCategory;

      beforeEach(() => {
        response = {
          status: 200,
          data: {
            category: {},
          },
        };
        testCategory = new CategoryBuilder()
          .stub()
          .withAttribute('Attribute', 'value')
          .build();
        response.data.category = testCategory;
        axios.post = resolvePromiseWith(response);
      });

      test('does not return errors', () => {
        expect.assertions(1);
        return createCategory({ category: testCategory }).then(({ errors }) => {
          expect(errors).toBeUndefined();
        });
      });

      test('returns a category', () => {
        expect.assertions(1);
        return createCategory({ category: testCategory }).then(
          ({ category }) => {
            expect(category).toMatchObject({
              name: testCategory.name,
              slug: testCategory.slug,
            });
          },
        );
      });

      test('returns attributes', () => {
        expect.assertions(2);
        return createCategory({ category: testCategory }).then(
          ({ category }) => {
            expect(category.attributes).toBeDefined();
            expect(category.attributes).toBeInstanceOf(Array);
          },
        );
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
        axios.post = rejectPromiseWith({ response });
      });

      test('throws an exception when no category slug is provided', () => {
        expect(() => {
          createCategory({});
        }).toThrow();
      });

      test('does return errors', () => {
        expect.assertions(1);
        return createCategory({ category: 'fake' }).then(({ error }) => {
          expect(error).toBeDefined();
        });
      });
    });
  });

  describe('#updateCategory', () => {
    describe('when successful', () => {
      let response;
      let testCategory;
      let categorySlug;

      beforeEach(() => {
        response = {
          status: 200,
          data: {
            category: {},
          },
        };
        testCategory = new CategoryBuilder()
          .stub()
          .withAttribute('Attribute', 'value')
          .build();
        categorySlug = testCategory.slug;
        response.data.category = testCategory;
        axios.put = resolvePromiseWith(response);
      });

      test('does not return errors', () => {
        expect.assertions(1);
        return updateCategory({ categorySlug, category: testCategory }).then(
          ({ errors }) => {
            expect(errors).toBeUndefined();
          },
        );
      });

      test('returns a category', () => {
        expect.assertions(1);
        return updateCategory({ categorySlug, category: testCategory }).then(
          ({ category }) => {
            expect(category).toMatchObject({
              name: testCategory.name,
              slug: testCategory.slug,
            });
          },
        );
      });

      test('returns attributes', () => {
        expect.assertions(2);
        return updateCategory({ categorySlug, category: testCategory }).then(
          ({ category }) => {
            expect(category.attributes).toBeDefined();
            expect(category.attributes).toBeInstanceOf(Array);
          },
        );
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
        axios.put = rejectPromiseWith({ response });
      });

      test('throws an exception when no category slug is provided', () => {
        expect(() => {
          updateCategory({});
        }).toThrow();
      });

      test('does return errors', () => {
        expect.assertions(1);
        return updateCategory({ categorySlug: 'fake', category: 'fake' }).then(
          ({ error }) => {
            expect(error).toBeDefined();
          },
        );
      });
    });
  });
});

import axios from 'axios';
import { bundle } from '../../helpers';
import { handleErrors, headerBuilder, paramBuilder } from '../http';

export const fetchCategories = (options = {}) => {
  const { kappSlug = bundle.kappSlug() } = options;

  // Build URL and fetch the categories.
  return axios
    .get(`${bundle.apiLocation()}/kapps/${kappSlug}/categories`, {
      params: paramBuilder(options),
      headers: headerBuilder(options),
    })
    .then(response => ({
      categories: response.data.categories,
    }))
    .catch(handleErrors);
};

export const fetchCategory = (options = {}) => {
  const { kappSlug = bundle.kappSlug(), categorySlug } = options;

  if (!categorySlug) {
    throw new Error(
      'fetchCategory failed! The option "categorySlug" is required.',
    );
  }

  // Build URL and fetch the category.
  return axios
    .get(
      `${bundle.apiLocation()}/kapps/${kappSlug}/categories/${categorySlug}`,
      {
        params: paramBuilder(options),
        headers: headerBuilder(options),
      },
    )
    .then(response => ({ category: response.data.category }))
    .catch(handleErrors);
};

export const createCategory = (options = {}) => {
  const { kappSlug = bundle.kappSlug(), category } = options;

  if (!category) {
    throw new Error(
      'createCategory failed! The option "category" is required.',
    );
  }

  // Build URL and fetch the category.
  return axios
    .post(`${bundle.apiLocation()}/kapps/${kappSlug}/categories`, category, {
      params: paramBuilder(options),
      headers: headerBuilder(options),
    })
    .then(response => ({ category: response.data.category }))
    .catch(handleErrors);
};

export const updateCategory = (options = {}) => {
  const { kappSlug = bundle.kappSlug(), category, categorySlug } = options;

  if (!category) {
    throw new Error(
      'updateCategory failed! The option "category" is required.',
    );
  }

  if (!categorySlug) {
    throw new Error(
      'updateCategory failed! The option "categorySlug" is required.',
    );
  }

  // Build URL and fetch the category.
  return axios
    .put(
      `${bundle.apiLocation()}/kapps/${kappSlug}/categories/${categorySlug}`,
      category,
      {
        params: paramBuilder(options),
        headers: headerBuilder(options),
      },
    )
    .then(response => ({ category: response.data.category }))
    .catch(handleErrors);
};

export const deleteCategory = (options = {}) => {
  const { kappSlug, categorySlug } = options;

  if (!kappSlug) {
    throw new Error(
      'deleteCategory failed! The option "kappSlug" is required.',
    );
  }

  if (!categorySlug) {
    throw new Error(
      'deleteCategory failed! The option "categorySlug" is required.',
    );
  }

  // Build URL and fetch the category.
  return axios
    .delete(
      `${bundle.apiLocation()}/kapps/${kappSlug}/categories/${categorySlug}`,
      {
        params: paramBuilder(options),
        headers: headerBuilder(options),
      },
    )
    .then(response => ({ category: response.data.category }))
    .catch(handleErrors);
};

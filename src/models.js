import { Utils } from '@kineticdata/bundle-common';
import * as constants from './constants';
import { List } from 'immutable';

export const Form = o => ({
  name: o.name,
  slug: o.slug,
  description: o.description,
  icon: Utils.getIcon(o, constants.DEFAULT_FORM_ICON),
  keywords: Utils.getAttributeValues(o, constants.ATTRIBUTE_KEYWORD),
  featuredColor: Utils.getAttributeValue(
    o,
    constants.ATTRIBUTE_FEATURED_COLOR,
    'primary',
  ),
  categories: o.categorizations && o.categorizations.map(c => c.category.slug),
  type: o.type,
  status: o.status,
  createdAt: o.createdAt,
  updatedAt: o.updatedAt,
  kapp: o.kapp,
});

export const Category = categoryHelper => category => {
  const forms = category.categorizations
    ? List(
        category.categorizations.map(categorization =>
          Form(categorization.form),
        ),
      ).sortBy(form => form.slug)
    : List();
  const servicesForms = forms.filter(
    form =>
      constants.SUBMISSION_FORM_TYPES.includes(form.type) &&
      constants.SUBMISSION_FORM_STATUSES.includes(form.status),
  );
  return {
    name: category.name,
    slug: category.slug,
    sortOrder: parseInt(
      Utils.getAttributeValue(category, constants.ATTRIBUTE_ORDER, 1000),
      10,
    ),
    icon: Utils.getIcon(category, constants.DEFAULT_CATEGORY_ICON),
    hidden:
      Utils.getAttributeValue(
        category,
        constants.ATTRIBUTE_HIDDEN,
        'false',
      ).toLowerCase() === 'true',
    parentSlug: Utils.getAttributeValue(category, constants.ATTRIBUTE_PARENT),
    allForms: forms,
    forms: servicesForms,
    formCount: servicesForms.size,
    hasParent() {
      return categoryHelper.hasCategory(this.parentSlug);
    },
    getParent() {
      return categoryHelper.getCategory(this.parentSlug);
    },
    hasChildren() {
      return categoryHelper.hasChildren(this.slug);
    },
    getChildren() {
      return categoryHelper.getChildren(this.slug);
    },
    getDescendants() {
      return categoryHelper.getDescendants(this.slug);
    },
    getTotalFormCount() {
      return this.getDescendants().reduce(
        (count, category) => count + category.formCount,
        this.formCount,
      );
    },
    isEmpty() {
      return (
        this.formCount === 0 &&
        !this.getDescendants().some(category => category.formCount > 0)
      );
    },
    getTrail() {
      return categoryHelper.getTrail(this);
    },
    getFullSortOrder() {
      return this.getTrail()
        .map(category => `${category.sortOrder}`.padStart(4, '0'))
        .join('.');
    },
  };
};

export const CategoryHelper = (categories = [], includeHidden = false) => {
  const helper = {
    getCategories() {
      return this.categories
        .filter(includeHidden ? c => c : c => !c.hidden)
        .toList()
        .sortBy(category => category.getFullSortOrder());
    },
    getRootCategories() {
      return this.categories
        .filter(category => !category.hasParent())
        .filter(includeHidden ? c => c : c => !c.hidden)
        .toList()
        .sortBy(category => category.getFullSortOrder());
    },
    hasCategory(slug) {
      return this.categories.has(slug);
    },
    getCategory(slug) {
      return this.categories.get(slug);
    },
    hasChildren(slug) {
      return this.categories.some(category => category.parentSlug === slug);
    },
    getChildren(slug) {
      return this.categories
        .filter(category => category.parentSlug === slug)
        .filter(includeHidden ? c => c : c => !c.hidden)
        .toList()
        .sortBy(category => category.getFullSortOrder());
    },
    getDescendants(slug) {
      return this.getChildren(slug)
        .flatMap(category => [category, ...this.getDescendants(category.slug)])
        .filter(includeHidden ? c => c : c => !c.hidden)
        .toList()
        .sortBy(category => category.getFullSortOrder());
    },
    getTrail(category, trail = List()) {
      return category
        ? this.getTrail(category.getParent(), trail.unshift(category))
        : trail;
    },
  };
  helper.categories = List(categories)
    .map(Category(helper))
    // .filter(includeHidden ? c => c : c => !c.hidden)
    .toOrderedMap()
    .mapKeys((key, category) => category.slug);
  return helper;
};

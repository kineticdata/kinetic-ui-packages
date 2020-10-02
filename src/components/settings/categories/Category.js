import React, { Fragment } from 'react';
import { compose, lifecycle, withHandlers } from 'recompose';
import { FormComponents, addToast } from '@kineticdata/bundle-common';
import { PageTitle } from '../../shared/PageTitle';
import { actions } from '../../../redux/modules/settingsCategories';
import { connect } from '../../../redux/store';
import { CategoryForm } from '@kineticdata/react';
import * as constants from '../../../constants';

const fieldSet = ['name', 'slug', 'icon', 'hidden', 'attributesMap'];

const FormLayout = ({ fields, error, buttons }) => (
  <Fragment>
    {fields.get('name')}
    {fields.get('slug')}
    {fields.get('icon')}
    {fields.get('hidden')}
    {error}
    {buttons}
  </Fragment>
);

const asArray = value => (value ? [value] : []);

export const CategoryComponent = ({
  currentKapp,
  slug,
  category,
  parentSlug,
  parent,
  onSave,
}) => (
  <CategoryForm
    // Set unique key to force component to reload when corresponding props change
    key={`${slug}-${parentSlug}`}
    kappSlug={currentKapp.slug}
    categorySlug={slug}
    fieldSet={fieldSet}
    onSave={onSave}
    components={{
      FormLayout,
      FormButtons: FormComponents.generateFormButtons({
        submitLabel: 'Save',
        cancelPath: parent ? '../..' : '..',
      }),
    }}
    addFields={() => ({ category }) => [
      {
        name: 'icon',
        label: 'Display Icon',
        type: 'text',
        helpText: 'Font Awesome icon to display in in category cards.',
        initialValue: category
          ? category.getIn(['attributesMap', constants.ATTRIBUTE_ICON, 0])
          : '',
        component: FormComponents.IconField,
      },
      {
        name: 'hidden',
        label: 'Hidden',
        type: 'checkbox',
        helpText: 'Should this category be hidden from users.',
        initialValue: category
          ? category.getIn(['attributesMap', constants.ATTRIBUTE_HIDDEN, 0]) ===
            'True'
          : false,
        component: FormComponents.CheckboxField,
      },
    ]}
    alterFields={{
      attributesMap: {
        serialize: ({ values }) => ({
          [constants.ATTRIBUTE_ICON]: asArray(values.get('icon')),
          [constants.ATTRIBUTE_HIDDEN]: asArray(
            values.get('hidden') ? 'True' : null,
          ),
          ...(!slug && parent
            ? { [constants.ATTRIBUTE_PARENT]: [parentSlug] }
            : {}),
        }),
      },
    }}
  >
    {({ form, initialized, bindings }) => {
      const pageName = slug
        ? bindings.category && bindings.category.get('name')
        : parent
          ? 'New Subcategory'
          : 'New Category';
      return (
        <div className="page-container">
          <div className="page-panel page-panel--white">
            <PageTitle
              parts={[pageName, `Categories`]}
              settings
              hero={false}
              breadcrumbs={[
                { label: 'services', to: `../../..${parent ? '/..' : ''}` },
                { label: 'settings', to: `../..${parent ? '/..' : ''}` },
                { label: 'categories', to: `..${parent ? '/..' : ''}` },
                ...(parent
                  ? parent.getTrail()
                  : category
                    ? category.getTrail().skipLast(1)
                    : []
                ).map(ancestorCategory => ({
                  label: ancestorCategory.name,
                  to: `../../${ancestorCategory.slug}`,
                })),
              ]}
              title={pageName}
              actions={
                initialized &&
                slug && [
                  {
                    label: 'Add Subcategory',
                    icon: 'plus',
                    to: `../new/${slug}`,
                  },
                ]
              }
            />
            {initialized && <section className="form">{form}</section>}
          </div>
        </div>
      );
    }}
  </CategoryForm>
);

const mapStateToProps = (state, props) => {
  const categoryHelper = state.settingsCategories.categoryHelper;
  return {
    category: categoryHelper && categoryHelper.getCategory(props.slug),
    parent: categoryHelper && categoryHelper.getCategory(props.parentSlug),
    currentKapp: state.app.kapp,
    reloadApp: state.app.actions.refreshApp,
  };
};

const mapDispatchToProps = {
  fetchCategoriesRequest: actions.fetchCategoriesRequest,
};

export const Category = compose(
  connect(
    mapStateToProps,
    mapDispatchToProps,
  ),
  withHandlers({
    onSave: props => () => () => {
      props.reloadApp();
      props.fetchCategoriesRequest();
      addToast(`Category saved successfully.`);
      props.navigate(props.parent ? '../..' : '..');
    },
  }),
  lifecycle({
    componentDidMount() {},
    componentDidUpdate(prevProps) {},
    componentWillUnmount() {},
  }),
)(CategoryComponent);

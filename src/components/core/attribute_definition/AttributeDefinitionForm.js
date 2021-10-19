import t from 'prop-types';
import { generateForm } from '../../form/Form';
import {
  createAttributeDefinition,
  updateAttributeDefinition,
  fetchAttributeDefinition,
} from '../../../apis';

const dataSources = ({ kappSlug, attributeType, attributeName }) => ({
  attributeDefinition: {
    fn: fetchAttributeDefinition,
    params: attributeName && [
      { kappSlug, attributeType, attributeName, include: 'details' },
    ],
    transform: result => result.attributeDefinition,
  },
});

const handleSubmit = ({ kappSlug, attributeType, attributeName }) => values =>
  (attributeName ? updateAttributeDefinition : createAttributeDefinition)({
    attributeDefinition: values.toJS(),
    kappSlug,
    attributeType,
    attributeName,
  }).then(({ attributeDefinition, error }) => {
    if (error) {
      throw (error.statusCode === 400 && error.message) ||
        'There was an error saving the attribute definition';
    }
    return attributeDefinition;
  });

const fields = ({ attributeName }) => ({ attributeDefinition }) =>
  (!attributeName || attributeDefinition) && [
    {
      name: 'name',
      label: 'Name',
      type: 'text',
      required: true,
      initialValue: attributeDefinition ? attributeDefinition.get('name') : '',
      helpText: 'Will be displayed in attribute dropdowns.',
    },
    {
      name: 'description',
      label: 'Description',
      type: 'text',
      required: false,
      initialValue: attributeDefinition
        ? attributeDefinition.get('description')
        : '',
    },
    {
      name: 'allowsMultiple',
      label: 'Allow multiple attributes?',
      type: 'checkbox',
      required: false,
      initialValue: attributeDefinition
        ? attributeDefinition.get('allowsMultiple')
        : false,
      helpText:
        'Determines whether multiple values can be assigned to this attribute.',
    },
  ];

/**
 * @component
 * A form for creating and updating Attribute Definitions within the Kinetic Platform
 */
export const AttributeDefinitionForm = generateForm({
  formOptions: ['kappSlug', 'attributeType', 'attributeName'],
  dataSources,
  fields,
  handleSubmit,
});

AttributeDefinitionForm.displayName = 'AttributeDefinitionForm';

// Specifies the default values for props:
AttributeDefinitionForm.defaultProps = {
  attributeName: null,
  kappSlug: null,
};

AttributeDefinitionForm.propTypes = {
  /** The type of attribute definition.   */
  attributeType: t.oneOf([
    'spaceAttributeDefinitions',
    'teamAttributeDefinitions',
    'userAttributeDefinitions',
    'userProfileAttributeDefinitions',
    'categoryAttributeDefinitions',
    'kappAttributeDefinitions',
    'formAttributeDefinitions',
  ]).isRequired,
  /** The name of the attribute (assumes new if not null). */
  attributeName: t.string,
  /**
   * If the attribute definition is for a Kapp
   * (Kapp Attributes, Form Attributes, Category Attributes, ...etc)
   * a Kapp Slug is required.
   */
  kappSlug: t.string,
};

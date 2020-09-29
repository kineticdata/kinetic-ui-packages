import { generateForm } from '../../form/Form';
import { fetchKapp, fetchSpace, updateKapp, updateSpace } from '../../../apis';
import { FIELD_DATA_TYPES } from './FieldDefinitionTable';

const dataSources = ({ kappSlug, name }) => ({
  form: {
    fn: kappSlug ? fetchKapp : fetchSpace,
    params: [{ kappSlug, include: 'fields' }],
    transform: result => (kappSlug ? result.kapp : result.space),
  },
  fieldDefinition: {
    fn: (form, name) => form.get('fields').find(f => f.get('name') === name),
    params: ({ form }) => form && name && [form, name],
  },
  nextFieldKey: {
    fn: kappSlug ? fetchKapp : fetchSpace,
    params: () => [{ kappSlug, include: 'fields' }],
    transform: result => {
      const fk = kappSlug
        ? result.kapp.fields
            .map(f => Number.parseInt(f.key.slice(1)))
            .sort((a, b) => a - b)
            .pop() + 1
        : 0;
      return 'k' + fk;
    },
  },
});

const handleSubmit = ({ kappSlug, name }) => (values, { form }) => {
  const dataType = FIELD_DATA_TYPES.find(
    fdt => fdt.value === values.get('renderType'),
  ).dataType;

  const fields = name
    ? form
        .get('fields')
        .map(fd =>
          fd.get('name') === name ? values.set('dataType', dataType) : fd,
        )
        .toJS()
    : form
        .get('fields')
        .push(values.set('dataType', dataType))
        .toJS();

  return (kappSlug
    ? updateKapp({ kapp: { fields }, kappSlug })
    : updateSpace({ space: { fields } })
  ).then(({ kapp, space, error }) => {
    if (error) {
      throw (error.statusCode === 400 && error.message) ||
        'There was an error saving the field definition';
    }
    return kappSlug ? kapp : space;
  });
};

const fields = ({ kappSlug, name }) => ({
  form,
  fieldDefinition,
  nextFieldKey,
}) =>
  (!name || fieldDefinition) &&
  form &&
  nextFieldKey && [
    kappSlug && {
      name: 'key',
      label: 'Key',
      type: 'text',
      enabled: false,
      visible: true,
      initialValue: fieldDefinition ? fieldDefinition.get('key') : nextFieldKey,
    },
    {
      name: 'name',
      label: 'Name',
      type: 'text',
      required: true,
      initialValue: fieldDefinition ? fieldDefinition.get('name') : '',
    },
    {
      name: 'renderType',
      label: 'Type',
      type: 'select',
      required: true,
      options: FIELD_DATA_TYPES,
      initialValue: fieldDefinition ? fieldDefinition.get('dataType') : '',
    },
    {
      name: 'createdAt',
      label: 'Created At',
      type: 'text',
      visible: false,
      initialValue: fieldDefinition
        ? fieldDefinition.get('createdAt')
        : '2020-08-24T22:06:20.572Z',
    },
    {
      name: 'createdBy',
      label: 'Created By',
      type: 'text',
      visible: false,
      initialValue: fieldDefinition
        ? fieldDefinition.get('createdBy')
        : 'admin',
    },
    {
      name: 'updatedAt',
      label: 'Updated At',
      type: 'text',
      visible: false,
      initialValue: fieldDefinition
        ? fieldDefinition.get('updatedAt')
        : '2020-08-24T22:06:20.572Z',
    },
    {
      name: 'updatedBy',
      label: 'Updated By',
      type: 'text',
      visible: false,
      initialValue: fieldDefinition
        ? fieldDefinition.get('updatedBy')
        : 'admin',
    },
  ];

/**
 * @component
 * A form for creating and updating Field Definitions within the Kinetic Platform
 */
export const FieldDefinitionForm = generateForm({
  formOptions: ['kappSlug', 'name'],
  dataSources,
  fields,
  handleSubmit,
});

FieldDefinitionForm.displayName = 'FieldDefinitionForm';

// Specifies the default values for props:
FieldDefinitionForm.defaultProps = {
  fieldName: null,
  kappSlug: null,
};

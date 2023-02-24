import { generateForm } from '../../form/Form';
import { createFormType, updateFormType, fetchFormType } from '../../../apis';

const dataSources = ({ kappSlug, name }) => ({
  formType: {
    fn: fetchFormType,
    params: name && [{ kappSlug, name, include: 'details' }],
    transform: result => result.formType,
  },
});

const handleSubmit = ({ kappSlug, name }) => values =>
  (name ? updateFormType : createFormType)({
    formType: values.toJS(),
    kappSlug,
    name,
  }).then(({ formType, error }) => {
    if (error) {
      if (error.statusCode === 400) {
        // Currently the server side returns "Invalid Kapp" because
        // form types are embedded in the kapp. This workaround updates
        // the message returned to the end user.
        const message = error.message.replace(
          'Invalid Kapp',
          'Invalid Form Type',
        );
        throw message;
      } else {
        const message = 'There was an error saving the form type';
        throw message;
      }
    }
    return formType;
  });

const fields = ({ name }) => ({ formType }) =>
  (!name || formType) && [
    {
      name: 'name',
      label: 'Name',
      type: 'text',
      required: true,
      initialValue: formType ? formType.get('name') : '',
      helpText: 'User friendly name for the form type.',
    },
  ];

export const FormTypeForm = generateForm({
  formOptions: ['kappSlug', 'name'],
  dataSources,
  fields,
  handleSubmit,
});

FormTypeForm.displayName = 'FormTypeForm';

import { generateForm } from '../form/Form';
import { createTrustedCertificate } from '../../apis/system';
import { handleFormErrors } from '../form/Form.helpers';

const handleSubmit =
  ({ spaceSlug }) =>
  values =>
    createTrustedCertificate({
      spaceSlug,
      ...values.toJS(),
    }).then(handleFormErrors());

const dataSources = () => ({});

const fields = () => () => [
  {
    name: 'certificates',
    label: 'Certificates',
    type: 'file-multi',
    required: true,
  },
];

export const SystemTrustedCertificateForm = generateForm({
  formOptions: ['spaceSlug'],
  dataSources,
  fields,
  handleSubmit,
});

SystemTrustedCertificateForm.displayName = 'SystemTrustedCertificateForm';

import { get } from 'immutable';
import { generateForm } from '../../form/Form';
import {
  fetchOAuthClient,
  createOAuthClient,
  updateOAuthClient,
} from '../../../apis';

const dataSources = ({ clientId }) => ({
  client: {
    fn: fetchOAuthClient,
    params: clientId && [{ clientId }],
    transform: result => result.client,
  },
});

const handleSubmit = ({ clientId }) => values =>
  (clientId ? updateOAuthClient : createOAuthClient)({
    clientId,
    client: values.toJS(),
  }).then(({ client, error }) => {
    if (error) {
      throw (error.statusCode === 400 && error.message) ||
        'There was an error saving the OAuth Client';
    }
    return client;
  });

const fields = ({ clientId }) => ({ client }) =>
  (!clientId || client) && [
    {
      name: 'name',
      label: 'Name',
      type: 'text',
      required: true,
      initialValue: get(client, 'name') || '',
    },
    {
      name: 'description',
      label: 'Description',
      type: 'text',
      required: false,
      initialValue: get(client, 'description') || '',
    },
    {
      name: 'clientId',
      label: 'Client ID',
      type: 'text',
      required: true,
      initialValue: get(client, 'clientId') || '',
      helpText: 'A unique identifier for this client',
    },
    {
      name: 'clientSecret',
      label: 'Client Secret',
      type: 'password',
      visible: ({ values }) => values.get('changeClientSecret'),
      required: ({ values }) => values.get('changeClientSecret'),
      transient: ({ values }) => !values.get('changeClientSecret'),
    },
    {
      name: 'changeClientSecret',
      label: 'Change Client Secret',
      type: 'checkbox',
      transient: true,
      // in "new" mode we do not show this toggle field and default it to true
      visible: !!clientId,
      initialValue: !clientId,
      onChange: ({ values }, { setValue }) => {
        if (values.get('clientSecret') !== '') {
          setValue('clientSecret', '');
        }
      },
    },
    {
      name: 'redirectUri',
      label: 'Redirect URI',
      type: 'text',
      required: true,
      initialValue: get(client, 'redirectUri') || '',
      helpText: 'Identifier or location of OAuth callback',
    },
  ];

export const OAuthClientForm = generateForm({
  formOptions: ['clientId'],
  dataSources,
  fields,
  handleSubmit,
});

OAuthClientForm.displayName = 'OAuthClientForm';

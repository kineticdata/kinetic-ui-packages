import React from 'react';
import { List, Map } from 'immutable';
import {
  createWebhook,
  fetchWebhook,
  fetchKapp,
  fetchKappWebhookEvents,
  fetchSpace,
  fetchSpaceWebhookEvents,
  updateWebhook,
} from '../../../apis';
import { Form } from '../../form/Form';
import { buildBindings } from '../../../helpers';

const SPACE_INCLUDES =
  'datastoreFormAttributeDefinitions,spaceAttributeDefinitions,teamAttributeDefinitions,userAttributeDefinitions,userProfileAttributeDefinitions';
const KAPP_INCLUDES =
  'formAttributeDefinitions,kappAttributeDefinitions,fields';

const dataSources = ({ kappSlug, name }) => ({
  space: {
    fn: fetchSpace,
    params: [{ include: SPACE_INCLUDES }],
    transform: result => result.space,
  },
  kapp: {
    fn: fetchKapp,
    params: kappSlug && [{ kappSlug, include: KAPP_INCLUDES }],
    transform: result => result.kapp,
  },
  webhook: {
    fn: fetchWebhook,
    params: name && [{ kappSlug, webhookName: name }],
    transform: result => result.webhook,
  },
  events: {
    fn: kappSlug ? fetchKappWebhookEvents : fetchSpaceWebhookEvents,
    params: [],
  },
});

const handleSubmit = ({ kappSlug, name }) => values =>
  (name ? updateWebhook : createWebhook)({
    webhook: values.toJS(),
    kappSlug,
    webhookName: name,
  }).then(({ webhook, error }) => {
    if (error) {
      throw (error.statusCode === 400 && error.message) ||
        'There was an error saving the webhook';
    }
    return webhook;
  });

const fields = ({ kappSlug, name }) => ({ webhook }) =>
  (!name || webhook) && [
    {
      name: 'name',
      label: 'Name',
      type: 'text',
      required: true,
      initialValue: webhook ? webhook.get('name') : '',
    },
    {
      name: 'type',
      label: 'Type',
      type: 'select',
      required: true,
      initialValue: webhook ? webhook.get('type') : '',
      options: ({ events }) =>
        events
          ? events
              .keySeq()
              .sort()
              .map(type => Map({ label: type, value: type }))
          : List(),
      onChange: (bindings, { setValue }) => {
        setValue('event', '');
      },
    },
    {
      name: 'event',
      label: 'Event',
      type: 'select',
      required: true,
      initialValue: webhook ? webhook.get('event') : '',
      options: ({ values, events }) =>
        values && events
          ? events
              .get(values.get('type'), List())
              .map(event => Map({ label: event, value: event }))
          : List(),
    },
    {
      name: 'filter',
      label: 'Filter',
      type: 'code',
      initialValue: webhook ? webhook.get('filter') : '',
      options: ({ space, kapp, values }) =>
        buildBindings({ space, kapp, scope: values.get('type') }),
    },
    {
      name: 'url',
      label: 'URL',
      type: 'code-template',
      required: true,
      initialValue: webhook ? webhook.get('url') : '',
      options: ({ space, kapp, values }) =>
        buildBindings({ space, kapp, scope: values.get('type') }),
    },
    {
      name: 'authStrategy',
      label: 'Authentication Strategy',
      type: 'radio',
      options: [
        { label: 'None', value: '' },
        { label: 'Signature', value: 'Signature' },
      ],
      onChange: ({ values }, { setValue }) => {
        // Do not reset the change secret field for new webhooks because it will
        // be hidden and should remain true because secret should always be
        // applied for new webhooks.
        if (values.get('authStrategy') !== 'Signature' && !!name) {
          setValue('changeSecret', false);
        }
      },
      initialValue:
        webhook && webhook.getIn(['authStrategy', 'type']) === 'Signature'
          ? 'Signature'
          : '',
      serialize: ({ values }) =>
        values.get('authStrategy') === 'Signature'
          ? {
              type: 'Signature',
              properties: [
                { name: 'Key', value: values.get('key') },
                values.get('changeSecret')
                  ? {
                      name: 'Secret',
                      sensitive: true,
                      value: values.get('secret'),
                    }
                  : { name: 'Secret', sensitive: true },
              ],
            }
          : null,
    },
    {
      name: 'key',
      label: 'Key',
      type: 'text',
      transient: true,
      required: ({ values }) => values.get('authStrategy') === 'Signature',
      visible: ({ values }) => values.get('authStrategy') === 'Signature',
      initialValue:
        webhook && webhook.getIn(['authStrategy', 'type']) === 'Signature'
          ? webhook
              .getIn(['authStrategy', 'properties'])
              .find(property => property.get('name') === 'Key')
              .get('value')
          : '',
    },
    {
      name: 'secret',
      label: 'Secret',
      type: 'password',
      transient: true,
      visible: ({ values }) =>
        values.get('authStrategy') === 'Signature' &&
        values.get('changeSecret'),
    },
    // Change secret drives whether or not the secret field should be visible and
    // applied when saving. For new webhooks the secret field should always be
    // applied so this field defaults to true (because it still drives the other
    // conditions) but does not need to be visible.
    {
      name: 'changeSecret',
      label: 'Change Secret',
      type: 'checkbox',
      transient: true,
      visible: ({ values }) =>
        !!name && values.get('authStrategy') === 'Signature',
      initialValue: !name,
    },
  ];

export const WebhookForm = ({
  addFields,
  alterFields,
  fieldSet,
  formKey,
  components,
  onSave,
  onError,
  children,
  kappSlug,
  name,
}) => (
  <Form
    addFields={addFields}
    alterFields={alterFields}
    fieldSet={fieldSet}
    formKey={formKey}
    components={components}
    onSubmit={handleSubmit}
    onSave={onSave}
    onError={onError}
    dataSources={dataSources}
    fields={fields}
    formOptions={{ kappSlug, name }}
  >
    {children}
  </Form>
);

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
import { generateForm } from '../../form/Form';
import { buildCodeEditorBindings } from '../../../helpers';

const SPACE_INCLUDES =
  'formAttributeDefinitions,spaceAttributeDefinitions,teamAttributeDefinitions,userAttributeDefinitions,userProfileAttributeDefinitions';
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

const generateCodeBindings = ({ space, kapp, values }) =>
  buildCodeEditorBindings({
    space: {
      attributeDefinitions: space?.get('spaceAttributeDefinitions'),
    },
    user: values.get('type') === 'User' && {
      attributeDefinitions: space?.get('userAttributeDefinitions'),
      profileAttributeDefinitions: space?.get(
        'userProfileAttributeDefinitions',
      ),
    },
    team: values.get('type') === 'Team' && {
      attributeDefinitions: space?.get('teamAttributeDefinitions'),
    },
    kapp: ['Form', 'Submission'].includes(values.get('type')) && {
      attributeDefinitions: kapp?.get('kappAttributeDefinitions'),
    },
    form: ['Form', 'Submission'].includes(values.get('type')) && {
      attributeDefinitions: kapp?.get('formAttributeDefinitions'),
    },
    submission: values.get('type') === 'Submission' && { detailed: true },
    values: values.get('type') === 'Submission' &&
      kapp?.get('fields').size > 0 && { data: kapp.get('fields') },
  });

const fields = ({ name }) => ({ webhook }) =>
  (!name || webhook) && [
    {
      name: 'name',
      label: 'Name',
      type: 'text',
      required: true,
      initialValue: webhook ? webhook.get('name') : '',
      helpText:
        'User friendly name for the webhook. Generally a combination of Type and Event.',
    },
    {
      name: 'type',
      label: 'Type',
      type: 'select',
      required: true,
      initialValue: webhook ? webhook.get('type') : '',
      helpText: 'Where the webhook is triggered from.',
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
      helpText: 'The event triggering the webhook.',
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
      language: 'js-expression',
      initialValue: webhook ? webhook.get('filter') : '',
      helpText:
        'Optional parameters limiting the events than can trigger a webhook. Click the </> button to see available insert values.',
      options: generateCodeBindings,
    },
    {
      name: 'url',
      label: 'URL',
      type: 'code',
      language: 'js-template',
      required: true,
      initialValue: webhook ? webhook.get('url') : '',
      helpText:
        'Location of the platform workflow or external system to pass information to. Click the </> button to see available insert values.',
      options: generateCodeBindings,
    },
  ];

export const WebhookForm = generateForm({
  formOptions: ['kappSlug', 'name'],
  dataSources,
  fields,
  handleSubmit,
});

WebhookForm.displayName = 'WebhookForm';

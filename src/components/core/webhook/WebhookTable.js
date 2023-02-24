import {
  fetchWebhooks,
  fetchKappWebhookEvents,
  fetchSpaceWebhookEvents,
} from '../../../apis';
import { generateTable } from '../../table/Table';
import { defineFilter } from '../../../helpers';
import { List, Map } from 'immutable';

const clientSide = defineFilter(true)
  .startsWith('name', 'name')
  .equals('type', 'type')
  .equals('event', 'event')
  .end();

const dataSource = ({ scope, kappSlug }) => ({
  fn: fetchWebhooks,
  clientSide,
  params: () => [
    {
      include: 'details',
      scope,
      kappSlug,
    },
  ],
  transform: result => ({
    data: result.webhooks,
  }),
});

const filterDataSources = ({ kappSlug }) => ({
  events: {
    fn: kappSlug ? fetchKappWebhookEvents : fetchSpaceWebhookEvents,
    params: [],
    transform: result => result,
  },
});

const filters = () => ({ events, values }) =>
  events && [
    { name: 'name', label: 'Name', type: 'text' },
    {
      name: 'type',
      label: 'Type',
      type: 'select',
      options: ({ events }) =>
        events
          ? events
              .keySeq()
              .sort()
              .map(type => Map({ label: type, value: type }))
          : List(),
      onChange: ({ values }, { setValue }) => {
        if (values.get('event')) {
          setValue('event', '');
        }
      },
    },
    {
      name: 'event',
      label: 'Event',
      type: 'select',
      options: ({ values, events }) =>
        values && events
          ? events
              .get(values.get('type'), List())
              .map(event => Map({ label: event, value: event }))
          : List(),
    },
  ];

const columns = [
  { value: 'createdAt', title: 'Created' },
  { value: 'createdBy', title: 'Created By' },
  { value: 'event', title: 'Event' },
  { value: 'filter', title: 'Filter' },
  { value: 'name', title: 'Name' },
  { value: 'type', title: 'Type' },
  { value: 'updatedAt', title: 'Updated' },
  { value: 'updatedBy', title: 'Updated By' },
  { value: 'url', title: 'URL' },
];

export const WebhookTable = generateTable({
  tableOptions: ['scope', 'kappSlug'],
  columns,
  filters,
  filterDataSources,
  dataSource,
});

WebhookTable.displayName = 'WebhookTable';

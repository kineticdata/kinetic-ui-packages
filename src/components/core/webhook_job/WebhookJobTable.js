import { fetchWebhooks, fetchWebhookJobs } from '../../../apis';
import { generateTable } from '../../table/Table';
import { List, Map } from 'immutable';

const dataSource = ({ scope, kappSlug, status }) => ({
  fn: fetchWebhookJobs,
  params: paramData => [
    {
      include: 'details',
      scope,
      kappSlug,
      status,
      limit: paramData.pageSize,
      pageToken: paramData.nextPageToken,
      webhook: paramData.filters.get('name') || undefined, // required by the API, can't pass empty webhook= param
    },
  ],
  transform: result => ({
    data: result.webhookJobs,
    nextPageToken: result.nextPageToken,
  }),
});

const filterDataSources = ({ kappSlug }) => ({
  definitions: {
    fn: fetchWebhooks,
    params: () => [{ kappSlug }],
    transform: result => result.webhooks,
  },
});

const filters = () => ({ values, definitions }) =>
  definitions && [
    {
      name: 'name',
      label: 'Webhook Name',
      type: 'select',
      options: ({ definitions }) =>
        definitions
          ? List(definitions).map(definition =>
              Map({
                label: definition.get('name'),
                value: definition.get('name'),
              }),
            )
          : List(),
    },
  ];

const columns = [
  {
    value: 'createdAt',
    title: 'Created At',
    toggleable: true,
  },
  {
    value: 'createdBy',
    title: 'Created By',
    toggleable: true,
  },
  {
    value: 'event',
    title: 'Event',
    toggleable: true,
  },
  {
    value: 'id',
    title: 'ID',
    toggleable: true,
  },
  {
    value: 'name',
    title: 'Name',
    toggleable: true,
  },
  {
    value: 'parentId',
    title: 'Parent ID',
    toggleable: true,
  },
  {
    value: 'requestContent',
    title: 'Request Content',
    toggleable: true,
  },
  {
    value: 'responseContent',
    title: 'Response Content',
    toggleable: true,
  },
  {
    value: 'retryCount',
    title: 'Retry Count',
    toggleable: true,
  },
  {
    value: 'scheduledAt',
    title: 'Scheduled At',
    toggleable: false,
    columnOrder: 'first',
  },
  {
    value: 'scopeId',
    title: 'Scope ID',
    toggleable: true,
  },
  {
    value: 'scopeType',
    title: 'Scope Type',
    toggleable: true,
  },
  {
    value: 'status',
    title: 'Status',
    toggleable: true,
  },
  {
    value: 'summary',
    title: 'Summary',
    toggleable: true,
  },
  {
    value: 'type',
    title: 'Type',
    toggleable: true,
  },
  {
    value: 'updatedAt',
    title: 'Updated At',
    toggleable: true,
  },
  {
    value: 'updatedBy',
    title: 'Updated By',
    toggleable: true,
  },
  {
    value: 'url',
    title: 'URL',
    toggleable: true,
  },
  {
    value: 'webhookId',
    title: 'Webhook ID',
    toggleable: true,
  },
];

export const WebhookJobTable = generateTable({
  tableOptions: ['scope', 'kappSlug', 'status'],
  columns,
  filters,
  filterDataSources,
  dataSource,
  sortable: false,
});

WebhookJobTable.displayName = 'WebhookJobTable';

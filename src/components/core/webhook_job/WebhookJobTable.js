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
  { value: 'createdAt', title: 'Created' },
  { value: 'createdBy', title: 'Created By' },
  { value: 'event', title: 'Event' },
  { value: 'id', title: 'ID' },
  { value: 'name', title: 'Name' },
  { value: 'parentId', title: 'Parent ID' },
  { value: 'requestContent', title: 'Request Content' },
  { value: 'responseContent', title: 'Response Content' },
  { value: 'retryCount', title: 'Retry Count' },
  { value: 'scheduledAt', title: 'Scheduled At' },
  { value: 'scopeId', title: 'Scope ID' },
  { value: 'scopeType', title: 'Scope Type' },
  { value: 'status', title: 'Status' },
  { value: 'summary', title: 'Summary' },
  { value: 'type', title: 'Type' },
  { value: 'updatedAt', title: 'Updated' },
  { value: 'updatedBy', title: 'Updated By' },
  { value: 'url', title: 'URL' },
  { value: 'webhookId', title: 'Webhook ID' },
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

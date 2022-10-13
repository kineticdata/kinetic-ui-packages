import { generateTable } from '../../table/Table';
import { fetchLogs } from '../../../apis';
import moment from 'moment';

const EXCLUDED_FILTERS = ['startTime', 'endTime', 'timestampPreset'];

export const generateLogQuery = appliedFilters => {
  const filters = JSON.stringify(
    appliedFilters
      .filter((_v, k) => !EXCLUDED_FILTERS.includes(k))
      .filter(filter => filter !== '')
      .toJSON(),
  );

  const q = filters === '{}' ? undefined : filters;
  const preset = appliedFilters.get('timestampPreset');

  let startDate, endDate;
  if (preset && preset !== 'custom') {
    const minutes = Number.parseInt(preset, 10);
    startDate = moment()
      .subtract(minutes, 'minutes')
      .format();
    endDate = '';
  } else {
    startDate = appliedFilters.get('startTime', '');
    endDate = appliedFilters.get('endTime', '');
  }

  const start =
    startDate === '' && endDate === ''
      ? moment()
          .subtract(60, 'minutes')
          .toISOString()
      : startDate === '' && endDate !== ''
        ? moment(endDate)
            .subtract(60, 'minutes')
            .toISOString()
        : moment(startDate).toISOString();
  const end =
    endDate === '' ? moment().toISOString() : moment(endDate).toISOString();

  return {
    q,
    start,
    end,
  };
};

const dataSource = () => ({
  fn: fetchLogs,
  params: paramData => {
    const { q, start, end } = generateLogQuery(paramData.filters);
    const fetchParams = [
      {
        q,
        limit: paramData.pageSize,
        nextPageToken: paramData.nextPageToken,
        start,
        end,
      },
    ];
    return fetchParams;
  },
  transform: result => ({
    data: result.logs.filter(entry => entry.hasOwnProperty('app.component')),
    nextPageToken: result.nextPageToken,
  }),
});

const APP_COMPONENT_OPTIONS = ['agent', 'core', 'loghub', 'task'].map(
  component => ({
    label: component,
    value: component,
  }),
);

const LEVEL_OPTIONS = ['TRACE', 'DEBUG', 'INFO', 'WARN', 'ERROR'].map(
  level => ({
    label: level,
    value: level,
  }),
);

const TIMESTAMP_PRESET_OPTIONS = [
  { label: 'Last 10 Minutes', value: '10' },
  { label: 'Last 20 Minutes', value: '20' },
  { label: 'Last 1 Hour', value: '60' },
  { label: 'Last 4 Hours', value: '240' },
  { label: 'Custom', value: 'custom' },
];

const filters = () => () => [
  {
    name: 'app.component',
    label: 'Component',
    type: 'select',
    options: APP_COMPONENT_OPTIONS,
  },
  { name: 'app.correlationId', label: 'Correlation ID', type: 'text' },
  { name: 'app.user', label: 'User', type: 'text' },
  { name: 'app.responseStatus', label: 'Response Status', type: 'text' },
  { name: 'level', label: 'Level', type: 'select', options: LEVEL_OPTIONS },
  { name: 'message', label: 'Message', type: 'text' },
  {
    name: 'startTime',
    label: 'Start Date',
    type: 'datetime',
    visible: ({ values }) => values.get('timestampPreset') === 'custom',
  },
  {
    name: 'endTime',
    label: 'End Date',
    type: 'datetime',
    visible: ({ values }) => values.get('timestampPreset') === 'custom',
  },
  {
    name: 'timestampPreset',
    label: 'Timestamp',
    type: 'radio',
    initialValue: '60',
    options: TIMESTAMP_PRESET_OPTIONS,
    onChange: ({ values }, { setValue }) => {
      if (values.get('timestampPreset') !== 'custom') {
        setValue('startTime', '');
        setValue('endTime', '');
      }
    },
  },
];

const columns = [
  {
    value: 'timestamp',
    title: 'Timestamp',
    sortable: false,
  },
  {
    value: 'message',
    title: 'Message',
    sortable: false,
  },
  {
    value: 'level',
    title: 'Level',
    sortable: false,
  },
  {
    value: 'app.component',
    title: 'Component',
    sortable: false,
  },
  {
    value: 'app.correlationId',
    title: 'Correlation ID',
    sortable: false,
  },
  {
    value: 'app.instanceId',
    title: 'Instance ID',
    sortable: false,
  },
  {
    value: 'app.requestId',
    title: 'Request ID',
    sortable: false,
  },
  {
    value: 'app.sessionId',
    title: 'Session ID',
    sortable: false,
  },
  {
    value: 'app.user',
    title: 'User',
    sortable: false,
  },

  {
    value: 'app.requestAddressChain',
    title: 'Request Address Chain',
    sortable: false,
  },

  {
    value: 'app.requestMethod',
    title: 'Request Method',
    sortable: false,
  },

  {
    value: 'app.requestOriginAddress',
    title: 'Request Origin Address',
    sortable: false,
  },

  {
    value: 'app.requestPath',
    title: 'Request Path',
    sortable: false,
  },

  {
    value: 'app.requestProtocol',
    title: 'Request Protocol',
    sortable: false,
  },

  {
    value: 'app.requestQuery',
    title: 'Request Query',
    sortable: false,
  },

  {
    value: 'app.responseStatus',
    title: 'Response Status',
    sortable: false,
  },

  {
    value: 'app.responseTime',
    title: 'Response Time',
    sortable: false,
  },

  {
    value: 'app.authEvent',
    title: 'Auth Event',
    sortable: false,
  },

  {
    value: 'app.authMessage',
    title: 'Auth Message',
    sortable: false,
  },

  {
    value: 'app.authPrincipal',
    title: 'Auth Principal',
    sortable: false,
  },

  {
    value: 'app.authStrategy',
    title: 'Auth Strategy',
    sortable: false,
  },

  {
    value: 'k8s.container',
    title: 'Container',
    sortable: false,
  },
  {
    value: 'k8s.namespace',
    title: 'Namespace',
    sortable: false,
  },
  {
    value: 'k8s.nodeAddress',
    title: 'Node Address',
    sortable: false,
  },
  {
    value: 'k8s.nodeName',
    title: 'Node Name',
    sortable: false,
  },
  {
    value: 'k8s.pod',
    title: 'Pod',
    sortable: false,
  },
];

export const LogTable = generateTable({ columns, dataSource, filters });

LogTable.displayName = 'LogTable';
LogTable.columns = columns.map(c => c.value);

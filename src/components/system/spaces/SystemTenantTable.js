import { generateTable } from '../../table/Table';
import { fetchTenants } from '../../../apis';
import { defineFilter } from '../../../helpers';

const clientSide = defineFilter(true)
  .startsWith('slug', 'slug')
  .startsWith('space.name', 'space.name')
  .end();

const dataSource = () => ({
  fn: fetchTenants,
  clientSide,
  params: () => [],
  transform: result => ({
    data: result.tenants,
    nextPageToken: result.nextPageToken,
  }),
});

const filters = () => () => [
  { name: 'slug', label: 'Slug', type: 'text' },
  { name: 'space.name', label: 'Name', type: 'text' },
];

const columns = [
  {
    value: 'slug',
    title: 'Slug',
    sortable: false,
  },
  {
    value: 'task.deployment.namespace',
    title: 'Namespace',
    sortable: false,
    valueTransform: (_value, row) =>
      row.getIn(['task', 'deployment', 'namespace']),
  },
  {
    value: 'task.deployment.image',
    title: 'Task Image',
    sortable: false,
    valueTransform: (_value, row) => row.getIn(['task', 'deployment', 'image']),
  },
  {
    value: 'space.name',
    title: 'Name',
    sortable: false,
    valueTransform: (_value, row) => row.getIn(['space', 'name']),
  },
  {
    value: 'space.status',
    title: 'Status',
    sortable: false,
    valueTransform: (_value, row) => row.getIn(['space', 'status']),
  },
  {
    value: 'space.statusMessage',
    title: 'Status Message',
    sortable: false,
    valueTransform: (_value, row) => row.getIn(['space', 'statusMessage']),
  },
  {
    value: 'space.createdAt',
    title: 'Created At',
    sortable: false,
    valueTransform: (_value, row) => row.getIn(['space', 'createdAt']),
  },
  {
    value: 'space.createdBy',
    title: 'Created By',
    sortable: false,
    valueTransform: (_value, row) => row.getIn(['space', 'createdBy']),
  },
  {
    value: 'space.updatedAt',
    title: 'Updated At',
    sortable: false,
    valueTransform: (_value, row) => row.getIn(['space', 'updatedAt']),
  },
  {
    value: 'space.updatedBy',
    title: 'Updated By',
    sortable: false,
    valueTransform: (_value, row) => row.getIn(['space', 'updatedBy']),
  },
  {
    value: 'space.afterLogoutPath',
    title: 'After Logout Path',
    sortable: false,
    valueTransform: (_value, row) => row.getIn(['space', 'afterLogoutPath']),
  },
  {
    value: 'space.bundlePath',
    title: 'Bundle Path',
    sortable: false,
    valueTransform: (_value, row) => row.getIn(['space', 'bundlePath']),
  },
  {
    value: 'space.customTranslationContexts',
    title: 'Custom Translation Contexts',
    sortable: false,
    valueTransform: (_value, row) =>
      row.getIn(['space', 'customTranslationContexts']),
  },
  {
    value: 'space.defaultFormConfirmationPage',
    title: 'Default Form Confirmation Page',
    sortable: false,
    valueTransform: (_value, row) =>
      row.getIn(['space', 'defaultFormConfirmationPage']),
  },
  {
    value: 'space.defaultFormDisplayPage',
    title: 'Default Form Display Page',
    sortable: false,
    valueTransform: (_value, row) =>
      row.getIn(['space', 'defaultFormDisplayPage']),
  },
  {
    value: 'space.defaultLocale',
    title: 'Default Locale',
    sortable: false,
    valueTransform: (_value, row) => row.getIn(['space', 'defaultLocale']),
  },
  {
    value: 'space.defaultTimezone',
    title: 'Default Timezone',
    sortable: false,
    valueTransform: (_value, row) => row.getIn(['space', 'defaultTimezone']),
  },
  {
    value: 'space.displayType',
    title: 'Display Type',
    sortable: false,
    valueTransform: (_value, row) => row.getIn(['space', 'displayType']),
  },
  {
    value: 'space.displayValue',
    title: 'Display Value',
    sortable: false,
    valueTransform: (_value, row) => row.getIn(['space', 'displayValue']),
  },
  {
    value: 'space.enabledLocales',
    title: 'Enabled Locales',
    sortable: false,
    valueTransform: (_value, row) => row.getIn(['space', 'enabledLocales']),
  },
  {
    value: 'space.loginPage',
    title: 'Login Page',
    sortable: false,
    valueTransform: (_value, row) => row.getIn(['space', 'loginPage']),
  },
  {
    value: 'space.resetPasswordPage',
    title: 'Reset Password Page',
    sortable: false,
    valueTransform: (_value, row) => row.getIn(['space', 'resetPasswordPage']),
  },
  {
    value: 'space.sessionInactiveLimitInSeconds',
    title: 'Session Inactive Limit in Seconds',
    sortable: false,
    valueTransform: (_value, row) =>
      row.getIn(['space', 'sessionInactiveLimitInSeconds']),
  },
  {
    value: 'space.sharedBundleBase',
    title: 'Shared Bundle Base',
    sortable: false,
    valueTransform: (_value, row) => row.getIn(['space', 'sharedBundleBase']),
  },
  {
    value: 'space.trustedFrameDomains',
    title: 'Trusted Frame Domains',
    sortable: false,
    valueTransform: (_value, row) =>
      row.getIn(['space', 'trustedFrameDomains']),
  },
  {
    value: 'space.trustedResourceDomains',
    title: 'Trusted Resource Domains',
    sortable: false,
    valueTransform: (_value, row) =>
      row.getIn(['space', 'trustedResourceDomains']),
  },
];

export const SystemTenantTable = generateTable({
  columns,
  filters,
  dataSource,
});

SystemTenantTable.displayName = 'SystemTenantTable';

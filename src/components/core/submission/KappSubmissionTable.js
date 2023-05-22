import { getIn, List, Map, Set } from 'immutable';
import { generateTable } from '../../table/Table';
import {
  fetchForm,
  fetchKapp,
  searchSubmissions,
  SubmissionSearch,
  VALID_KAPP_CORE_STATES,
} from '../../../apis';

const applyMeta = (query, op, rvalue) => (rvalue ? query[op](rvalue) : query);

const applyOp = (query, op, lvalue, rvalue) =>
  rvalue ? query[op](lvalue, rvalue) : query;

const submissionSearch = (
  { filters, pageSize, sortColumn, sortDirection },
  include,
) => {
  const query = new SubmissionSearch()
    .includes(
      Set([
        ...(typeof include === 'string'
          ? include.split(',')
          : Array.isArray(include)
            ? include
            : []),
        'details',
        'form',
      ]).toJS(),
    )
    .sortBy(sortColumn || 'createdAt')
    .sortDirection(sortDirection.toLocaleUpperCase())
    .limit(pageSize);
  applyMeta(query, 'coreState', filters.get('coreState'));
  applyMeta(
    query,
    'startDate',
    filters.get('startDate') &&
      new Date(`${filters.get('startDate')}T00:00:00`),
  );
  applyMeta(
    query,
    'endDate',
    filters.get('endDate') && new Date(`${filters.get('endDate')}T00:00:00`),
  );
  applyOp(query, 'eq', 'handle', filters.get('handle'));
  applyOp(
    query,
    'eq',
    'submittedBy',
    filters.getIn(['submittedBy', 'username']),
  );
  filters
    .get('values', Map())
    .forEach((value, field) => applyOp(query, 'eq', `values[${field}]`, value));
  return query.build();
};

const dataSource = ({ formSlug, kappSlug, include }) => {
  return {
    fn: searchSubmissions,
    params: paramData => [
      {
        kapp: kappSlug,
        form: paramData.filters.getIn(['form', 'slug'], formSlug),
        pageToken: paramData.nextPageToken,
        search: submissionSearch(paramData, include),
      },
    ],
    transform: result => ({
      data: result.submissions,
      nextPageToken: result.nextPageToken,
    }),
  };
};

const onValidateFilters = filters =>
  filters
    .getIn(['values', 'value'], List())
    .reduce(
      (valid, value) =>
        valid && value.get('field') !== '' ? value.get('value') !== '' : valid,
      true,
    );

const filterDataSources = ({ kappSlug, formSlug }) => ({
  kapp: {
    fn: fetchKapp,
    params: [{ kappSlug, include: 'fields' }],
    transform: result => result.kapp,
  },
  form: {
    fn: formSlug =>
      formSlug ? fetchForm({ kappSlug, formSlug, include: 'fields' }) : null,
    params: ({ values }) => [getIn(values, ['form', 'slug'], formSlug)],
    transform: result => result && result.form,
  },
  fieldOptions: {
    fn: (form, kapp) =>
      form ? form.get('fields').toArray() : kapp.get('fields').toArray(),
    params: ({ form, kapp }) => kapp && [form, kapp],
    transform: result =>
      result.map(field => ({
        label: field.get('name'),
        value: field.get('name'),
      })),
  },
  coreStateOptions: {
    fn: () => VALID_KAPP_CORE_STATES,
    params: [],
    transform: coreStates =>
      coreStates.map(coreState => ({ label: coreState, value: coreState })),
  },
});

const filters = ({ kappSlug, formSlug }) => ({ coreStateOptions }) =>
  coreStateOptions && [
    { label: 'Start Date', name: 'startDate', type: 'date' },
    { label: 'End Date', name: 'endDate', type: 'date' },
    {
      label: 'Handle',
      name: 'handle',
      pattern: /[A-F0-9]{6}/,
      patternMessage:
        'Handles only contain characters A-F and 0-9, and are exactly 6 characters long',
      type: 'text',
    },
    !formSlug && {
      label: 'Form',
      name: 'form',
      type: 'form',
      search: { kappSlug },
    },
    { label: 'Submitted By', name: 'submittedBy', type: 'user' },
    {
      label: 'State',
      name: 'coreState',
      type: 'select',
      options: coreStateOptions,
    },
    {
      label: 'Values',
      name: 'values',
      type: 'map',
      options: ({ fieldOptions }) => fieldOptions,
    },
  ];

const columns = [
  {
    value: 'closedAt',
    title: 'Closed At',
    sortable: true,
    toggleable: true,
  },
  {
    value: 'closedBy',
    title: 'closedBy',
    sortable: false,
    toggleable: true,
  },
  {
    value: 'coreState',
    title: 'Core State',
    sortable: false,
    toggleable: true,
  },
  {
    value: 'createdAt',
    title: 'Created',
    sortable: true,
    toggleable: true,
  },
  {
    value: 'createdBy',
    title: 'Created By',
    sortable: false,
    toggleable: true,
  },
  {
    value: 'currentPage',
    title: 'Current Page',
    sortable: false,
    toggleable: true,
  },
  {
    value: 'handle',
    title: 'Handle',
    sortable: false,
    toggleable: false,
    columnOrder: 'first',
  },
  {
    value: 'id',
    title: 'Id',
    sortable: false,
    toggleable: true,
  },
  {
    value: 'label',
    title: 'Label',
    sortable: false,
    toggleable: true,
  },
  {
    value: 'origin',
    title: 'Origin',
    sortable: false,
    toggleable: true,
  },
  {
    value: 'parent',
    title: 'Parent',
    sortable: false,
    toggleable: true,
  },
  {
    value: 'sessionToken',
    title: 'Session Token',
    sortable: false,
    toggleable: true,
  },
  {
    value: 'submittedAt',
    title: 'Submitted At',
    sortable: true,
    toggleable: true,
  },
  {
    value: 'submittedBy',
    title: 'Submitted By',
    sortable: false,
    toggleable: true,
  },
  {
    value: 'type',
    title: 'Type',
    sortable: false,
    toggleable: true,
  },
  {
    value: 'updatedAt',
    title: 'Updated',
    sortable: true,
    toggleable: true,
  },
  {
    value: 'updatedBy',
    title: 'Updated By',
    sortable: false,
    toggleable: true,
  },
];

export const KappSubmissionTable = generateTable({
  tableOptions: ['kappSlug', 'formSlug', 'datastore', 'include'],
  columns,
  dataSource,
  filterDataSources,
  filters,
  onValidateFilters,
});

KappSubmissionTable.displayName = 'KappSubmissionTable';
export default KappSubmissionTable;

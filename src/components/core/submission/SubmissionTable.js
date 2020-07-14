import { getIn, List, Map } from 'immutable';
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

const submissionSearch = ({ filters, pageSize, sortColumn, sortDirection }) => {
  const query = new SubmissionSearch()
    .includes(['details', 'form'])
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
  filters.get('values', Map()).forEach((value, field) => {
    if (typeof value === 'number') {
      applyOp(query, 'eq', `values[${field}]`, value);
    } else {
      applyOp(query, 'eq', `values[${value.get('field')}]`, value.get('value'));
    }
  });
  return query.build();
};

const dataSource = ({ formSlug, kappSlug }) => {
  return {
    fn: searchSubmissions,
    params: paramData => [
      {
        kapp: kappSlug,
        form: paramData.filters.getIn(['form', 'slug'], formSlug),
        pageToken: paramData.nextPageToken,
        search: submissionSearch(paramData),
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

const filters = ({ kappSlug, formSlug }) => ({
  coreStateOptions,
  form,
  forms,
}) =>
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
  },
  {
    value: 'closedBy',
    title: 'closedBy',
    sortable: false,
  },
  {
    value: 'coreState',
    title: 'Core State',
    sortable: false,
  },
  {
    value: 'createdAt',
    title: 'Created',
    sortable: true,
  },
  {
    value: 'createdBy',
    title: 'Created By',
    sortable: false,
  },
  {
    value: 'currentPage',
    title: 'Current Page',
    sortable: false,
  },
  {
    value: 'handle',
    title: 'Handle',
    sortable: false,
  },
  {
    value: 'id',
    title: 'Id',
    sortable: false,
  },
  {
    value: 'label',
    title: 'Label',
    sortable: false,
  },
  {
    value: 'origin',
    title: 'Origin',
    sortable: false,
  },
  {
    value: 'parent',
    title: 'Parent',
    sortable: false,
  },
  {
    value: 'sessionToken',
    title: 'Session Token',
    sortable: false,
  },
  {
    value: 'submittedAt',
    title: 'Submitted At',
    sortable: true,
  },
  {
    value: 'submittedBy',
    title: 'Submitted By',
    sortable: false,
  },
  {
    value: 'type',
    title: 'Type',
    sortable: false,
  },
  {
    value: 'updatedAt',
    title: 'Updated',
    sortable: true,
  },
  {
    value: 'updatedBy',
    title: 'Updated By',
    sortable: false,
  },
];

export const SubmissionTable = generateTable({
  tableOptions: ['kappSlug', 'formSlug', 'datastore'],
  columns,
  dataSource,
  filterDataSources,
  filters,
  onValidateFilters,
});

SubmissionTable.displayName = 'SubmissionTable';
export default SubmissionTable;

import { generateTable } from '../../table/Table';
import { searchSubmissions } from '../../../apis';
import {
  generatePaginationParams,
  transformCoreResult,
} from '../../../apis/http';
import { filterDataSources, filters } from './FormSubmissionFilters';
import { Set } from 'immutable';

const dataSource = ({ kappSlug, formSlug, include, count }) => ({
  fn: options => searchSubmissions(options),
  params: paramData => {
    const q = paramData.filters.getIn(['query', 'q']) || undefined;
    const orderBy =
      paramData.filters.getIn(['query', 'orderBy']) || 'createdAt';
    return [
      {
        form: formSlug,
        kapp: kappSlug,
        search: {
          direction: paramData.filters.get('orderDirection', 'DESC'),
          include: Set([
            ...(typeof include === 'string'
              ? include.split(',')
              : Array.isArray(include)
              ? include
              : []),
            'details',
          ]).toJS(),
          // need to pass undefined instead of null so the `q` parameter is not
          // added to the query string with empty value
          q,
          orderBy,
          ...generatePaginationParams(paramData),
        },
        count: count ? true : undefined,
      },
    ];
  },
  transform: transformCoreResult('submissions'),
});

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
    sortable: false,
    toggleable: true,
  },
  {
    value: 'updatedBy',
    title: 'Updated By',
    sortable: false,
    toggleable: true,
  },
];

export const FormSubmissionTable = generateTable({
  tableOptions: ['kappSlug', 'formSlug', 'include', 'count'],
  columns,
  dataSource,
  filters,
  filterDataSources,
});

FormSubmissionTable.displayName = 'FormSubmissionTable';
export default FormSubmissionTable;

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
  params: paramData => [
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
        q: paramData.filters.getIn(['query', 'q']) || undefined,
        orderBy:
          paramData.filters.getIn(['query', 'orderBy']) ||
          paramData.filters.getIn(['query', 'q'])
            ? undefined
            : 'updatedAt',
        ...generatePaginationParams(paramData),
      },
      count: count ? true : undefined,
    },
  ],
  transform: transformCoreResult('submissions'),
});

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
    sortable: false,
  },
  {
    value: 'updatedBy',
    title: 'Updated By',
    sortable: false,
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

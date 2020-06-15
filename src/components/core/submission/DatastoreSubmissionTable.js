import { generateTable } from '../../table/Table';
import { searchSubmissions } from '../../../apis';
import { generatePaginationParams } from '../../../apis/http';
import { filterDataSources, filters } from './DatastoreSubmissionFilters';

const dataSource = ({ formSlug }) => ({
  fn: searchSubmissions,
  params: paramData => [
    {
      datastore: true,
      form: formSlug,
      search: {
        direction: paramData.sortDirection,
        include: ['details'],
        index: paramData.filters.getIn(['query', 'index']),
        // need to pass undefined instead of null so the `q` parameter is not
        // added to the query string with empty value
        q: paramData.filters.getIn(['query', 'q']) || undefined,
        ...generatePaginationParams(paramData),
      },
    },
  ],
  transform: result => ({
    data: result.submissions,
    nextPageToken: result.nextPageToken,
  }),
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

export const DatastoreSubmissionTable = generateTable({
  tableOptions: ['formSlug'],
  columns,
  dataSource,
  filters,
  filterDataSources,
});

DatastoreSubmissionTable.displayName = 'DatastoreSubmissionTable';
export default DatastoreSubmissionTable;

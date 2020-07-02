import { generateTable } from '../../table/Table';
import { fetchForms, fetchFormTypes } from '../../../apis';
import t from 'prop-types';
import { defineKqlQuery } from '../../../helpers';
import {
  generatePaginationParams,
  generateSortParams,
} from '../../../apis/http';

const VALID_FORM_STATUES = ['New', 'Active', 'Inactive', 'Delete'].map(s => ({
  value: s,
  label: s,
}));

const filterDataSources = ({ kappSlug }) => ({
  types: {
    fn: fetchFormTypes,
    params: kappSlug && [{ kappSlug }],
    transform: result =>
      result.formTypes.map(type => ({ label: type.name, value: type.name })),
  },
});

const filters = ({ kappSlug }) => ({ types }) =>
  (!kappSlug || types) && [
    { name: 'name', label: 'Name', type: 'text' },
    { name: 'slug', label: 'Slug', type: 'text' },
    kappSlug && {
      name: 'type',
      label: 'Type',
      type: 'select',
      options: types,
    },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      options: () => VALID_FORM_STATUES,
    },
    {
      name: 'updatedBy',
      label: 'Updated By',
      type: 'user',
      serialize: ({ values }) => values.getIn(['updatedBy', 'username']),
    },
  ];

const formQuery = defineKqlQuery()
  .startsWith('name', 'name')
  .startsWith('slug', 'slug')
  .startsWith('updatedBy', 'updatedBy')
  .equals('type', 'type')
  .equals('status', 'status')
  .end();

const dataSource = ({
  kappSlug = null,
  datastore,
  manage = false,
  surveyList = false,
}) => ({
  fn: fetchForms,
  params: paramData => [
    {
      ...generateSortParams(paramData),
      ...generatePaginationParams(paramData),
      q: formQuery(paramData.filters.toJS()),
      include: `details${datastore ? ',indexDefinitions,backgroundJobs' : ''}`,
      datastore,
      kappSlug,
      manage,
    },
  ],
  transform: result => ({
    data: surveyList
      ? result.forms.filter(f => f.type === 'Survey')
      : result.forms,
    nextPageToken: result.nextPageToken,
  }),
});

const columns = [
  {
    value: 'name',
    title: 'Name',
    sortable: true,
  },
  {
    value: 'slug',
    title: 'Slug',
    sortable: true,
  },
  {
    value: 'createdAt',
    title: 'Created',
    sortable: true,
  },
  {
    value: 'createdBy',
    title: 'Created By',
  },
  {
    value: 'updatedAt',
    title: 'Updated At',
    sortable: true,
  },
  {
    value: 'updatedBy',
    title: 'Updated By',
    sortable: true,
  },
  {
    value: 'notes',
    title: 'Notes',
  },
  {
    value: 'status',
    title: 'Status',
    sortable: true,
  },
  {
    value: 'type',
    title: 'Type',
    sortable: true,
    filter: 'startsWith',
    type: 'text',
  },
  { value: 'submissionLabelExpression', title: 'Submission Label' },
];

export const FormTable = generateTable({
  tableOptions: ['kappSlug', 'datastore', 'manage', 'surveyList'],
  columns,
  filters,
  filterDataSources,
  dataSource,
});

FormTable.defaultProps = {};
FormTable.displayName = 'FormTable';
FormTable.propTypes = {
  /** Kapp Slug of associated forms to render.  */
  kappSlug: t.string,
  /** If datastore forms should be rendered.  */
  datastore: t.bool,
};

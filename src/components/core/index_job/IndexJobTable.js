import React from 'react';
import { fetchBackgroundJobs } from '../../../apis';
import { generateTable } from '../../table/Table';
import { defineFilter } from '../../../helpers';

const clientSide = defineFilter(true)
  .equals('status', 'status')
  .between('startedAt', 'minStartedAt', 'maxStartedAt')
  .end();

const indexJobStatuses = ['Running', 'Paused'];

const dataSource = ({ formSlug, kappSlug, completed = false }) => ({
  fn: () => fetchBackgroundJobs({ formSlug, kappSlug, completed }),
  clientSide,
  params: () => [],
  transform: result => ({
    data: result.backgroundJobs,
  }),
});

const filters = () => () => [
  {
    name: 'status',
    label: 'Status',
    type: 'select',
    options: indexJobStatuses.map(el => ({ value: el, label: el })),
  },
  {
    name: 'minStartedAt',
    label: 'Start',
    type: 'date',
  },
  {
    name: 'maxStartedAt',
    label: 'End',
    type: 'date',
  },
];

const columns = [
  {
    value: 'content',
    title: 'Content',
    components: {
      BodyCell: props => <td>{JSON.stringify(props.value)}</td>,
    },
    sortable: false,
    filterable: false,
  },
  {
    value: 'hung',
    title: 'Hung?',
  },
  { value: 'id', title: 'Job ID' },
  { value: 'message', title: 'Message' },
  { value: 'parent', title: 'Parent' },
  { value: 'parentType', title: 'Parent Type' },
  {
    value: 'progress',
    title: 'Progress',
    components: {
      BodyCell: props => <td>{`${props.value}`}</td>,
    },
  },
  { value: 'startedAt', title: 'Started At' },
  { value: 'startedBy', title: 'Started By' },
  { value: 'status', title: 'Status' },
  { value: 'type', title: 'Type' },
];

export const IndexJobTable = generateTable({
  tableOptions: ['formSlug', 'kappSlug', 'completed'],
  dataSource,
  columns,
  filters,
  sortable: false,
});
IndexJobTable.displayName = 'IndexJobTable';

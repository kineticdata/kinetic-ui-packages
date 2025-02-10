import React from 'react';
import { generateTable } from '../../table/Table';
import { fetchForm, fetchKapp, fetchSpace } from '../../../apis';
import { defineFilter } from '../../../helpers';

const clientSide = defineFilter(true)
  .startsWith('name', 'name')
  .equals('status', 'status')
  .equals('unique', 'unique')
  .end();

// const indexStatuses = ['New', 'Building', 'Built', 'Failed'];

const BooleanYesNoCell = props => <td>{props.value ? 'Yes' : 'No'}</td>;

const dataSource = ({ kappSlug, formSlug }) => ({
  fn:
    !kappSlug && !formSlug
      ? fetchSpace
      : kappSlug && !formSlug
        ? fetchKapp
        : fetchForm,
  clientSide,
  params: () => [
    {
      kappSlug,
      formSlug,
      include:
        'indexDefinitions,indexDefinitions.details,indexDefinitions.detachedForms,indexDefinitions.unpopulatedForms',
    },
  ],
  transform: result => ({
    data: (!kappSlug && !formSlug
      ? result.space
      : kappSlug && !formSlug
        ? result.kapp
        : result.form
    ).indexDefinitions,
  }),
});

const columns = [
  {
    value: 'name',
    title: 'Name',
    toggleable: false,
    columnOrder: 'first',
  },
  {
    value: 'status',
    title: 'Status',
    toggleable: true,
  },
  {
    value: 'unique',
    title: 'Unique',
    toggleable: true,
    components: {
      BodyCell: BooleanYesNoCell,
    },
  },
  {
    value: 'parts',
    title: 'Parts',
    toggleable: true,
  },
  {
    value: 'unpopulatedForms',
    title: 'Unpopulated Forms',
    toggleable: true,
  },
  {
    value: 'detatchedForms',
    title: 'Detatched Forms',
    toggleable: true,
  },
];

export const IndexDefinitionTable = generateTable({
  tableOptions: ['kappSlug', 'formSlug'],
  sortable: false,
  columns,
  // filters,
  dataSource,
});

IndexDefinitionTable.displayName = 'IndexDefinitionTable';

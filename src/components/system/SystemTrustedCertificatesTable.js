import { generateTable } from '../table/Table';
import { fetchTrustedCertificates } from '../../apis';
import { defineFilter } from '../../helpers';
import { List } from 'immutable';

const clientSide = defineFilter(true)
  .startsWith('subjectName', 'subjectName')
  .startsWith('issuerName', 'issuerName')
  .end();

const dataSource = ({ spaceSlug }) => ({
  fn: fetchTrustedCertificates,
  clientSide,
  params: () => [{ spaceSlug }],
  transform: result => ({
    data: List(result.trustedCertificates)
      .sortBy(({ subject }) =>
        (subject
          ? subject.commonName || subject.organization || ''
          : ''
        ).toLowerCase(),
      )
      .toArray(),
  }),
});

const filters = () => () => [
  { name: 'subjectName', label: 'Subject', type: 'text' },
  { name: 'issuerName', label: 'Issuer', type: 'text' },
];

const columns = [
  {
    value: 'subjectName',
    title: 'Subject',
    valueTransform: (value, row) =>
      row.getIn(
        ['subject', 'commonName'],
        row.getIn(['subject', 'organization']),
      ),
    sortable: true,
  },
  {
    value: 'issuerName',
    title: 'Issuer',
    valueTransform: (value, row) =>
      row.getIn(
        ['issuer', 'commonName'],
        row.getIn(['issuer', 'organization']),
      ),
    sortable: true,
  },
  {
    value: 'expires',
    title: 'Expires',
    valueTransform: (value, row) => row.getIn(['validTo']),
    sortable: false,
  },
];

export const SystemTrustedCertificatesTable = generateTable({
  tableOptions: ['spaceSlug'],
  columns,
  filters,
  dataSource,
});

SystemTrustedCertificatesTable.displayName = 'SystemTrustedCertificatesTable';

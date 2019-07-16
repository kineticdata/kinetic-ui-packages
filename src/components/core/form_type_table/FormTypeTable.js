import React from 'react';
import Table from '../../common/tables/Table';
import { fetchFormTypes } from '../../../apis/core';

const dataSource = ({ kappSlug }) => ({
  fn: fetchFormTypes,
  clientSideSearch: true,
  params: () => ({
    kappSlug,
  }),
  transform: result => {
    return {
      data: result.formTypes,
    };
  },
});

const columns = [
  {
    value: 'name',
    title: 'Form Type',
    filterable: true,
    sortable: false,
  },
];

const FormTypeTable = props => (
  <Table
    tableKey={props.tableKey}
    components={{
      ...props.components,
    }}
    dataSource={dataSource({
      kappSlug: props.kappSlug,
      attributeType: props.attributeType,
    })}
    columns={columns}
    addColumns={props.addColumns}
    alterColumns={props.alterColumns}
    columnSet={props.columnSet}
    pageSize={props.pageSize}
  >
    {props.children}
  </Table>
);

FormTypeTable.defaultProps = {
  columns,
};

export default FormTypeTable;

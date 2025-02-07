import React from 'react';

const stringifyProps = props =>
  JSON.stringify(
    props,
    // Make sure functions are stringified to an empty function string
    // instead of being omitted
    (k, v) => (typeof v === 'function' ? '() => {}' : v),
    2,
  );

export const mockTableConfig = {
  TableLayout: ({ header, body, footer, ...props }) => (
    <table data-testid="TableLayoutMock" data-props={stringifyProps(props)}>
      {header}
      {body}
      {footer}
    </table>
  ),
  Header: ({ headerRow, ...props }) => (
    <thead data-testid="HeaderMock" data-props={stringifyProps(props)}>
      {headerRow}
    </thead>
  ),
  HeaderRow: ({ columnHeaders, ...props }) => (
    <tr data-testid="HeaderRowMock" data-props={stringifyProps(props)}>
      {columnHeaders}
    </tr>
  ),
  HeaderCell: ({ title, columnControl, ...props }) => (
    <th data-testid="HeaderCellMock" data-props={stringifyProps(props)}>
      {title}
    </th>
  ),
  Body: ({ tableRows, ...props }) => (
    <tbody data-testid="BodyMock" data-props={stringifyProps(props)}>
      {tableRows}
    </tbody>
  ),
  BodyRow: ({ cells, ...props }) => (
    <tr data-testid="BodyRowMock" data-props={stringifyProps(props)}>
      {cells}
    </tr>
  ),
  BodyCell: ({ value, ...props }) => (
    <td data-testid="BodyCellMock" data-props={stringifyProps(props)}>
      {value}
    </td>
  ),
  Footer: ({ footerRow, ...props }) => (
    <tfoot data-testid="FooterMock" data-props={stringifyProps(props)}>
      {footerRow}
    </tfoot>
  ),
  FooterRow: ({ cells, ...props }) => (
    <tr data-testid="FooterRowMock" data-props={stringifyProps(props)}>
      {cells}
    </tr>
  ),
  FooterCell: props => (
    <td data-testid="FooterCellMock" data-props={stringifyProps(props)} />
  ),
  EmptyBodyRow: props => (
    <tr data-testid="EmptyBodyRowMock" data-props={stringifyProps(props)}>
      <td className="text-center" colSpan={props.colSpan}>
        <em>No data found.</em>
      </td>
    </tr>
  ),
  PaginationControl: props => (
    <div data-testid="PaginationControlMock" data-props={stringifyProps(props)}>
      <button>Previous</button>
      <button>Next</button>
    </div>
  ),
  FilterLayout: ({ filters, ...props }) => (
    <form data-testid="FilterLayoutMock" data-props={stringifyProps(props)}>
      {filters
        .map((filter, name) => (
          <React.Fragment key={name}>{filter}</React.Fragment>
        ))
        .toIndexedSeq()
        .toList()}
      <button type="submit">Search</button>
    </form>
  ),
  TextFilter: props => (
    <div data-testid="TextFilterMock" data-props={stringifyProps(props)} />
  ),
  BooleanFilter: props => (
    <div data-testid="BooleanFilterMock" data-props={stringifyProps(props)} />
  ),
  ColumnControl: props => (
    <div data-testid="ColumnControlMock" data-props={stringifyProps(props)} />
  ),

  fields: {
    FormLayout: ({ fields, error, buttons, ...props }) => (
      <form data-testid="FormLayoutMock" data-props={stringifyProps(props)} />
    ),
  },
};

export const TableViewMock = ({
  table,
  pagination,
  filter,
  columnControl,
  ...props
}) => (
  <div data-testid="TableViewMock" data-props={stringifyProps(props)}>
    {table}
    {pagination}
    {filter}
    {columnControl}
  </div>
);

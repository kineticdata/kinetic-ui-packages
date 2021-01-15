import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { compose, lifecycle } from 'recompose';
import { List, Map, mergeDeep } from 'immutable';
import { ComponentConfigContext } from '../common/ComponentConfigContext';
import { connect, dispatch } from '../../store';
import {
  configureTable,
  mountTable,
  unmountTable,
  isClientSide,
  filterFormKey,
} from './Table.redux';
import { generateKey } from '../../helpers';
import { generateForm } from '../form/Form';

const fromColumnSet = (columns, columnSet) =>
  columnSet.map(cs => columns.find(c => c.get('value') === cs));

const KeyWrapper = ({ children }) => children;

const TableComponent = props => {
  if (props.configured) {
    const {
      children,
      loading,
      initializing,
      rows,
      error,
      appliedFilters,
      components,
      tableKey,
      filterFormKey,
    } = props;
    const table = buildTable(props);
    const filter = components.FilterForm
      ? buildFilterForm(props)
      : buildFilterLayout(props);
    const pagination = buildPaginationControl(props);

    return children({
      tableKey,
      filterFormKey,
      table,
      filter,
      appliedFilters,
      pagination,
      initializing,
      loading,
      rows,
      error,
    });
  }
  return null;
};

const filterComponentByType = (components, type = 'text') =>
  type === 'boolean' ? components.BooleanFilter : components.TextFilter;

const buildField = ({
  filter,
  filters,
  components,
  columnComponents,
  tableKey,
  tableOptions,
  renderOptions,
}) => {
  const value = filter.get('value');
  const name = filter.getIn(['column', 'value']);
  const title = filter.getIn(['column', 'title']);
  const options = filter.getIn(['column', 'options'], () => [])(
    tableOptions,
    renderOptions,
  );
  const onChange = (value, filterName = name) => {
    dispatch('SET_FILTER', {
      tableKey,
      filter: filterName,
      value,
    });
  };

  const Filter = columnComponents.getIn(
    [name, 'Filter'],
    filterComponentByType(components, filter.getIn(['column', 'type'])),
  );

  return (
    <Filter
      value={value}
      name={name}
      title={title}
      onChange={onChange}
      options={options}
      tableOptions={tableOptions}
      filters={filters}
      visible
    />
  );
};

const filtersToFields = components =>
  Map({
    FormButtons: components.FilterFormButtons,
    FormError: components.FilterFormError,
    FormLayout: components.FilterFormLayout,

    AttributesField: components.AttributesFilter,
    CheckboxField: components.CheckboxFilter,
    CodeField: components.CodeFilter,
    FormField: components.FormFilter,
    FormMultiField: components.FormMultiFilter,
    PasswordField: components.PasswordFilter,
    RadioField: components.RadioFilter,
    TeamField: components.TeamFilter,
    TeamMultiField: components.TeamMultiFilter,
    SelectField: components.SelectFilter,
    SelectMultiField: components.SelectMultiFilter,
    TextField: components.TextFilter,
    TextMultiField: components.TextMultiFilter,
    UserField: components.UserFilter,
    UserMultiField: components.UserMultiFilter,
    TableField: components.TableFilter,
  }).filter(c => !!c);

const buildFilterForm = props => {
  const FilterForm = props.components.FilterForm;
  // Build the form filter components.
  const components = filtersToFields(props.components);

  return (
    <FilterForm
      {...props.tableOptions}
      formKey={props.filterFormKey}
      tableKey={props.tableKey}
      components={components}
      alterFields={props.alterFilters}
      fieldSet={props.filterSet}
      onSave={props.onSearch}
      appliedFilters={props.appliedFilters}
    />
  );
};

const buildFilterLayout = ({
  components,
  columnComponents,
  filters,
  appliedFilters,
  validFilters,
  tableKey,
  columnSet,
  loading,
  initializing,
  tableOptions,
  renderOptions,
}) => {
  // Add an onChange to each filter and convert it to a list for looping.
  const f = filters.map(filter =>
    buildField({
      appliedFilters,
      filter,
      filters,
      components,
      columnComponents,
      tableKey,
      tableOptions,
      renderOptions,
    }),
  );

  const onSearch = e => {
    if (e) {
      e.preventDefault();
    }
    dispatch('APPLY_FILTERS', { tableKey });
  };

  const onReset = e => {
    e.preventDefault();
    dispatch('CLEAR_TABLE_FILTERS', { tableKey });
    dispatch('APPLY_FILTERS', { tableKey });
  };

  const onClear = e => {
    e.preventDefault();
    dispatch('CLEAR_SELECTED_FILTERS', { tableKey });
  };

  const onChangeFilter = (value, filterName) => {
    dispatch('SET_FILTER', {
      tableKey,
      filter: filterName,
      value,
    });
  };

  const FilterLayout = components.FilterLayout;

  return (
    <FilterLayout
      filters={f}
      appliedFilters={appliedFilters}
      validFilters={validFilters}
      onSearch={onSearch}
      onReset={onReset}
      onClear={onClear}
      onChangeFilter={onChangeFilter}
      columnSet={columnSet}
      loading={loading}
      initializing={initializing}
      tableOptions={tableOptions}
      renderOptions={renderOptions}
      tableKey={tableKey}
    />
  );
};

const hasPrevPage = (data, dataSource, tableOptions, pageTokens, pageOffset) =>
  isClientSide(Map({ data, dataSource, tableOptions }))
    ? pageOffset > 0
    : pageTokens.size !== 0;

const hasNextPage = (
  data,
  dataSource,
  tableOptions,
  pageOffset,
  pageSize,
  currentPageToken,
  rows,
) =>
  isClientSide(Map({ data, dataSource, tableOptions }))
    ? rows.size === pageSize
      ? data
        ? pageOffset + pageSize < data.size
        : false
      : !!currentPageToken
    : !!currentPageToken;

const getIndexes = (
  data,
  rows,
  dataSource,
  tableOptions,
  pageOffset,
  pageSize,
  pageTokens,
) =>
  isClientSide(Map({ data, dataSource, tableOptions }))
    ? {
        startIndex: data.size > 0 ? pageOffset + 1 : 0,
        endIndex: data.size > 0 ? pageOffset + rows.size : 0,
      }
    : {
        startIndex: pageTokens.size * pageSize + (rows.size > 0 ? 1 : 0),
        endIndex: pageTokens.size * pageSize + rows.size,
      };

const buildPaginationControl = props => {
  const {
    tableKey,
    filterFormKey,
    data,
    rows,
    dataSource,
    tableOptions,
    pageTokens,
    pageSize,
    pageOffset,
    currentPageToken,
    components,
    loading,
  } = props;
  const PaginationControl = components.PaginationControl;
  const prevPage = hasPrevPage(
    data,
    dataSource,
    tableOptions,
    pageTokens,
    pageOffset,
  )
    ? onPrevPage(tableKey)
    : null;

  const nextPage = hasNextPage(
    data,
    dataSource,
    tableOptions,
    pageOffset,
    pageSize,
    currentPageToken,
    rows,
  )
    ? onNextPage(tableKey)
    : null;

  const { startIndex, endIndex } = getIndexes(
    data,
    rows,
    dataSource,
    tableOptions,
    pageOffset,
    pageSize,
    pageTokens,
  );

  return (
    <PaginationControl
      tableKey={tableKey}
      filterFormKey={filterFormKey}
      prevPage={prevPage}
      nextPage={nextPage}
      loading={loading}
      startIndex={startIndex}
      endIndex={endIndex}
    />
  );
};

export const buildTable = props => {
  const TableLayout = props.components.TableLayout;
  const header = buildTableHeader(props);
  const body = buildTableBody(props);
  const footer = buildTableFooter(props);

  return (
    <TableLayout
      tableKey={props.tableKey}
      filterFormKey={props.filterFormKey}
      header={header}
      body={body}
      footer={footer}
      initializing={props.initializing}
      loading={props.loading}
      error={props.error}
      empty={props.rows.isEmpty()}
      renderOptions={props.renderOptions}
      tableOptions={props.tableOptions}
    />
  );
};

export const buildTableHeader = props => {
  const Header = props.components.Header;
  const headerRow = buildTableHeaderRow(props);
  return props.omitHeader ? null : (
    <Header
      sortable={props.sortable}
      headerRow={headerRow}
      renderOptions={props.renderOptions}
      rows={props.rows}
      tableOptions={props.tableOptions}
    />
  );
};

export const buildTableHeaderRow = props => {
  const { components, rows, columns, columnSet } = props;
  const HeaderRow = components.HeaderRow;
  const columnHeaders = fromColumnSet(columns, columnSet).map(
    buildTableHeaderCell(props),
  );

  return (
    <HeaderRow
      columnHeaders={columnHeaders}
      renderOptions={props.renderOptions}
      rows={rows}
      tableOptions={props.tableOptions}
    />
  );
};

export const buildTableHeaderCell = props => (column, index) => {
  const {
    tableKey,
    components,
    columnComponents,
    renderOptions,
    tableOptions,
  } = props;
  const HeaderCell = columnComponents.getIn(
    [column.get('value'), 'HeaderCell'],
    components.HeaderCell,
  );

  const sorting = column === props.sortColumn && props.sortDirection;
  const sortable = props.sortable && column.get('sortable');

  return (
    <KeyWrapper key={`column-${index}`}>
      <HeaderCell
        onSortColumn={onSortColumn(tableKey, column)}
        title={column.get('title')}
        renderOptions={renderOptions}
        sorting={sorting}
        sortable={sortable}
        tableOptions={tableOptions}
      />
    </KeyWrapper>
  );
};

export const buildTableBody = props => {
  const Body = props.components.Body;
  const tableRows = buildTableBodyRows(props);

  return (
    <Body
      loading={props.loading}
      initializing={props.initializing}
      renderOptions={props.renderOptions}
      tableOptions={props.tableOptions}
      tableRows={tableRows}
      error={props.error}
      empty={props.rows.isEmpty()}
    />
  );
};

export const buildTableBodyRows = props => {
  const {
    components,
    rows,
    columns,
    columnSet,
    appliedFilters,
    renderOptions,
    tableOptions,
  } = props;
  const BodyRow = components.BodyRow;
  const EmptyBodyRow = components.EmptyBodyRow;

  const tableRows =
    rows.size > 0 ? (
      rows.map((row, index) => {
        const cells = buildTableBodyCells(props, row, index);
        return (
          <KeyWrapper key={`row-${index}`}>
            <BodyRow
              cells={cells}
              columns={columns}
              row={row}
              index={index}
              renderOptions={renderOptions}
              tableOptions={tableOptions}
            />
          </KeyWrapper>
        );
      })
    ) : (
      <EmptyBodyRow
        colSpan={columnSet.size}
        initializing={props.initializing}
        loading={props.loading}
        appliedFilters={appliedFilters}
        renderOptions={renderOptions}
        tableOptions={tableOptions}
        error={props.error}
      />
    );

  return tableRows;
};

export const buildTableBodyCells = (props, row, rowIndex) => {
  const {
    tableKey,
    components,
    rows,
    columns,
    columnSet,
    columnComponents,
    renderOptions,
    tableOptions,
  } = props;

  return fromColumnSet(columns, columnSet).map((column, index) => {
    const BodyCell = columnComponents.getIn(
      [column.get('value'), 'BodyCell'],
      components.BodyCell,
    );

    const value = row.get(column.get('value'));

    return (
      <KeyWrapper key={`column-${index}`}>
        <BodyCell
          tableKey={tableKey}
          row={row}
          rowIndex={rowIndex}
          index={index}
          value={value}
          rows={rows}
          column={column}
          renderOptions={renderOptions}
          tableOptions={tableOptions}
        />
      </KeyWrapper>
    );
  });
};

export const buildTableFooter = props => {
  const {
    components,
    columnSet,
    renderOptions,
    rows,
    tableOptions,
    includeFooter,
  } = props;
  const footerRow = buildTableFooterRow(props);
  const Footer = components.Footer;

  return includeFooter ? (
    <Footer
      rows={rows}
      footerRow={footerRow}
      colSpan={columnSet.size}
      renderOptions={renderOptions}
      tableOptions={tableOptions}
    />
  ) : null;
};

export const buildTableFooterRow = props => {
  const { components, renderOptions, tableOptions } = props;
  const cells = buildTableFooterCells(props);
  const FooterRow = components.FooterRow;

  return (
    <FooterRow
      cells={cells}
      renderOptions={renderOptions}
      tableOptions={tableOptions}
    />
  );
};

export const buildTableFooterCells = props => {
  const {
    components,
    columns,
    columnSet,
    columnComponents,
    renderOptions,
    tableOptions,
  } = props;
  return fromColumnSet(columns, columnSet).map((column, index) => {
    const FooterCell = columnComponents.getIn(
      [column.get('value'), 'FooterCell'],
      components.FooterCell,
    );

    return (
      <KeyWrapper key={`column-${index}`}>
        <FooterCell
          column={column}
          renderOptions={renderOptions}
          tableOptions={tableOptions}
        />
      </KeyWrapper>
    );
  });
};

const onNextPage = tableKey => () => dispatch('NEXT_PAGE', { tableKey });
const onPrevPage = tableKey => () => dispatch('PREV_PAGE', { tableKey });
const onSortColumn = (tableKey, column) => () =>
  dispatch('SORT_COLUMN', { tableKey, column });

const mapStateToProps = state => (state, props) =>
  state.getIn(['tables', props.tableKey], Map()).toObject();

/**
 * @component
 */
const TableImpl = compose(
  connect(mapStateToProps),
  lifecycle({
    componentDidMount() {
      if (this.props.mounted && !this.props.configured) {
        configureTable(this.props);
      }
    },

    componentDidUpdate() {
      if (this.props.mounted && !this.props.configured) {
        configureTable(this.props);
      }
    },
  }),
)(TableComponent);

export const generateColumns = (columns, addColumns = [], alterColumns = {}) =>
  List(addColumns)
    .concat(columns)
    .map(c => Map({ ...c, ...alterColumns[c.value], value: c.value }));

export const extractColumnComponents = columns =>
  columns
    .filter(c => c.has('components'))
    .reduce(
      (result, current) =>
        result.set(current.get('value'), current.get('components')),
      Map(),
    );

export const generateTable = ({
  tableOptions = [],
  filterDataSources = () => ({}),
  filters,
  columns,
  dataSource,
  sortable,
  onValidateFilters,
}) => props => {
  const tableOptionProps = tableOptions
    ? tableOptions.reduce((to, opt) => {
        to[opt] = props[opt];
        return to;
      }, {})
    : {};

  let FilterForm;
  if (filters) {
    FilterForm = generateForm({
      dataSources: filterDataSources,
      fields: filters,
      formOptions: ['tableKey', ...tableOptions],
      handleSubmit: ({ tableKey }) => values => {
        dispatch('APPLY_FILTER_FORM', { tableKey, appliedFilters: values });
      },
    });
  }

  const setProps = {
    // Passed in to `generateTable`
    columns,
    dataSource,
    onValidateFilters,
    // Calculated from props and tableOptions.
    tableOptions: { ...tableOptionProps },
    // Add FilterForm to the components that are passed.
    components: { ...props.components, FilterForm },
    // Sortable can be enabled or disabled for an entire table.
    sortable: typeof sortable !== 'undefined' ? sortable : props.sortable,
    // Explicitly allowed props.
    tableKey: props.tableKey,
    filterFormKey: filterFormKey(props.tableKey),
    addColumns: props.addColumns,
    alterColumns: props.alterColumns,
    alterFilters: mergeDeep(
      props.alterFilters || {},
      Map(props.initialFilterValues)
        .map(initialValue => ({ initialValue }))
        .toObject(),
    ),
    filterSet: props.filterSet,
    columnSet: props.columnSet,
    pageSize: props.pageSize,
    defaultSortColumn: props.defaultSortColumn,
    defaultSortDirection: props.defaultSortDirection,
    omitHeader: props.omitHeader,
    includeFooter: props.includeFooter,
    refreshInterval: props.refreshInterval,
    renderOptions: props.renderOptions,
    uncontrolled: props.uncontrolled,
    // For full client-side tables, with no datasource.
    data: props.data,
    filterForm: !!filters,
    initialFilterValues: props.initialFilterValues || {},
    onSearch: props.onSearch,
  };

  return <Table {...setProps}>{props.children}</Table>;
};

export class Table extends Component {
  constructor(props) {
    super(props);
    const { components, tableKey, ...config } = props;
    this.components = components;
    this.config = config;
    this.auto = !tableKey || props.uncontrolled;
    this.tableKey = tableKey || generateKey();
  }

  componentDidMount() {
    if (this.auto) {
      mountTable(this.tableKey);
    }
  }

  componentWillUnmount() {
    if (this.auto) {
      unmountTable(this.tableKey);
    }
  }

  render() {
    const columns = generateColumns(
      this.props.columns,
      this.props.addColumns,
      this.props.alterColumns,
    );
    const allColumns = columns.map(c => c.get('value'));
    const columnSet = List(
      this.props.columnSet
        ? typeof this.props.columnSet === 'function'
          ? this.props.columnSet(allColumns)
          : this.props.columnSet
        : allColumns,
    ).filter(c => columns.find(c2 => c2.get('value') === c));
    const columnComponents = extractColumnComponents(columns);

    return (
      <ComponentConfigContext.Consumer>
        {componentConfig => (
          <TableImpl
            {...this.props}
            components={componentConfig.merge(this.props.components).toJS()}
            columnComponents={columnComponents}
            columns={columns}
            columnSet={columnSet}
            tableKey={this.tableKey}
            auto={this.auto}
          >
            {this.props.children}
          </TableImpl>
        )}
      </ComponentConfigContext.Consumer>
    );
  }
}

Table.propTypes = {
  /** An array or list of data. */
  data: PropTypes.array,
  /** An object describing how a table fetches remote data. */
  dataSource: PropTypes.func,
  /**
   * Calculated row data from the datasource mechanism.
   * @ignore
   */
  rows: PropTypes.instanceOf(List),
  /** An array of the columns that will be rendered on the table. */
  columns: PropTypes.arrayOf(
    PropTypes.shape({
      /** The title that will be rendered in the header. */
      title: PropTypes.string,
      /** The value key that will be used to map the column to the data object. */
      value: PropTypes.string,
      /** Flag that determines if the column can be used as a filter. */
      filter: PropTypes.oneOf([
        'includes', // clientSide searching only
        'equals',
        'startsWith',
        'in',
        'between',
        'timeline',
        'lt',
        'lteq',
        'gt',
        'gteq',
      ]),
      /** Initial value for the filter. */
      initial: PropTypes.any,
      /** The type of column this is, typically used for determining the filter component. */
      type: PropTypes.oneOf(['text', 'boolean']),
      /** A function that returns an array of objects with the keys `value` and `label`. */
      options: PropTypes.func,
      /** Flag that determines if the column is sortable.*/
      sortable: PropTypes.bool,
      /** Allows overriding the `HeaderCell`, `BodyCell`, and `FooterCell` for a given column. */
      components: PropTypes.shape({
        HeaderCell: PropTypes.func,
        BodyCell: PropTypes.func,
        FooterCell: PropTypes.func,
        Filter: PropTypes.func,
      }),
    }),
  ).isRequired,
  /** Add additional columns to a table. */
  addColumns: PropTypes.arrayOf(
    PropTypes.shape({
      /** The title that will be rendered in the header. */
      title: PropTypes.string,
      /** The value key that will be used to map the column to the data object. */
      value: PropTypes.string,
      /** Flag that determines if the column can be used as a filter. */
      filterable: PropTypes.bool,
      /** Flag that determines if the column is sortable.*/
      sortable: PropTypes.bool,
      /** Allows overriding the `HeaderCell`, `BodyCell`, and `FooterCell` for a given column. */
      components: PropTypes.shape({
        HeaderCell: PropTypes.func,
        BodyCell: PropTypes.func,
        FooterCell: PropTypes.func,
        Filter: PropTypes.func,
      }),
    }),
  ),
  /** Allow overriding the columns shown and in which order. */
  columnSet: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.string),
    PropTypes.func,
  ]),
  components: PropTypes.shape({
    /** Override the default table layout, analogous to `<table>`. */
    TableLayout: PropTypes.func,
    /** Overrides the default filter layout. */
    FilterLayout: PropTypes.func,
    /** Overrides the default text type filter input */
    TextFilter: PropTypes.func,
    /** Overrides the default boolean type filter input */
    BooleanFilter: PropTypes.func,
    /** Override the table header, analogous to `<thead>`. */
    Header: PropTypes.func,
    /** Override the table header row, analogous to the `<tr>` in `<thead>`. */
    HeaderRow: PropTypes.func,
    /** Override the table header cells, analogous to `<th>`. */
    HeaderCell: PropTypes.func,

    /** Override the table body, analogous to `<tbody>`. */
    Body: PropTypes.func,
    /** Override the table rows, analogous to `<tr>`. */
    BodyRow: PropTypes.func,
    /** Override the table body row when there is no data. */
    EmptyBodyRow: PropTypes.func,
    /** Override the table cells, analogous to `<td>`. */
    BodyCell: PropTypes.func,

    /** Override the table footer, analogous to `<tfoot>`. */
    Footer: PropTypes.func,
    /** Override the table footer row, analogous to the `<tr>` in `<tfoot>`. */
    FooterRow: PropTypes.func,
    /** Override the table footer cells, analogous to `<td>`. */
    FooterCell: PropTypes.func,
  }),

  /** Set the page size when paginating data. */
  pageSize: PropTypes.number,

  /**
   * Flag to enable/disable sorting support.
   * @ignore
   */
  sortable: PropTypes.bool,

  /** The column to sort results by initially. */
  defaultSortColumn: PropTypes.string,
  /** The initial sort direction of results. */
  defaultSortDirection: PropTypes.string,

  /** The child of this component should be a function which renders the table layout. */
  children: PropTypes.func.isRequired,

  /** A flag used to suppress the rendering of the table header. */
  omitHeader: PropTypes.bool,
  /** A flag used to enable to rendering of the table footer. */
  includeFooter: PropTypes.bool,
};

const defaultProps = {
  components: {},
  rows: List([]),
  columns: [],
  addColumns: [],
  alterColumns: {},

  sortable: true,
  pageSize: 25,
  omitHeader: false,
  includeFooter: false,
};

Table.defaultProps = defaultProps;

Table.configure = configureTable;

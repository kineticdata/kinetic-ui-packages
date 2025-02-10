import React from 'react';
import { create, act } from 'react-test-renderer';
import { KineticLib } from '../../../index';
import { store } from '../../../store';
import { List, Map } from 'immutable';
import { users } from '../../../../tests/fixtures';
import { DefaultTableConfig } from '../defaults';
import {
  buildTable,
  buildTableHeader,
  buildTableHeaderRow,
  buildTableHeaderCell,
  buildTableBody,
  buildTableBodyRows,
  buildTableBodyCells,
  buildTableFooter,
  buildTableFooterRow,
  buildTableFooterCells,
  extractColumnComponents,
  generateColumns,
  sortColumns,
  generateTable,
  getToggleableColumns,
} from '../Table';
import { mockTableConfig, TableViewMock } from './components';

const buildProps = props => {
  props.columnComponents = extractColumnComponents(props.columns);
  return props;
};

// Things passed in from generateTables
// tableOptions, columns, dataSource, sortable

const TABLE_KEY = 'mock-table-key';

const mountTable = ({
  dataSource,
  filters,
  filterDataSources,
  columns = [],
  tableOptions = {},
  tableKey = TABLE_KEY,
  TableView = TableViewMock,
  ...tableProps
}) => {
  // Generate a new Table type using the options.
  const Table = generateTable({
    dataSource,
    columns,
    filters,
    filterDataSources,
    tableOptions: Object.keys(tableOptions),
  });
  return act(
    () =>
      new Promise(resolve => {
        const result = create(
          <KineticLib components={mockTableConfig}>
            <Table
              tableKey={tableKey}
              uncontrolled
              {...tableProps}
              {...tableOptions}
            >
              {props => <TableView {...props} />}
            </Table>
          </KineticLib>,
        );

        const ready = () =>
          !(
            store.getState().getIn(['tables', tableKey, 'loading'], true) ||
            store.getState().getIn(['tables', tableKey, 'initializing'], true)
          );

        if (ready()) {
          resolve(result);
        } else {
          const unsub = store.subscribe(() => {
            if (ready()) {
              resolve(result);
              // Remove the store listener since we're done.
              unsub();
            }
          });
        }
      }),
  );
};

// Helper function to find an element within the rendered component
const getByTestId = (json, id, depth = 0) => {
  if (json?.props?.['data-testid'] === id) {
    return json;
  }
  if (Array.isArray(json?.children)) {
    return json.children
      .map(child => getByTestId(child, id, depth + 1))
      .find(Boolean);
  }
  if (depth === 0) {
    throw new Error(`Cannot find element with test id: '${id}'`);
  }
  return undefined;
};

/*

* Repeat for: server-side, server-side w/client sort and paginate, client-side
* test sorting by column
* test sorting changing direction
* test default sort parameters

* test pure-client-side (data prop passed)

 * test overriding default components for whole table
 * test altering columns
 ** changing component
 ** What else *can* be changed???
 * test adding columns
 * test valueTransform
 * test columnSet
 * test pageSize
 * test sortable
 * test omit header
 * test include footer


 */

describe('<Table />', () => {
  describe('render', () => {
    let data, columns, wrapper, dataSourceFn;
    beforeEach(() => {
      data = { mockData: [{ name: 'test', status: 'active' }] };
      columns = [
        {
          value: 'name',
          title: 'Name',
          sortable: true,
          filter: 'startsWith',
          type: 'text',
        },
        {
          value: 'status',
          title: 'Status',
          sortable: true,
          filter: 'equals',
          type: 'text',
          options: () => [
            { label: 'Active', value: 'active' },
            { label: 'Inactive', value: 'inactive' },
          ],
        },
      ];

      dataSourceFn = jest.fn(() => Promise.resolve(data));
    });
    afterEach(() => {
      if (wrapper) {
        wrapper.unmount();
      }
    });

    test('kitchen sink', async () => {
      const addColumns = [
        {
          value: '_action',
          title: 'Actions',
        },
      ];
      wrapper = await mountTable({
        columns,
        addColumns,
        dataSource: _tableOptions => ({
          fn: dataSourceFn,
          params: _paramData => [],
          transform: result => ({ data: result.mockData }),
        }),
      });
      expect(getByTestId(wrapper.toJSON(), 'TableViewMock')).toMatchSnapshot();
    });

    describe('filters', () => {
      test('legacy filters', async () => {
        wrapper = await mountTable({
          dataSource: _tableOptions => ({
            fn: dataSourceFn,
            params: _paramData => [],
            transform: result => ({ data: result.mockData }),
          }),
        });

        const filterLayout = getByTestId(wrapper.toJSON(), 'FilterLayoutMock');
        expect(filterLayout).toBeDefined();
        expect(filterLayout).toMatchSnapshot();
      });

      test('filter form', async () => {
        wrapper = await mountTable({
          filters: () => () => [
            { name: 'name', label: 'Name', type: 'text' },
            { name: 'status', label: 'Status', type: 'text' },
          ],
          dataSource: _tableOptions => ({
            fn: dataSourceFn,
            params: _paramData => [],
            transform: result => ({ data: result.mockData }),
          }),
        });

        const filterForm = getByTestId(wrapper.toJSON(), 'FormLayoutMock');
        expect(filterForm).toBeDefined();
        expect(filterForm).toMatchSnapshot();
      });
    });

    describe('dataSource', () => {
      test('dataSource resolves', async () => {
        wrapper = await mountTable({
          dataSource: _tableOptions => ({
            fn: dataSourceFn,
            params: _paramData => [],
            transform: result => ({ data: result.mockData }),
          }),
        });

        expect(
          getByTestId(wrapper.toJSON(), 'TableViewMock'),
        ).toMatchSnapshot();
        expect(dataSourceFn.mock.calls).toMatchSnapshot();
      });
    });
  });

  describe('build methods', () => {
    let props;
    let data = [];
    let columns = List([]);
    let columnSet = List([]);
    let wrapper;

    beforeEach(() => {
      data = users(2);
      columns = List([Map({ value: 'username', title: 'Username' })]);
      columnSet = List(['username']);
      props = {
        // Spread in the default components since the method tests will not be getting
        // any components from the context since we're bypassing the top level `Table`
        // component for testing.
        components: { ...DefaultTableConfig.toJS() },
        data,
        columns,
        columnSet,
        rows: List(data).map(r => Map(r)),
      };
    });
    afterEach(() => {
      if (wrapper) {
        wrapper.unmount();
      }
    });

    describe('#buildTable', () => {
      test('it renders normally', () => {
        wrapper = create(
          <KineticLib>{buildTable(buildProps(props))}</KineticLib>,
        );

        expect(wrapper.toJSON().type).toEqual('table');
        expect(wrapper.toJSON().props.className).not.toEqual('custom-table');
      });

      test('it renders a custom table', () => {
        const TableLayout = () => <table className="custom-table" />;
        props.components.TableLayout = TableLayout;
        wrapper = create(
          <KineticLib>{buildTable(buildProps(props))}</KineticLib>,
        );

        expect(wrapper.toJSON().type).toEqual('table');
        expect(wrapper.toJSON().props.className).toEqual('custom-table');
      });
    });

    describe('#buildTableHeader', () => {
      test('it renders normally', () => {
        wrapper = create(
          <KineticLib>{buildTableHeader(buildProps(props))}</KineticLib>,
        );

        expect(wrapper.toJSON().type).toEqual('thead');
        expect(wrapper.toJSON().props.className).not.toEqual('custom-thead');
      });

      test('it does not render when omitHeader is set', () => {
        props.omitHeader = true;
        wrapper = create(
          <KineticLib>{buildTableHeader(buildProps(props))}</KineticLib>,
        );

        expect(wrapper.toJSON()).toBeNull();
      });

      test('it renders a custom thead', () => {
        const Header = () => <thead className="custom-thead" />;
        props.components.Header = Header;
        wrapper = create(
          <KineticLib>{buildTableHeader(buildProps(props))}</KineticLib>,
        );

        expect(wrapper.toJSON().type).toEqual('thead');
        expect(wrapper.toJSON().props.className).toEqual('custom-thead');
      });
    });

    describe('#buildTableHeaderRow', () => {
      test('it renders normally', () => {
        wrapper = create(
          <KineticLib>{buildTableHeaderRow(buildProps(props))}</KineticLib>,
        );

        expect(wrapper.toJSON().type).toEqual('tr');
        expect(wrapper.toJSON().props.className).not.toEqual('custom-tr');
      });

      test('it renders a custom thead', () => {
        const HeaderRow = () => <tr className="custom-tr" />;
        props.components.HeaderRow = HeaderRow;
        wrapper = create(
          <KineticLib>{buildTableHeaderRow(buildProps(props))}</KineticLib>,
        );

        expect(wrapper.toJSON().type).toEqual('tr');
        expect(wrapper.toJSON().props.className).toEqual('custom-tr');
      });
    });

    describe('#buildTableHeaderCell', () => {
      test('it renders normally', () => {
        const column = columns.first();
        wrapper = create(
          <KineticLib>
            {buildTableHeaderCell(buildProps(props))(column, 0)}
          </KineticLib>,
        );

        expect(wrapper.toJSON().type).toEqual('th');
        expect(wrapper.toJSON().props.className).not.toEqual('custom-th');
      });

      test('it renders a custom th', () => {
        const column = columns.first();
        const HeaderCell = () => <th className="custom-th" />;
        props.components.HeaderCell = HeaderCell;
        wrapper = create(
          <KineticLib>
            {buildTableHeaderCell(buildProps(props))(column, 0)}
          </KineticLib>,
        );

        expect(wrapper.toJSON().type).toEqual('th');
        expect(wrapper.toJSON().props.className).toEqual('custom-th');
      });

      test('it renders a custom th for a specific column', () => {
        const HeaderCell = () => <th className="custom-cell-th" />;
        props.columns = props.columns.push(
          Map({
            value: 'displayName',
            title: 'DisplayName',
            components: { HeaderCell },
          }),
        );
        props.columnSet = props.columnSet.push('displayName');
        const column = props.columns.last();
        wrapper = create(
          <KineticLib>
            {buildTableHeaderCell(buildProps(props))(column, 0)}
          </KineticLib>,
        );

        expect(wrapper.toJSON().type).toEqual('th');
        expect(wrapper.toJSON().props.className).toEqual('custom-cell-th');
      });
    });

    describe('#buildTableBody', () => {
      test('it renders normally', () => {
        wrapper = create(
          <KineticLib>{buildTableBody(buildProps(props))}</KineticLib>,
        );

        expect(wrapper.toJSON().type).toEqual('tbody');
        expect(wrapper.toJSON().props.className).not.toEqual('custom-tbody');
      });

      test('it renders a custom tbody', () => {
        const Header = () => <tbody className="custom-tbody" />;
        props.components.Header = Header;
        wrapper = create(
          <KineticLib>{buildTableHeader(buildProps(props))}</KineticLib>,
        );

        expect(wrapper.toJSON().type).toEqual('tbody');
        expect(wrapper.toJSON().props.className).toEqual('custom-tbody');
      });
    });

    describe('#buildTableBodyRows', () => {
      test('it renders rows normally', () => {
        wrapper = create(
          <KineticLib>
            <table>
              <tbody data-testid="TableBodyMock">
                {buildTableBodyRows(buildProps(props))}
              </tbody>
            </table>
          </KineticLib>,
        );

        expect(
          getByTestId(wrapper.toJSON(), 'TableBodyMock')?.children,
        ).toHaveLength(props.rows.size);
        expect(
          getByTestId(wrapper.toJSON(), 'TableBodyMock')?.children?.[0]?.type,
        ).toEqual('tr');
        expect(
          getByTestId(wrapper.toJSON(), 'TableBodyMock')?.children?.[0]?.props
            ?.className,
        ).not.toEqual('custom-tr');
      });

      test('it renders custom rows', () => {
        const BodyRow = () => <tr className="custom-tr" />;
        props.components.BodyRow = BodyRow;
        wrapper = create(
          <KineticLib>
            <table>
              <tbody data-testid="TableBodyMock">
                {buildTableBodyRows(buildProps(props))}
              </tbody>
            </table>
          </KineticLib>,
        );

        expect(
          getByTestId(wrapper.toJSON(), 'TableBodyMock')?.children,
        ).toHaveLength(props.rows.size);
        expect(
          getByTestId(wrapper.toJSON(), 'TableBodyMock')?.children?.[0]?.type,
        ).toEqual('tr');
        expect(
          getByTestId(wrapper.toJSON(), 'TableBodyMock')?.children?.[0]?.props
            ?.className,
        ).toEqual('custom-tr');
      });

      test('it renders default empty row', () => {
        props.rows = List([]);
        wrapper = create(
          <KineticLib>
            <table>
              <tbody data-testid="TableBodyMock">
                {buildTableBodyRows(buildProps(props))}
              </tbody>
            </table>
          </KineticLib>,
        );

        expect(
          getByTestId(wrapper.toJSON(), 'TableBodyMock')?.children,
        ).toHaveLength(1);
        expect(
          getByTestId(wrapper.toJSON(), 'TableBodyMock')?.children?.[0]?.type,
        ).toEqual('tr');
        expect(
          getByTestId(wrapper.toJSON(), 'TableBodyMock')?.children?.[0]?.props
            ?.className,
        ).not.toEqual('custom-empty-tr');
      });

      test('it renders custom empty row', () => {
        const EmptyBodyRow = () => <tr className="custom-empty-tr" />;
        props.rows = List([]);
        props.components.EmptyBodyRow = EmptyBodyRow;
        wrapper = create(
          <KineticLib>
            <table>
              <tbody data-testid="TableBodyMock">
                {buildTableBodyRows(buildProps(props))}
              </tbody>
            </table>
          </KineticLib>,
        );

        expect(
          getByTestId(wrapper.toJSON(), 'TableBodyMock')?.children,
        ).toHaveLength(1);
        expect(
          getByTestId(wrapper.toJSON(), 'TableBodyMock')?.children?.[0]?.type,
        ).toEqual('tr');
        expect(
          getByTestId(wrapper.toJSON(), 'TableBodyMock')?.children?.[0]?.props
            ?.className,
        ).toEqual('custom-empty-tr');
      });
    });

    describe('#buildTableBodyCells', () => {
      test('it renders cells normally', () => {
        wrapper = create(
          <KineticLib>
            <table>
              <tbody>
                <tr data-testid="TableBodyRowMock">
                  {buildTableBodyCells(
                    buildProps(props),
                    props.rows.first(),
                    0,
                  )}
                </tr>
              </tbody>
            </table>
          </KineticLib>,
        );

        expect(
          getByTestId(wrapper.toJSON(), 'TableBodyRowMock')?.children,
        ).toHaveLength(props.columnSet.size);
        expect(
          getByTestId(wrapper.toJSON(), 'TableBodyRowMock')?.children?.[0]
            ?.type,
        ).toEqual('td');
        expect(
          getByTestId(wrapper.toJSON(), 'TableBodyRowMock')?.children?.[0]
            ?.props?.className,
        ).not.toEqual('custom-td');
      });

      test('it renders custom cells', () => {
        const BodyCell = () => <td className="custom-td" />;
        props.components.BodyCell = BodyCell;
        wrapper = create(
          <KineticLib>
            <table>
              <tbody>
                <tr data-testid="TableBodyRowMock">
                  {buildTableBodyCells(
                    buildProps(props),
                    props.rows.first(),
                    0,
                  )}
                </tr>
              </tbody>
            </table>
          </KineticLib>,
        );

        expect(
          getByTestId(wrapper.toJSON(), 'TableBodyRowMock')?.children,
        ).toHaveLength(props.columnSet.size);
        expect(
          getByTestId(wrapper.toJSON(), 'TableBodyRowMock')?.children?.[0]
            ?.type,
        ).toEqual('td');
        expect(
          getByTestId(wrapper.toJSON(), 'TableBodyRowMock')?.children?.[0]
            ?.props?.className,
        ).toEqual('custom-td');
      });

      test('it renders custom column cells', () => {
        const BodyCell = () => <td className="custom-td" />;
        props.columns = props.columns.push(
          Map({
            value: 'displayName',
            title: 'DisplayName',
            components: { BodyCell },
          }),
        );
        props.columnSet = props.columnSet.push('displayName');
        wrapper = create(
          <KineticLib>
            <table>
              <tbody>
                <tr data-testid="TableBodyRowMock">
                  {buildTableBodyCells(
                    buildProps(props),
                    props.rows.first(),
                    0,
                  )}
                </tr>
              </tbody>
            </table>
          </KineticLib>,
        );

        expect(
          getByTestId(wrapper.toJSON(), 'TableBodyRowMock')?.children,
        ).toHaveLength(props.columnSet.size);
        expect(
          getByTestId(wrapper.toJSON(), 'TableBodyRowMock')?.children?.[0]
            ?.type,
        ).toEqual('td');
        expect(
          getByTestId(wrapper.toJSON(), 'TableBodyRowMock')?.children?.[0]
            ?.props?.className,
        ).not.toEqual('custom-td');
        expect(
          getByTestId(wrapper.toJSON(), 'TableBodyRowMock')?.children?.[
            props.columnSet.size - 1
          ]?.props?.className,
        ).toEqual('custom-td');
      });
    });

    describe('#buildTableFooter', () => {
      test('it does not render normally', () => {
        wrapper = create(
          <KineticLib>{buildTableFooter(buildProps(props))}</KineticLib>,
        );

        expect(wrapper.toJSON()).toBeNull();
      });

      test('it renders with includeFooter', () => {
        props.includeFooter = true;
        wrapper = create(
          <KineticLib>{buildTableFooter(buildProps(props))}</KineticLib>,
        );

        expect(wrapper.toJSON().type).toEqual('tfoot');
        expect(wrapper.toJSON().props.className).not.toEqual('custom-tfoot');
      });

      test('it renders a custom tfoot', () => {
        const Footer = () => <tfoot className="custom-tfoot" />;
        props.includeFooter = true;
        props.components.Footer = Footer;
        wrapper = create(
          <KineticLib>{buildTableFooter(buildProps(props))}</KineticLib>,
        );

        expect(wrapper.toJSON().type).toEqual('tfoot');
        expect(wrapper.toJSON().props.className).toEqual('custom-tfoot');
      });
    });

    describe('#buildTableFooterRow', () => {
      test('it renders normally', () => {
        wrapper = create(
          <KineticLib>{buildTableFooterRow(buildProps(props))}</KineticLib>,
        );

        expect(wrapper.toJSON().type).toEqual('tr');
        expect(wrapper.toJSON().props.className).not.toEqual('custom-tr');
      });

      test('it renders a custom tr', () => {
        const FooterRow = () => <tr className="custom-tr" />;
        props.components.FooterRow = FooterRow;
        wrapper = create(
          <KineticLib>{buildTableFooterRow(buildProps(props))}</KineticLib>,
        );

        expect(wrapper.toJSON().type).toEqual('tr');
        expect(wrapper.toJSON().props.className).toEqual('custom-tr');
      });
    });

    describe('#buildTableFooterCells', () => {
      test('it renders normally', () => {
        wrapper = create(
          <KineticLib>
            <tfoot>
              <tr data-testid="FooterRowMock">
                {buildTableFooterCells(buildProps(props))}
              </tr>
            </tfoot>
          </KineticLib>,
        );

        expect(
          getByTestId(wrapper.toJSON(), 'FooterRowMock')?.children,
        ).toHaveLength(props.columnSet.size);
        expect(
          getByTestId(wrapper.toJSON(), 'FooterRowMock')?.children?.[0]?.type,
        ).toEqual('td');
        expect(
          getByTestId(wrapper.toJSON(), 'FooterRowMock')?.children?.[0]?.props
            ?.className,
        ).not.toEqual('custom-td');
      });

      test('it renders a custom td', () => {
        const FooterCell = () => <td className="custom-td" />;
        props.components.FooterCell = FooterCell;
        wrapper = create(
          <KineticLib>
            <tfoot>
              <tr data-testid="FooterRowMock">
                {buildTableFooterCells(buildProps(props))}
              </tr>
            </tfoot>
          </KineticLib>,
        );

        expect(
          getByTestId(wrapper.toJSON(), 'FooterRowMock')?.children,
        ).toHaveLength(props.columnSet.size);
        expect(
          getByTestId(wrapper.toJSON(), 'FooterRowMock')?.children?.[0]?.type,
        ).toEqual('td');
        expect(
          getByTestId(wrapper.toJSON(), 'FooterRowMock')?.children?.[0]?.props
            ?.className,
        ).toEqual('custom-td');
      });

      test('it renders a custom td for a specific column', () => {
        const FooterCell = () => <td className="custom-td" />;
        props.columns = props.columns.push(
          Map({
            value: 'displayName',
            title: 'DisplayName',
            components: { FooterCell },
          }),
        );
        props.columnSet = props.columnSet.push('displayName');
        wrapper = create(
          <KineticLib>
            <tfoot>
              <tr data-testid="FooterRowMock">
                {buildTableFooterCells(buildProps(props))}
              </tr>
            </tfoot>
          </KineticLib>,
        );

        expect(
          getByTestId(wrapper.toJSON(), 'FooterRowMock')?.children,
        ).toHaveLength(props.columnSet.size);
        expect(
          getByTestId(wrapper.toJSON(), 'FooterRowMock')?.children?.[0]?.type,
        ).toEqual('td');
        expect(
          getByTestId(wrapper.toJSON(), 'FooterRowMock')?.children?.[0]?.props
            ?.className,
        ).not.toEqual('custom-td');
        expect(
          getByTestId(wrapper.toJSON(), 'FooterRowMock')?.children?.[
            props.columnSet.size - 1
          ]?.props?.className,
        ).toEqual('custom-td');
      });
    });
  });

  describe('data manipulators', () => {
    describe('#generateColumns', () => {
      let columns;
      let addColumns;
      let alterColumns;

      beforeEach(() => {
        columns = [{ value: 'a', title: 'A' }];
        addColumns = [{ value: 'b', title: 'B' }];
        alterColumns = {};
      });

      test('combines the column config and additional columns', () => {
        const total = columns.length + addColumns.length;
        expect(generateColumns(columns, addColumns, alterColumns).size).toBe(
          total,
        );
      });

      test('alters columns with config', () => {
        alterColumns.a = { sortable: true };
        const columnConfig = generateColumns(columns, addColumns, alterColumns);
        const column = columnConfig.find(
          c => c.get('value') === columns[0].value,
        );
        expect(column.get('sortable')).toBeTruthy();
      });

      test('alters columns does not change value key', () => {
        alterColumns.a = { value: 'c' };
        const columnConfig = generateColumns(columns, addColumns, alterColumns);
        const column = columnConfig.find(c => c.get('value') === 'a');
        expect(column).not.toBeUndefined();
      });
    });

    describe('#sortColumns', () => {
      test('sort columns returns expected sort order', () => {
        const columns = List([
          Map({ value: 'a', title: 'A' }),
          Map({ value: 'b', title: 'B' }),
          Map({ value: 'c', title: 'C' }),
        ]);
        const columnSet = List(['b', 'a']);

        expect(
          sortColumns(columns, columnSet)
            .toJS()
            .map(c => c.value)
            .join(''),
        ).toBe('bca');
      });
    });

    describe('#getToggleableColumns', () => {
      test('toggleable columns list is correct', () => {
        const columns = List([
          Map({ value: 'a', title: 'A', toggleable: true }),
          Map({ value: 'b', title: 'B' }),
          Map({ value: 'c', title: 'C' }),
          Map({ value: 'd' }),
        ]);
        const columnSet = List(['a', 'b', 'd']);

        expect(
          getToggleableColumns(columns, columnSet, 'table-key')
            .toJS()
            .map(c => c.value)
            .join(''),
        ).toBe('ab');
      });
    });

    xdescribe('#extractColumnComponents', () => {
      let columns, addColumns, alterColumns;

      beforeEach(() => {
        columns = [
          { value: 'first' },
          { value: 'second', components: { BodyCell: 'two' } },
          { value: 'third' },
        ];

        addColumns = [
          { value: 'fourth' },
          { value: 'fifth', components: { BodyCell: 'five' } },
        ];

        alterColumns = { third: { components: { BodyCell: 'three' } } };
      });

      xtest('returns a map of components with overrides', () => {
        const result = extractColumnComponents({
          columns,
          addColumns,
          alterColumns,
        });

        console.log(columns);
        expect(result.toJS()).toBe([]);
      });
    });
  });
});

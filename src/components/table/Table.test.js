import React from 'react';
import { KineticLib } from '../../index';
import { store } from '../../store';
import { render, mount } from 'enzyme';
import { List, Map } from 'immutable';
import { users } from '../../../../../docs/src/docz/fixtures';
import { DefaultTableConfig } from './defaults';
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
  generateTable,
} from './Table';

const buildProps = props => {
  props.columnComponents = extractColumnComponents(props.columns);
  return props;
};

// Things passed in from generateTables
// tableOptions, columns, dataSource, sortable

const TABLE_KEY = 'mock-table-key';

const TableViewMock = props => (
  <>
    {props.table}
    {props.pagination}
    {props.filter}
  </>
);

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

  return new Promise(resolve => {
    const result = mount(
      <KineticLib>
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
      result.update();
      resolve(result);
    } else {
      const unsub = store.subscribe(() => {
        if (ready()) {
          result.update();
          resolve(result);
          // Remove the store listener since we're done.
          unsub();
        }
      });
    }
  });
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
      const ActionCell = props => <td>{props.value}</td>;
      const addColumns = [
        {
          value: '_action',
          label: 'Actions',
          components: { BodyCell: ActionCell },
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
      expect(wrapper).toMatchSnapshot();
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

        const filterLayout = wrapper.find('FilterLayout');
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

        const filterForm = wrapper.find('FilterForm');
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

        expect(wrapper).toMatchSnapshot();
        expect(dataSourceFn.mock.calls).toMatchSnapshot();
      });
    });
  });
  describe('build methods', () => {
    let props;
    let data = [];
    let columns = List([]);
    let columnSet = List([]);

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

    describe('#buildTable', () => {
      test('it renders normally', () => {
        const wrapper = render(
          <KineticLib>{buildTable(buildProps(props))}</KineticLib>,
        );

        expect(wrapper.is('table')).toBeTruthy();
        expect(wrapper.is('table.custom-table')).toBeFalsy();
      });

      test('it renders a custom table', () => {
        const TableLayout = () => <table className="custom-table" />;

        props.components.TableLayout = TableLayout;
        const wrapper = render(
          <KineticLib>{buildTable(buildProps(props))}</KineticLib>,
        );

        expect(wrapper.is('table.custom-table')).toBeTruthy();
      });
    });

    describe('#buildTableHeader', () => {
      test('it renders normally', () => {
        const wrapper = render(
          <KineticLib>{buildTableHeader(buildProps(props))}</KineticLib>,
        );

        expect(wrapper.is('thead')).toBeTruthy();
        expect(wrapper.is('thead.custom-thead')).toBeFalsy();
      });

      test('it does not render when omitHeader is set', () => {
        props.omitHeader = true;
        const wrapper = render(
          <KineticLib>{buildTableHeader(buildProps(props))}</KineticLib>,
        );

        expect(wrapper.is('thead')).toBeFalsy();
      });

      test('it renders a custom thead', () => {
        const Header = () => <thead className="custom-thead" />;

        props.components.Header = Header;
        const wrapper = render(
          <KineticLib>{buildTableHeader(buildProps(props))}</KineticLib>,
        );

        expect(wrapper.is('thead.custom-thead')).toBeTruthy();
      });
    });

    describe('#buildTableHeaderRow', () => {
      test('it renders normally', () => {
        const wrapper = render(
          <KineticLib>{buildTableHeaderRow(buildProps(props))}</KineticLib>,
        );

        expect(wrapper.is('tr')).toBeTruthy();
        expect(wrapper.is('tr.custom-tr')).toBeFalsy();
      });

      test('it renders a custom thead', () => {
        const HeaderRow = () => <tr className="custom-tr" />;

        props.components.HeaderRow = HeaderRow;
        const wrapper = render(
          <KineticLib>{buildTableHeaderRow(buildProps(props))}</KineticLib>,
        );

        expect(wrapper.is('tr.custom-tr')).toBeTruthy();
      });
    });

    describe('#buildTableHeaderCell', () => {
      test('it renders normally', () => {
        const column = columns.first();
        const wrapper = render(
          <KineticLib>
            {buildTableHeaderCell(buildProps(props))(column, 0)}
          </KineticLib>,
        );

        expect(wrapper.is('th')).toBeTruthy();
        expect(wrapper.is('td.custom-td')).toBeFalsy();
      });

      test('it renders a custom th', () => {
        const column = columns.first();
        const HeaderCell = () => <th className="custom-th" />;
        props.components.HeaderCell = HeaderCell;

        const wrapper = render(
          <KineticLib>
            {buildTableHeaderCell(buildProps(props))(column, 0)}
          </KineticLib>,
        );

        expect(wrapper.is('th.custom-th')).toBeTruthy();
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
        const wrapper = render(
          <KineticLib>
            {buildTableHeaderCell(buildProps(props))(column, 0)}
          </KineticLib>,
        );

        expect(wrapper.hasClass('custom-cell-th')).toBeTruthy();
      });
    });

    describe('#buildTableBody', () => {
      test('it renders normally', () => {
        const wrapper = render(
          <KineticLib>{buildTableBody(buildProps(props))}</KineticLib>,
        );

        expect(wrapper.is('tbody')).toBeTruthy();
        expect(wrapper.is('tbody.custom-tbody')).toBeFalsy();
      });

      test('it renders a custom tbody', () => {
        const Header = () => <tbody className="custom-tbody" />;

        props.components.Header = Header;
        const wrapper = render(
          <KineticLib>{buildTableHeader(buildProps(props))}</KineticLib>,
        );

        expect(wrapper.is('tbody.custom-tbody')).toBeTruthy();
      });
    });

    describe('#buildTableBodyRows', () => {
      test('it renders rows normally', () => {
        const wrapper = render(
          <KineticLib>
            <table>
              <tbody>{buildTableBodyRows(buildProps(props))}</tbody>
            </table>
          </KineticLib>,
        );

        expect(wrapper.find('tr')).toHaveLength(props.rows.size);
        expect(
          wrapper
            .find('tr')
            .first()
            .hasClass('custom-tr'),
        ).toBeFalsy();
      });

      test('it renders custom rows', () => {
        const BodyRow = () => <tr className="custom-tr" />;
        props.components.BodyRow = BodyRow;

        const wrapper = render(
          <KineticLib>
            <table>
              <tbody>{buildTableBodyRows(buildProps(props))}</tbody>
            </table>
          </KineticLib>,
        );

        expect(wrapper.find('tr')).toHaveLength(props.rows.size);
        expect(
          wrapper
            .find('tr')
            .first()
            .hasClass('custom-tr'),
        ).toBeTruthy();
      });

      test('it renders default empty row', () => {
        props.rows = List([]);

        const wrapper = render(
          <KineticLib>
            <table>
              <tbody>{buildTableBodyRows(buildProps(props))}</tbody>
            </table>
          </KineticLib>,
        );

        expect(wrapper.find('tr')).toHaveLength(1);
        expect(
          wrapper
            .find('tr')
            .first()
            .hasClass('custom-empty-tr'),
        ).toBeFalsy();
      });

      test('it renders custom empty row', () => {
        const EmptyBodyRow = () => <tr className="custom-empty-tr" />;
        props.rows = List([]);
        props.components.EmptyBodyRow = EmptyBodyRow;

        const wrapper = render(
          <KineticLib>
            <table>
              <tbody>{buildTableBodyRows(buildProps(props))}</tbody>
            </table>
          </KineticLib>,
        );

        expect(wrapper.find('tr')).toHaveLength(1);
        expect(wrapper.find('tr').hasClass('custom-empty-tr')).toBeTruthy();
      });
    });

    describe('#buildTableBodyCells', () => {
      test('it renders cells normally', () => {
        const wrapper = render(
          <KineticLib>
            <table>
              <tbody>
                <tr>
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

        expect(wrapper.find('tr td')).toHaveLength(1);
        expect(
          wrapper
            .find('tr td')
            .first()
            .hasClass('custom-td'),
        ).toBeFalsy();
      });

      test('it renders custom cells', () => {
        const BodyCell = () => <td className="custom-td" />;
        props.components.BodyCell = BodyCell;

        const wrapper = render(
          <KineticLib>
            <table>
              <tbody>
                <tr>
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

        expect(wrapper.find('tr td')).toHaveLength(props.columnSet.size);
        expect(
          wrapper
            .find('tr td')
            .first()
            .hasClass('custom-td'),
        ).toBeTruthy();
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

        const wrapper = render(
          <KineticLib>
            <table>
              <tbody>
                <tr>
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

        expect(wrapper.find('tr td')).toHaveLength(props.columns.size);
        expect(
          wrapper
            .find('tr td')
            .first()
            .hasClass('custom-td'),
        ).toBeFalsy();
        expect(
          wrapper
            .find('tr td')
            .last()
            .hasClass('custom-td'),
        ).toBeTruthy();
      });
    });

    describe('#buildTableFooter', () => {
      test('it does not render normally', () => {
        const wrapper = render(
          <KineticLib>{buildTableFooter(buildProps(props))}</KineticLib>,
        );

        expect(wrapper.is('tfoot')).toBeFalsy();
      });

      test('it renders with includeFooter', () => {
        props.includeFooter = true;
        const wrapper = render(
          <KineticLib>{buildTableFooter(buildProps(props))}</KineticLib>,
        );

        expect(wrapper.is('tfoot')).toBeTruthy();
        expect(wrapper.is('tfoot.custom-tfoot')).toBeFalsy();
      });

      test('it renders a custom tfoot', () => {
        const Footer = () => <tfoot className="custom-tfoot" />;
        props.includeFooter = true;
        props.components.Footer = Footer;

        const wrapper = render(
          <KineticLib>{buildTableFooter(buildProps(props))}</KineticLib>,
        );

        expect(wrapper.is('tfoot.custom-tfoot')).toBeTruthy();
      });
    });

    describe('#buildTableFooterRow', () => {
      test('it renders normally', () => {
        const wrapper = render(
          <KineticLib>{buildTableFooterRow(buildProps(props))}</KineticLib>,
        );

        expect(wrapper.is('tr')).toBeTruthy();
        expect(wrapper.is('tr.custom-tr')).toBeFalsy();
      });

      test('it renders a custom tr', () => {
        const FooterRow = () => <tr className="custom-tr" />;

        props.components.FooterRow = FooterRow;
        const wrapper = render(
          <KineticLib>{buildTableFooterRow(buildProps(props))}</KineticLib>,
        );

        expect(wrapper.is('tr.custom-tr')).toBeTruthy();
      });
    });

    describe('#buildTableFooterCells', () => {
      test('it renders normally', () => {
        const wrapper = render(
          <KineticLib>{buildTableFooterCells(buildProps(props))}</KineticLib>,
        );

        expect(wrapper.first().is('td')).toBeTruthy();
        expect(wrapper.first().is('td.custom-td')).toBeFalsy();
      });

      test('it renders a custom td', () => {
        const FooterCell = () => <td className="custom-td" />;
        props.components.FooterCell = FooterCell;

        const wrapper = render(
          <KineticLib>{buildTableFooterCells(buildProps(props))}</KineticLib>,
        );

        expect(wrapper.is('td.custom-td')).toBeTruthy();
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

        const wrapper = render(
          <KineticLib>
            <tfoot>
              <tr>{buildTableFooterCells(buildProps(props))}</tr>
            </tfoot>
          </KineticLib>,
        );

        expect(wrapper.find('td')).toHaveLength(props.columns.size);
        expect(
          wrapper
            .find('td')
            .first()
            .hasClass('custom-td'),
        ).toBeFalsy();
        expect(
          wrapper
            .find('td')
            .last()
            .hasClass('custom-td'),
        ).toBeTruthy();
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

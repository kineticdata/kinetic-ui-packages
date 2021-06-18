import {
  operations,
  isValueEmpty,
  clientSideGotoPage,
  serverSideGotoPage,
} from './Table.redux';
import { List, Range, Map } from 'immutable';

describe('<Table /> redux', () => {
  describe('setup', () => {
    test('true dat', () => {
      expect(true).toBeTruthy();
    });
  });

  describe('client-side operations', () => {
    test('startsWith', () => {
      const op = operations.get('startsWith');
      expect(op('currentValue', 'cur')).toBeTruthy();
    });
    test('equals', () => {
      const op = operations.get('equals');
      expect(op('currentValue', 'cur')).toBeFalsy();
      expect(op('currentValue', 'currentValue')).toBeTruthy();
      expect(op('CURRENTVALUE', 'currentValue')).toBeTruthy();
      expect(op(1, 2)).toBeFalsy();
      expect(op(1, 1)).toBeTruthy();
    });
    test('lt', () => {
      const op = operations.get('lt');
      expect(op(10, 9)).toBeFalsy();
      expect(op(10, 11)).toBeTruthy();
    });
    test('lteq', () => {
      const op = operations.get('lteq');
      expect(op(10, 9)).toBeFalsy();
      expect(op(10, 10)).toBeTruthy();
      expect(op(10, 11)).toBeTruthy();
    });
    test('gt', () => {
      const op = operations.get('gt');
      expect(op(10, 9)).toBeTruthy();
      expect(op(10, 11)).toBeFalsy();
    });
    test('gteq', () => {
      const op = operations.get('gteq');
      expect(op(10, 9)).toBeTruthy();
      expect(op(10, 10)).toBeTruthy();
      expect(op(10, 11)).toBeFalsy();
    });
    test('between', () => {
      const op = operations.get('between');
      expect(op(10, List([1, 20]))).toBeTruthy();
      expect(op(1, List([1, 20]))).toBeTruthy();
      expect(op(20, List([1, 20]))).toBeFalsy();
      expect(op(21, List([1, 20]))).toBeFalsy();
      expect(op(0, List([1, 20]))).toBeFalsy();
    });
    test('in', () => {
      const op = operations.get('in');
      expect(op('a', List(['a', 'b', 'c']))).toBeTruthy();
      expect(op('A', List(['a', 'b', 'c']))).toBeTruthy();
      expect(op('b', List(['a', 'b', 'c']))).toBeTruthy();
      expect(op('c', List(['a', 'b', 'c']))).toBeTruthy();
      expect(op('d', List(['a', 'b', 'c']))).toBeFalsy();
    });
  });

  describe('#isValueEmpty', () => {
    test('is empty when undefined', () => {
      let a;
      expect(isValueEmpty(a)).toBeTruthy();
    });
    test('is empty when empty string', () => {
      let a = '';
      expect(isValueEmpty(a)).toBeTruthy();
    });
    test('is not empty when it is string', () => {
      let a = 'a';
      expect(isValueEmpty(a)).toBeFalsy();
    });
    test('is empty when empty List', () => {
      let a = List();
      expect(isValueEmpty(a)).toBeTruthy();
    });
    test('is empty when List of empty strings', () => {
      let a = List(['', '']);
      expect(isValueEmpty(a)).toBeTruthy();
    });
    test('is not empty when List of items', () => {
      let a = List(['a', 'b']);
      expect(isValueEmpty(a)).toBeFalsy();
      a = List([1, 2]);
      expect(isValueEmpty(a)).toBeFalsy();
    });
  });

  describe('#clientSideGotoPage', () => {
    let tableData;
    beforeEach(() => {
      tableData = Map({
        pageSize: 5,
        pageOffset: 0,
        data: Range(1, 25).toList(),
      });
    });

    describe('when pageNumber is invalid', () => {
      test('invalid type does not affect tableData', () => {
        expect(clientSideGotoPage(tableData, 'foo')).toEqualImmutable(
          tableData,
        );
      });
      test('invalid number does not affect tableData', () => {
        expect(clientSideGotoPage(tableData, -1)).toEqualImmutable(tableData);
      });
    });

    test('pageNumber 1 offset is 0', () => {
      const newTableData = clientSideGotoPage(
        tableData.set('pageOffset', 10),
        1,
      );
      expect(newTableData.get('pageOffset')).toBe(0);
    });

    test('pageNumber 2 offset is 5', () => {
      const newTableData = clientSideGotoPage(tableData, 2);
      expect(newTableData.get('pageOffset')).toBe(5);
    });

    test('pageNumber 6 offset is unchanged (past the end of the data)', () => {
      const newTableData = clientSideGotoPage(tableData, 6);
      expect(newTableData.get('pageOffset')).toBe(0);
    });

    test('pageNumber 5 offset is 20 (last page)', () => {
      const newTableData = clientSideGotoPage(tableData, 5);
      expect(newTableData.get('pageOffset')).toBe(20);
    });
  });

  describe('#serverSideGotoPage', () => {
    let tableData;

    beforeEach(() => {
      tableData = Map({
        loading: false,
        nextPageToken: 'abc',
        pageTokens: List([2, 3, 4]),
      });
    });

    describe('when pageNumber is invalid', () => {
      test('invalid type does not affect tableData', () => {
        expect(serverSideGotoPage(tableData, 'foo')).toEqualImmutable(
          tableData,
        );
      });
      test('invalid number does not affect tableData', () => {
        expect(serverSideGotoPage(tableData, -1)).toEqualImmutable(tableData);
      });
    });

    test('when there are not enough pageTokens it does not affect tableData', () => {
      expect(serverSideGotoPage(tableData, 5)).toEqualImmutable(tableData);
    });

    test('when going to the first page reset the page tokens', () => {
      const newTableData = serverSideGotoPage(tableData, 1);

      expect(newTableData.get('loading')).toBe(true);
      expect(newTableData.get('nextPageToken')).toBeNull();
      expect(newTableData.get('pageTokens').size).toBe(0);
    });

    test('when going to a valid page use its pageToken and adjust the page tokens', () => {
      const secondTableData = serverSideGotoPage(tableData, 2);
      const thirdTableData = serverSideGotoPage(tableData, 3);

      expect(secondTableData.get('loading')).toBe(true);
      expect(secondTableData.get('nextPageToken')).toBe(2);
      expect(secondTableData.get('pageTokens').size).toBe(0);

      expect(thirdTableData.get('loading')).toBe(true);
      expect(thirdTableData.get('nextPageToken')).toBe(3);
      expect(thirdTableData.get('pageTokens').size).toBe(1);
    });
  });
});

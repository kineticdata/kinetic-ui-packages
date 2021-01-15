import { List, Map, fromJS } from 'immutable';
import isarray from 'isarray';
import {
  call,
  cancel,
  delay,
  fork,
  put,
  select,
  takeEvery,
} from 'redux-saga/effects';
import { action, dispatch, regHandlers, regSaga } from '../../store';
import { mountForm, unmountForm } from '..';

export const hasData = data => isarray(data) || data instanceof List;
const noop = () => null;
const getDataSource = tableData => {
  const tableOptions = tableData.get('tableOptions');
  const dataSourceFn = tableData.get('dataSource') || noop;

  return dataSourceFn(tableOptions);
};

export const isClientSide = tableData => {
  const data = tableData.get('data');
  const dataSource = getDataSource(tableData);

  return (
    hasData(data) &&
    ((dataSource &&
      (dataSource.clientSideSearch === true || dataSource.clientSide)) ||
      !dataSource)
  );
};

const clientSideNextPage = tableData =>
  tableData.update(
    'pageOffset',
    pageOffset => pageOffset + tableData.get('pageSize'),
  );

const clientSidePrevPage = tableData =>
  tableData.update('pageOffset', pageOffset =>
    Math.max(0, pageOffset - tableData.get('pageSize')),
  );

const serverSideNextPage = tableData =>
  tableData
    .set('loading', true)
    .set('nextPageToken', tableData.get('currentPageToken'))
    .update('pageTokens', pt => pt.push(tableData.get('currentPageToken')));

const serverSidePrevPage = tableData =>
  tableData
    .set('loading', true)
    .update('pageTokens', pt => pt.pop())
    .update(t => t.set('nextPageToken', t.get('pageTokens').last()));

// should be '' except if op is between, or in
const getInitialFilterValue = column =>
  column.has('initial')
    ? column.get('initial')
    : column.get('filter') === 'between'
      ? List(['', ''])
      : column.get('filter') === 'in'
        ? List()
        : '';

export const generateFilters = (tableKey, columns) =>
  Map(
    columns.filter(c => c.get('filter')).reduce(
      (filters, column) =>
        filters.set(
          column.get('value'),
          Map({
            value: getInitialFilterValue(column),
            column,
          }),
        ),

      Map(),
    ),
  );

const evaluateValidFilters = table => {
  const validateFilters = table.get('onValidateFilters');
  return validateFilters ? validateFilters(table.get('filters')) : true;
};

export const generateInitialSortColumn = (sortColumn, columns) =>
  sortColumn ? columns.find(col => col.get('value') === sortColumn) : null;

regHandlers({
  MOUNT_TABLE: (state, { payload: { tableKey } }) => {
    return state.setIn(['tables', tableKey, 'mounted'], true);
  },
  UNMOUNT_TABLE: (state, { payload: { tableKey } }) => {
    return state.deleteIn(['tables', tableKey]);
  },
  CONFIGURE_TABLE: (
    state,
    {
      payload: {
        tableKey,
        data,
        dataSource,
        columns,
        pageSize = 25,
        defaultSortColumn = null,
        defaultSortDirection = 'desc',
        tableOptions,
        onValidateFilters,
        filterForm,
      },
    },
  ) =>
    !state.getIn(['tables', tableKey, 'mounted'])
      ? state
      : state.hasIn(['tables', tableKey, 'configured'])
        ? state.setIn(['tables', tableKey, 'initialize'], false)
        : state.mergeIn(
            ['tables', tableKey],
            Map({
              data: hasData(data) ? fromJS(data) : data,
              dataSource,
              tableOptions,
              columns,
              rows: List(),

              initializing: true,
              loading: true,

              pageSize,
              sortColumn: generateInitialSortColumn(defaultSortColumn, columns),
              sortDirection: defaultSortDirection,

              // Pagination
              currentPageToken: null,
              nextPageToken: null,
              pageTokens: List(),
              pageOffset: 0,
              error: null,

              // Filtering
              filterForm,
              filters: generateFilters(tableKey, columns),
              appliedFilters: generateFilters(tableKey, columns),
              validFilters: true,
              onValidateFilters,

              configured: true,
              initialize: true,
            }),
          ),

  SET_ROWS: (
    state,
    { payload: { tableKey, rows, data, nextPageToken, error = null } },
  ) =>
    state.updateIn(
      ['tables', tableKey],
      table =>
        table &&
        table
          .set('rows', rows)
          .set('data', data)
          .set('currentPageToken', nextPageToken)
          .set('nextPageToken', null)
          .set('error', error)
          .set('initializing', false)
          .set('loading', false),
    ),
  NEXT_PAGE: (state, { payload: { tableKey } }) =>
    state
      .updateIn(
        ['tables', tableKey],
        tableData =>
          isClientSide(tableData)
            ? clientSideNextPage(tableData)
            : serverSideNextPage(tableData),
      )
      .setIn(['tables', tableKey, 'error'], null),
  PREV_PAGE: (state, { payload: { tableKey } }) =>
    state
      .updateIn(
        ['tables', tableKey],
        tableData =>
          isClientSide(tableData)
            ? clientSidePrevPage(tableData)
            : serverSidePrevPage(tableData),
      )
      .setIn(['tables', tableKey, 'error'], null),
  SORT_COLUMN: (state, { payload: { tableKey, column } }) =>
    state.updateIn(['tables', tableKey], t => {
      const sortColumn = t.get('sortColumn');
      const sortDirection = t.get('sortDirection');
      return (
        t
          // When sorting changes, reset pagination.
          .set('pageOffset', 0)
          // Update the sort column / direction.
          .set(
            'sortDirection',
            sortColumn === column
              ? sortDirection === 'desc'
                ? 'asc'
                : 'desc'
              : 'asc',
          )
          .set('sortColumn', column)
          .set('error', null)
      );
    }),
  SET_FILTER: (state, { payload: { tableKey, filter, value } }) =>
    state.updateIn(['tables', tableKey], table =>
      table
        .setIn(['filters', filter, 'value'], value)
        .set('validFilters', evaluateValidFilters(table)),
    ),
  APPLY_FILTERS: (state, { payload: { tableKey } }) =>
    state.updateIn(['tables', tableKey], table =>
      table
        .set('loading', true)
        .set('appliedFilters', state.getIn(['tables', tableKey, 'filters']))
        .set('pageOffset', 0)
        .set('currentPageToken', null)
        .set('nextPageToken', null)
        .set('pageTokens', List())
        .set('error', null),
    ),
  APPLY_FILTER_FORM: (state, { payload: { tableKey, appliedFilters } }) =>
    state.updateIn(['tables', tableKey], table =>
      table
        .set('loading', true)
        .set('appliedFilters', appliedFilters)
        .set('pageOffset', 0)
        .set('currentPageToken', null)
        .set('nextPageToken', null)
        .set('pageTokens', List())
        .set('error', null),
    ),
  REFETCH_TABLE_DATA: (state, { payload: { tableKey } }) =>
    state.hasIn(['tables', tableKey])
      ? state.updateIn(
          ['tables', tableKey],
          tableData =>
            tableData.get('dataSource')
              ? tableData
                  .set('loading', true)
                  .set('pageOffset', 0)
                  .set('currentPageToken', null)
                  .set('nextPageToken', null)
                  .set('pageTokens', List())
                  .set('data', null)
                  .set('error', null)
              : tableData,
        )
      : state,
  CLEAR_TABLE_FILTERS: (state, { payload: { tableKey } }) =>
    state.setIn(
      ['tables', tableKey, 'filters'],
      generateFilters(tableKey, state.getIn(['tables', tableKey, 'columns'])),
    ),
  CLEAR_SELECTED_FILTERS: (state, { payload: { tableKey } }) =>
    state.setIn(
      ['tables', tableKey, 'filters'],
      state.getIn(['tables', tableKey, 'appliedFilters']),
    ),
});

function* calculateRowsTask({ payload }) {
  try {
    const { tableKey } = payload;
    const tableData = yield select(state => state.getIn(['tables', tableKey]));

    // Skip this process if the table hasn't been mounted yet.
    if (!tableData) return;

    const response = yield call(calculateRows, tableData);

    const { rows, data, nextPageToken, error } = response;

    if (error) {
      yield put({
        type: 'SET_ROWS',
        payload: {
          tableKey,
          error,
          rows: List(),
          data: List(),
          nextPageToken: null,
        },
      });
    } else {
      yield put({
        type: 'SET_ROWS',
        payload: { tableKey, rows, data, nextPageToken },
      });
    }
  } catch (e) {
    console.error(e);
  }
}

function* configureTableTask({ payload }) {
  const { filterForm, tableKey, initialFilterValues } = payload;
  if (!filterForm) {
    yield put(action('APPLY_FILTERS', { tableKey }));
  } else {
    yield put(
      action('APPLY_FILTER_FORM', {
        tableKey,
        appliedFilters: Map(initialFilterValues),
      }),
    );
  }
}

const pollerTableKeys = {};
function* pollingTask(tableKey) {
  while (true) {
    yield delay(10000);
    refetchTable(tableKey);
  }
}
function* startPollingTask({ payload }) {
  const { refreshInterval, tableKey } = payload;
  if (refreshInterval && !pollerTableKeys[tableKey]) {
    pollerTableKeys[tableKey] = yield fork(
      pollingTask,
      tableKey,
      refreshInterval,
    );
  }
}
function* stopPollingTask({ payload }) {
  const tableKey = payload.tableKey;
  if (pollerTableKeys[tableKey]) {
    yield cancel(pollerTableKeys[tableKey]);
    pollerTableKeys[tableKey] = null;
  }
}

regSaga('CONFIGURE_TABLE', function*() {
  yield takeEvery('CONFIGURE_TABLE', configureTableTask);
  yield takeEvery('CONFIGURE_TABLE', startPollingTask);
});
//
regSaga(takeEvery('UNMOUNT_TABLE', stopPollingTask));
regSaga(takeEvery('NEXT_PAGE', calculateRowsTask));
regSaga(takeEvery('PREV_PAGE', calculateRowsTask));
regSaga(takeEvery('SORT_COLUMN', calculateRowsTask));
regSaga(takeEvery('SORT_DIRECTION', calculateRowsTask));
regSaga(takeEvery('APPLY_FILTERS', calculateRowsTask));
regSaga(takeEvery('APPLY_FILTER_FORM', calculateRowsTask));
regSaga(takeEvery('REFETCH_TABLE_DATA', calculateRowsTask));

export const operations = Map({
  includes: (cv, v) => cv.toLocaleLowerCase().includes(v.toLocaleLowerCase()),
  startsWith: (cv, v) =>
    cv.toLocaleLowerCase().startsWith(v.toLocaleLowerCase()),
  equals: (cv, v) =>
    typeof cv === 'string'
      ? cv.toLocaleLowerCase() === v.toLocaleLowerCase()
      : cv === v,
  lt: (cv, v) => cv < v,
  lteq: (cv, v) => cv <= v,
  gt: (cv, v) => cv > v,
  gteq: (cv, v) => cv >= v,
  between: (cv, v) => cv >= v.get(0) && cv < v.get(1),
  in: (cv, v) =>
    v.reduce(
      (found, value) =>
        found ||
        (typeof value === 'string'
          ? cv.toLocaleLowerCase() === value.toLocaleLowerCase()
          : cv === value),
      false,
    ),
});

export const isValueEmpty = value => {
  if (value === null) {
    return true;
  } else if (typeof value === 'undefined') {
    return true;
  } else if (List.isList(value)) {
    if (value.isEmpty()) {
      return true;
    } else {
      return value.reduce((empty, v) => empty && (!v || v === ''), true);
    }
  } else if (value === '') {
    return true;
  }
  return !value;
};

export const clientSideRowFilter = (row, filters) => {
  const usableFilters = filters
    .filter(filter => filter.get('value') !== '')
    .map((filter, column) => filter.set('currentValue', row.get(column)));

  return usableFilters.size === 0
    ? true
    : usableFilters.reduce((has, filter) => {
        const currentValue = filter.get('currentValue');
        const op = operations.get(
          filter.getIn(['column', 'filter']),
          () => true,
        );
        const value = filter.get('value');

        return isValueEmpty(value) ? has : op(currentValue, value);
      }, true);
};

const applyClientSideFilters = (tableData, data) => {
  const pageOffset = tableData.get('pageOffset');
  const pageSize = tableData.get('pageSize');
  const sortColumn = tableData.get('sortColumn');
  const sortDirection = tableData.get('sortDirection');
  const filters = tableData.get('appliedFilters');
  const startIndex = pageOffset;
  const endIndex = Math.min(pageOffset + pageSize, data.size);
  const dataSource = getDataSource(tableData);

  // This is because the `defineFilter` function wants a native object
  // and not an Immutable map. This changes when we stop using the
  // `clientSideRowFilter` legacy function or when we support immutable
  // objects in the `defineFilter`.
  const clientSideFilters = filters.toJS();
  const rowFilter =
    !dataSource || dataSource.clientSideSearch === true
      ? row => clientSideRowFilter(row, filters)
      : typeof dataSource.clientSide === 'function'
        ? row => dataSource.clientSide(row.toJS(), clientSideFilters)
        : () => true;

  return List(data)
    .map(d => Map(d))
    .update(d => d.filter(rowFilter))
    .update(
      d => (sortColumn ? d.sortBy(r => r.get(sortColumn.get('value'))) : d),
    )
    .update(d => (sortDirection === 'asc' ? d.reverse() : d))
    .update(d => d.slice(startIndex, endIndex));
};

const transformData = (data, tableData) =>
  data.map(row => {
    const columns = tableData.get('columns');
    return columns.reduce((rowData, column) => {
      const valueTransform = column.get('valueTransform', v => v);

      return rowData.update(column.get('value'), value =>
        valueTransform(value, row),
      );
    }, row);
  });

const calculateRows = tableData => {
  const dataSource = getDataSource(tableData);

  if (isClientSide(tableData)) {
    const data = transformData(tableData.get('data'), tableData);
    const rows = applyClientSideFilters(tableData, data);

    return Promise.resolve({ rows, data });
  } else if (dataSource) {
    const transform = dataSource.transform || (result => result);
    const params = dataSource.params({
      pageSize: tableData.get('pageSize'),
      filters: tableData.get('appliedFilters'),
      sortColumn: tableData.getIn(['sortColumn', 'value']),
      sortDirection: tableData.get('sortDirection'),
      nextPageToken: tableData.get('nextPageToken'),
    });

    return dataSource.fn(...params).then(response => {
      if (response.error) return response;

      const { nextPageToken, data: responseData } = transform(response);
      const data = fromJS(responseData);
      const rows = transformData(data, tableData);

      return {
        nextPageToken,
        data,
        rows:
          dataSource.clientSideSearch || dataSource.clientSide
            ? applyClientSideFilters(tableData, rows)
            : rows,
      };
    });
  } else {
    throw new Error(
      'Unable to calculate rows: Missing both data and a dataSource!',
    );
  }
};

export const filterFormKey = tableKey => `${tableKey}.filter-form`;

export const mountTable = tableKey => {
  dispatch('MOUNT_TABLE', { tableKey });
  mountForm(filterFormKey(tableKey));
};
export const unmountTable = tableKey => {
  dispatch('UNMOUNT_TABLE', { tableKey });
  unmountForm(filterFormKey(tableKey));
};
export const configureTable = payload => {
  dispatch('CONFIGURE_TABLE', payload);
};
export const refetchTable = tableKey =>
  dispatch('REFETCH_TABLE_DATA', { tableKey });
export const clearFilters = tableKey =>
  dispatch('CLEAR_TABLE_FILTERS', { tableKey });

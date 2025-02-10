import React from 'react';
import t from 'prop-types';
import { I18n } from '../../core/i18n/I18n';

const HeaderCell = ({ onSortColumn, sortable, sorting, title }) => (
  <th {...(title ? { scope: 'col' } : {})}>
    {sortable === false ? (
      <I18n>{title}</I18n>
    ) : (
      <span>
        <I18n>{title}</I18n>
        <button type="button" onClick={onSortColumn}>
          {sorting === 'desc' ? (
            <span>&darr;</span>
          ) : sorting === 'asc' ? (
            <span>&uarr;</span>
          ) : (
            <span>&ndash;</span>
          )}
        </button>
      </span>
    )}
  </th>
);

HeaderCell.propTypes = {
  /** The event function to be used */
  onSortColumn: t.func,
  /** The column's human friendly title string. */
  title: t.string,
  /** Is the direction this column is sorting or `undefined` if not sorting by this column. */
  sorting: t.bool,
  /** A flag denoting whether this column can be sorted. */
  sortable: t.bool,
};

export default HeaderCell;

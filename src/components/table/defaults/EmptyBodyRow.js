import React from 'react';
import t from 'prop-types';
import { I18n } from '../../core/i18n/I18n';

const EmptyBodyRow = ({ colSpan }) => (
  <tr>
    <td className="text-center" colSpan={colSpan}>
      <em>
        <I18n>No data found.</I18n>
      </em>
    </td>
  </tr>
);

EmptyBodyRow.propTypes = {
  /** The columns configuration array. */
  columns: t.arrayOf(t.object),
  /** Denotes wherther the table has initialized and loaded its first set of data. */
  initializing: t.bool,
  /** Denotes whether the table is currently loading data. */
  loading: t.bool,
  /** The filter criteria that is being used for the current rows. */
  appliedFilters: t.object,
};

export default EmptyBodyRow;

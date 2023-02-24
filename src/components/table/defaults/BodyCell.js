import React from 'react';
import t from 'prop-types';

const BodyCell = ({ index, row, value }) => (
  <td {...(index === 0 ? { scope: 'row' } : {})}>{value}</td>
);

BodyCell.propTypes = {
  /** Represents the column index. */
  index: t.number.isRequired,
  /** The column object used for rendering the current column. */
  column: t.shape({
    /** The title that will be rendered in the header. */
    title: t.string,
    /** The value key that will be used to map the column to the data object. */
    value: t.string,
    /** Flag that determines if the column can be used as a filter. */
    filterable: t.bool,
    /** Flag that determines if the column is sortable.*/
    sortable: t.bool,
    /** Allows overriding the `HeaderCell`, `BodyCell`, and `FooterCell` for a given column. */
    components: t.shape({
      HeaderCell: t.func,
      BodyCell: t.func,
      FooterCell: t.func,
    }),
  }),
  /** The row object used for rendering the current row. */
  row: t.object,
  /** The value as retrieved by the column configuration. */
  value: t.any,
};

export default BodyCell;

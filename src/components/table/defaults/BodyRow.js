import React from 'react';
import t from 'prop-types';

const BodyRow = ({ cells }) => <tr>{cells}</tr>;

BodyRow.propTypes = {
  /** Contains the rendered cells for the current table row. */
  cells: t.object,
  /** The columns configuration object. */
  columns: t.object,
  /** The row object used for rendering the current row. */
  row: t.object,
  /** The row index. */
  index: t.number,
  /** The overall rows object, representing visible data in the table. */
  rows: t.object,
};
export default BodyRow;

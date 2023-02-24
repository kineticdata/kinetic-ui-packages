import React from 'react';
import t from 'prop-types';

const TableLayout = ({ header, body, footer }) => (
  <table>
    {header}
    {body}
    {footer}
  </table>
);

TableLayout.propTypes = {
  /** Contains the rendered table header. */
  header: t.object,
  /** Contains the rendered table body. */
  body: t.object.isRequired,
  /** Contains the rendered table footer. */
  footer: t.object,
  /** Denotes wherther the table has initialized and loaded its first set of data. */
  initializing: t.bool,
  /** Denotes whether the table is currently loading data. */
  loading: t.bool,
};

export default TableLayout;

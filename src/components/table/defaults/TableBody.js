import React from 'react';
import t from 'prop-types';

const TableBody = ({ tableRows }) => <tbody>{tableRows}</tbody>;

TableBody.propTypes = {
  /** If the table is loading data */
  loading: t.bool,
  /** If the table is initializing */
  initializing: t.bool,
  /** The tables rows */
  tableRows: t.oneOfType([t.array, t.object]).isRequired,
};

export default TableBody;

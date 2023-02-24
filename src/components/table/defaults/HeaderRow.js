import React from 'react';
import t from 'prop-types';

const HeaderRow = ({ columnHeaders }) => <tr>{columnHeaders}</tr>;

HeaderRow.propTypes = {
  /** Contains the rendered column headers. */
  columnHeaders: t.object.isRequired,
};

export default HeaderRow;

import React from 'react';
import t from 'prop-types';

const FooterCell = () => <td />;

FooterCell.propTypes = {
  /** The column object used for rendering the current column. */
  column: t.object,
  /** The overall rows object, representing visible data in the table. */
  rows: t.arrayOf(t.object),
};

export default FooterCell;

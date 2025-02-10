import React from 'react';
import t from 'prop-types';
import { I18n } from '../../core/i18n/I18n';

export const PaginationControl = ({ nextPage, prevPage, loading }) => (
  <div>
    <button onClick={prevPage} disabled={loading || !prevPage}>
      <I18n>Previous</I18n>
    </button>
    <button onClick={nextPage} disabled={loading || !nextPage}>
      <I18n>Next</I18n>
    </button>
  </div>
);

PaginationControl.propTypes = {
  /** The function that fetches the next page. */
  nextPage: t.func,
  /** The function that fetches the previous page. */
  prevPage: t.func,
  /** If the table is currently loading (fetching data). */
  laoding: t.bool,
};

export default PaginationControl;

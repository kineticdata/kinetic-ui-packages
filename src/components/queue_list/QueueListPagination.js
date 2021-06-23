import React from 'react';
import { I18n } from '@kineticdata/react';

export const QueueListPagination = ({
  filter,
  paging,
  pageIndexStart,
  pageIndexEnd,
  hasPreviousPage,
  hasNextPage,
  handlePrevious,
  handleNext,
  refreshPage,
  limit,
  count,
}) => {
  return (
    <div className="queue-controls">
      <div className="queue-controls__pagination">
        <button
          type="button"
          className="btn btn-icon"
          disabled={!hasPreviousPage}
          onClick={handlePrevious}
          aria-label="Previous Page"
        >
          <span className="icon" aria-hidden="true">
            <span className="fa fa-caret-left" />
          </span>
        </button>
        {paging ? (
          <span className="fa fa-spinner fa-spin" />
        ) : (
          <small className="text-center">
            <strong>
              {pageIndexStart}-{pageIndexEnd}
            </strong>
            {(count || count === 0) && (
              <>
                {' '}
                <I18n>of</I18n> <strong>{count}</strong>
              </>
            )}
          </small>
        )}
        <button
          type="button"
          className="btn btn-icon"
          disabled={!hasNextPage}
          onClick={handleNext}
          aria-label="Next Page"
        >
          <span className="icon" aria-hidden="true">
            <span className="fa fa-caret-right" />
          </span>
        </button>
      </div>
    </div>
  );
};

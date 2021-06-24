import React from 'react';
import { I18n } from '@kineticdata/react';

const PAGE_SIZES = [10, 25, 50, 100];

export const QueueListPagination = ({
  paging,
  pageIndexStart,
  pageIndexEnd,
  hasPreviousPage,
  hasNextPage,
  handlePrevious,
  handleNext,
  count,
  limit,
  updateListLimit,
}) => {
  return (
    <div className="queue-controls">
      <div className="queue-controls__pagination">
        <div className="paging">
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
        <div className="page-size">
          <I18n
            render={translate => (
              <select
                name="per-page-select"
                aria-label="Page Size"
                value={limit}
                onChange={e => updateListLimit(parseInt(e.target.value))}
              >
                {PAGE_SIZES.map(n => (
                  <option key={n} value={n}>
                    {`${n} ${translate('per page')}`}
                  </option>
                ))}
              </select>
            )}
          />
        </div>
      </div>
    </div>
  );
};

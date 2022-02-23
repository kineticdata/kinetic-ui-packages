import React from 'react';
import { compose, withHandlers } from 'recompose';
import { connect } from '../../redux/store';
import { actions } from '../../redux/modules/queue';
import { I18n } from '@kineticdata/react';
import classNames from 'classnames';

const PAGE_SIZES = [10, 25, 50, 100];

export const QueueListPaginationComponent = ({
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
  selectionMode,
  changeSelectionMode,
  isMobile,
}) => {
  return (
    <div className="queue-controls">
      <div className="queue-controls__pagination">
        <div className="selection-mode">
          <button
            type="button"
            className="btn btn-icon"
            onClick={changeSelectionMode}
            aria-label="Next Page"
          >
            <span className="icon" aria-hidden="true">
              <span
                className={classNames('fa fa-fw', {
                  'fa-toggle-off': !selectionMode,
                  'fa-toggle-on': selectionMode,
                })}
              />
            </span>
            {!isMobile && <span>Selection Mode</span>}
          </button>
        </div>
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

const mapStateToProps = (state, props) => {
  return {
    paging: state.queue.paging,
    pageIndexStart: state.queue.pageIndexStart,
    pageIndexEnd: state.queue.pageIndexEnd,
    hasPreviousPage: state.queue.hasPreviousPage,
    hasNextPage: state.queue.hasNextPage,
    limit: state.queue.limit,
    count: state.queue.counts.get(props.filter),
    selectionMode: state.queue.selectedList !== null,
    isMobile: state.app.layoutSize === 'small',
  };
};

const mapDispatchToProps = {
  previousPage: actions.fetchListPrevious,
  nextPage: actions.fetchListNext,
  updateListLimit: actions.updateListLimit,
  toggleSelectionMode: actions.toggleSelectionMode,
};

export const QueueListPagination = compose(
  connect(
    mapStateToProps,
    mapDispatchToProps,
  ),
  withHandlers({
    handlePrevious: props => () => props.previousPage(),
    handleNext: props => () => props.nextPage(),
    changeSelectionMode: props => () => props.toggleSelectionMode(),
  }),
)(QueueListPaginationComponent);

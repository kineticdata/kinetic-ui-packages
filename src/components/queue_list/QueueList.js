import React from 'react';
import { QueueListItemSmall } from './QueueListItem';
import { LoadingMessage, EmptyMessage } from '@kineticdata/bundle-common';
import { FilterMenuToolbar } from '../filter_menu/FilterMenuToolbar';
import { FilterMenuModal } from '../filter_menu/FilterMenuModal';
import { QueueListPagination } from './QueueListPagination';
import { PageTitle } from '../shared/PageTitle';

const QueueEmptyMessage = ({ filter }) => {
  if (filter.type === 'adhoc') {
    return (
      <EmptyMessage title="No Results" message="Try a less specific filter." />
    );
  }

  return (
    <EmptyMessage
      title="No Assignments"
      message="An empty queue is a happy queue."
    />
  );
};

const QueueErrorMessage = ({ message }) => (
  <EmptyMessage
    title={'Error'}
    message={message || 'There was a problem retrieving items.'}
  />
);

const QueueBadFilterMessage = ({ message }) => (
  <EmptyMessage
    title="Invalid List"
    message={
      message || 'Invalid list, please choose a valid list from the left side.'
    }
  />
);

export const QueueList = ({
  filter,
  loading,
  paging,
  data,
  error,
  pageIndexStart,
  pageIndexEnd,
  hasPreviousPage,
  hasNextPage,
  handleRefresh,
  handlePrevious,
  handleNext,
  count,
  limit,
  updateListLimit,
  isMobile,
  filterValidations,
  hasTeams,
  hasForms,
  setQueueListRef,
}) => {
  const paginationProps =
    !error && !loading && data && (data.size > 0 || hasPreviousPage)
      ? {
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
        }
      : null;

  return (
    <div className="page-container">
      {!filter ? (
        <div className="page-panel page-panel--no-padding">
          <PageTitle parts={['Invalid List']} />
          <QueueBadFilterMessage />
        </div>
      ) : (
        <div className="page-panel page-panel--no-padding page-panel--white page-panel--flex">
          <PageTitle parts={[filter.name || 'Adhoc']} />
          <div className="page-panel__header">
            {isMobile ? (
              <FilterMenuModal filter={filter} refresh={handleRefresh} />
            ) : (
              <FilterMenuToolbar filter={filter} refresh={handleRefresh} />
            )}
          </div>
          <div className="page-panel__body" ref={setQueueListRef}>
            {filterValidations.length <= 0 ? (
              <div className="queue-list-content submissions">
                {error ? (
                  <QueueErrorMessage message={error.message} />
                ) : loading ? (
                  <LoadingMessage />
                ) : data && data.size > 0 ? (
                  <ul className="list-group">
                    {data.map(queueItem => (
                      <QueueListItemSmall
                        queueItem={queueItem}
                        key={queueItem.id}
                        filter={filter}
                      />
                    ))}
                  </ul>
                ) : (
                  <QueueEmptyMessage filter={filter} />
                )}
              </div>
            ) : (
              <QueueBadFilterMessage
                message={filterValidations.map((v, i) => <p key={i}>{v}</p>)}
              />
            )}
          </div>
          {paginationProps && (
            <div className="page-panel__footer">
              <QueueListPagination filter={filter} {...paginationProps} />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

import React from 'react';
import { compose, lifecycle, withProps } from 'recompose';
import { TimeAgo, LoadingMessage } from '@kineticdata/bundle-common';
import { actions } from '../../redux/modules/queue';
import { QueueItemDetailsContainer } from './QueueItemDetails';
import { getFilterByPath } from '../../redux/modules/queueApp';
import { I18n } from '@kineticdata/react';
import { connect } from '../../redux/store';
import { PageTitle } from '../shared/PageTitle';
import { StatusBadge } from '../shared/StatusContent';
import classNames from 'classnames';
import { List } from 'immutable';

export const QueueItem = ({
  loading,
  filter,
  queueItem,
  profile,
  isSmallLayout,
  navigate,
  appLocation,
  goToPreviousItem,
  goToNextItem,
}) => (
  <div className="page-container">
    <div className={classNames('page-panel')}>
      <PageTitle
        parts={[
          !loading ? queueItem.label : '',
          filter ? filter.name || 'Adhoc' : '',
        ]}
        breadcrumbs={[
          { label: 'Home', to: '/' },
          { label: 'Queue', to: appLocation },
          filter && {
            label: filter.name || 'Adhoc',
            to: `../..`,
          },
        ].filter(Boolean)}
        title={queueItem ? queueItem.values.Summary : ''}
        actions={[
          ...(goToPreviousItem || goToNextItem
            ? [
                {
                  icon: 'caret-left',
                  aria: 'Previous Queue Item',
                  onClick: goToPreviousItem,
                  disabled: !goToPreviousItem,
                  className: 'btn-outline-dark',
                },
                {
                  icon: 'caret-right',
                  aria: 'Next Queue Item',
                  onClick: goToNextItem,
                  disabled: !goToNextItem,
                  className: 'btn-outline-dark',
                },
              ]
            : []),
        ]}
        meta={
          queueItem && [
            {
              value: <StatusBadge queueItem={queueItem} withReason={true} />,
            },
            {
              value: (
                <span>
                  <I18n
                    context={`kapps.${queueItem.form.kapp.slug}.forms.${
                      queueItem.form.slug
                    }`}
                  >
                    {queueItem.form.name}
                  </I18n>{' '}
                  ({queueItem.handle})
                </span>
              ),
            },
            {
              label: 'Due',
              value: (
                <TimeAgo
                  timestamp={queueItem.values['Due Date']}
                  id="due-date"
                />
              ),
            },
            {
              label: 'Created',
              value: (
                <TimeAgo timestamp={queueItem.createdAt} id="created-at" />
              ),
            },
            {
              label: 'Updated',
              value: (
                <TimeAgo timestamp={queueItem.updatedAt} id="updated-at" />
              ),
            },
          ]
        }
      />

      {loading ? (
        <LoadingMessage />
      ) : (
        <QueueItemDetailsContainer filter={filter} navigate={navigate} />
      )}
    </div>
  </div>
);

export const mapStateToProps = (state, props) => ({
  filter: getFilterByPath(state, props.location.pathname),
  loading: !state.queue.currentItem || state.queue.currentItem.id !== props.id,
  queueItem: state.queue.currentItem,
  profile: state.app.profile,
  isSmallLayout: state.app.layoutSize === 'small',
  appLocation: state.app.location,
  currentPageData: state.queue.data,
  hasPreviousPage: state.queue.hasPreviousPage,
  hasNextPage: state.queue.hasNextPage,
});

export const mapDispatchToProps = {
  fetchCurrentItem: actions.fetchCurrentItem,
  setCurrentItem: actions.setCurrentItem,
  fetchNextPage: actions.fetchListNext,
  fetchPreviousPage: actions.fetchListPrevious,
};

export const QueueItemContainer = compose(
  connect(
    mapStateToProps,
    mapDispatchToProps,
  ),
  withProps(
    ({
      currentPageData,
      queueItem,
      hasPreviousPage,
      fetchPreviousPage,
      hasNextPage,
      fetchNextPage,
      navigate,
    }) => {
      const currentIndex =
        queueItem && List.isList(currentPageData)
          ? currentPageData.findIndex(item => item.id === queueItem.id)
          : -1;
      return currentIndex >= 0
        ? {
            goToPreviousItem:
              currentIndex === 0
                ? hasPreviousPage
                  ? // If on first item of page but previous page exists, fetch
                    // previous page and then navigate to last item
                    () =>
                      fetchPreviousPage(
                        submissions =>
                          submissions &&
                          navigate(
                            `../${submissions[submissions.length - 1].id}`,
                          ),
                      )
                  : undefined
                : // If not on first item of page, navigate to previous item
                  () =>
                    navigate(
                      `../${currentPageData.getIn([currentIndex - 1, 'id'])}`,
                    ),
            goToNextItem:
              currentIndex === currentPageData.size - 1
                ? hasNextPage
                  ? // If on last item of page but next page exists, fetch
                    // next page and then navigate to first item
                    () =>
                      fetchNextPage(
                        submissions =>
                          submissions && navigate(`../${submissions[0].id}`),
                      )
                  : undefined
                : // If not on last item of page, navigate to next item
                  () =>
                    navigate(
                      `../${currentPageData.getIn([currentIndex + 1, 'id'])}`,
                    ),
          }
        : {};
    },
  ),
  lifecycle({
    componentDidMount() {
      this.props.fetchCurrentItem(this.props.id);
    },
    componentDidUpdate(prevProps) {
      if (this.props.id !== prevProps.id) {
        this.props.fetchCurrentItem(this.props.id);
      }
    },
    componentWillUnmount() {
      this.props.setCurrentItem(null);
    },
  }),
)(QueueItem);

import React from 'react';
import { compose, lifecycle, withHandlers, withProps } from 'recompose';
import {
  TimeAgo,
  LoadingMessage,
  selectDiscussionsEnabled,
} from '@kineticdata/bundle-common';
import { actions } from '../../redux/modules/queue';
import { QueueItemDetailsContainer } from './QueueItemDetails';
import { getFilterByPath } from '../../redux/modules/queueApp';
import { I18n, createRelatedItem } from '@kineticdata/react';
import { connect } from '../../redux/store';
import { PageTitle } from '../shared/PageTitle';
import { StatusBadge } from '../shared/StatusContent';
import classNames from 'classnames';
import { List } from 'immutable';

const CreationForm = ({ onChange, values, errors }) => (
  <React.Fragment>
    <div className="form-group">
      <label htmlFor="title">Title</label>
      <input
        id="title"
        name="title"
        type="text"
        value={values.title}
        onChange={onChange}
      />
      {errors.title && (
        <small className="form-text text-danger">{errors.title}</small>
      )}
    </div>
    <div className="form-group">
      <label htmlFor="title">Description</label>
      <textarea
        id="description"
        name="description"
        value={values.description}
        onChange={onChange}
      />
      {errors.description && (
        <small className="form-text text-danger">{errors.description}</small>
      )}
    </div>
    <div className="form-group">
      <div className="form-check-inline">
        <input
          id="relateOriginatingRequest"
          name="relateOriginatingRequest"
          type="checkbox"
          className="form-check-input"
          checked={values.relateOriginatingRequest}
          onChange={onChange}
        />
        <label htmlFor="relateOriginatingRequest" className="form-check-label">
          Relate Originating Request
        </label>
      </div>
    </div>
  </React.Fragment>
);

export const QueueItem = ({
  loading,
  filter,
  queueItem,
  discussionsEnabled,
  creationFields,
  onDiscussionCreated,
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
        <QueueItemDetailsContainer
          filter={filter}
          creationFields={creationFields}
          onDiscussionCreated={onDiscussionCreated}
          CreationForm={CreationForm}
          navigate={navigate}
        />
      )}
    </div>
  </div>
);

export const mapStateToProps = (state, props) => ({
  filter: getFilterByPath(state, props.location.pathname),
  loading: !state.queue.currentItem || state.queue.currentItem.id !== props.id,
  queueItem: state.queue.currentItem,
  discussionsEnabled: selectDiscussionsEnabled(state),
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
  connect(mapStateToProps, mapDispatchToProps),
  withProps(
    props =>
      props.queueItem && {
        creationFields: {
          title: props.queueItem.label || 'Queue Discussion',
          description: props.queueItem.values['Details'] || '',
          owningTeams: props.queueItem.values['Assigned Team']
            ? [{ name: props.queueItem.values['Assigned Team'] }]
            : [],
          owningUsers: [
            {
              username:
                props.queueItem.values['Assigned Individual'] ||
                props.profile.username,
            },
          ],
          relateOriginatingRequest: true,
        },
      },
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
  withHandlers({
    onDiscussionCreated: props => (discussion, values) => {
      if (values.relateOriginatingRequest && props.queueItem.origin) {
        createRelatedItem(discussion.id, {
          type: 'Submission',
          key: props.queueItem.origin.id,
        });
      }
    },
  }),
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

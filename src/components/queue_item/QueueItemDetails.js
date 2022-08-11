import React, { useRef } from 'react';
import { compose, withState, withHandlers, withProps } from 'recompose';
import { Link } from '@reach/router';
import {
  selectDiscussionsEnabled,
  DiscussionsPanel,
  EmptyMessage,
} from '@kineticdata/bundle-common';
import { selectAssignments } from '../../redux/modules/queueApp';
import { actions } from '../../redux/modules/queue';
import { ViewOriginalRequest } from './ViewOriginalRequest';
import { AssignmentBadge } from './AssignmentBadge';
import { QueueCard } from '../queue_list/QueueListItem';
import { AssignmentSelector } from '../shared/AssignmentSelector';
import { WallyButtonContainer } from '../shared/WallyButton';
import { I18n } from '@kineticdata/react';
import { connect } from '../../redux/store';
import { List } from 'immutable';
import classNames from 'classnames';

const nonQueueLink = (queueItem, kappSlug) =>
  queueItem.parent &&
  queueItem.parent.form &&
  queueItem.parent.form.kapp &&
  queueItem.parent.form.kapp.slug !== kappSlug;

const queueLink = (queueItem, kappSlug) =>
  queueItem.parent &&
  queueItem.parent.form &&
  queueItem.parent.form.kapp &&
  queueItem.parent.form.kapp.slug === kappSlug;

export const QueueItemDetails = ({
  queueItem,
  isAssigning,
  toggleAssigning,
  setIsAssigning,
  setAssignment,
  assignments,
  openNewItemMenu,
  prohibitSubtasks,
  refreshQueueItem,
  kappSlug,
  discussionsEnabled,
  profile,
  creationFields,
  onDiscussionCreated,
  CreationForm,
  goToPreviousItem,
  goToNextItem,
  currentTab,
  toggleCurrentTab,
}) => {
  const unreadDiscussionsContainerRef = useRef(null);

  return (
    <div className="queue-item-details">
      <div className="section--general">
        <pre>{queueItem.values.Details}</pre>
        <div className="actions">
          {!isAssigning && (
            <AssignmentBadge
              queueItem={queueItem}
              toggle={
                queueItem.coreState === 'Draft' ? toggleAssigning : undefined
              }
              readOnly={queueItem.coreState !== 'Draft'}
            />
          )}
          {isAssigning && (
            <AssignmentSelector
              toggle={setIsAssigning}
              onSelect={setAssignment}
              isAssigning={isAssigning}
              assignments={assignments}
            />
          )}
          <WallyButtonContainer
            className="btn btn-primary wally-button"
            queueItem={queueItem}
            onWorked={refreshQueueItem}
            onGrabbed={refreshQueueItem}
          />
        </div>
        {nonQueueLink(queueItem, kappSlug) && (
          <ViewOriginalRequest queueItem={queueItem} />
        )}
        {queueLink(queueItem, kappSlug) && (
          <Link
            to={`../${queueItem.parent.id}`}
            className="btn btn-inverse request-button"
          >
            <I18n>View Parent</I18n>
          </Link>
        )}
      </div>

      {(!prohibitSubtasks || discussionsEnabled) && (
        <div className="mb-5">
          <ul className="nav nav-tabs" role="tablist">
            {!prohibitSubtasks && (
              <li
                role="tab"
                className="nav-item"
                id="subtasks-tab"
                aria-controls="subtasks-tabpanel"
                aria-selected={currentTab === 'subtasks'}
              >
                <button
                  onClick={toggleCurrentTab('subtasks')}
                  className={classNames('nav-link', {
                    active: currentTab === 'subtasks',
                  })}
                >
                  <I18n>Subtasks</I18n>
                </button>
              </li>
            )}
            {discussionsEnabled && (
              <li
                role="tab"
                className="nav-item"
                id="discussions-tab"
                aria-controls="discussions-tabpanel"
                aria-selected={currentTab === 'discussions'}
              >
                <button
                  onClick={toggleCurrentTab('discussions')}
                  className={classNames('nav-link', {
                    active: currentTab === 'discussions',
                  })}
                >
                  <I18n>Discussions</I18n>
                  <span ref={unreadDiscussionsContainerRef} />
                </button>
              </li>
            )}
          </ul>

          <div
            className={classNames('cards', {
              'd-none': currentTab !== 'subtasks',
            })}
            role="tabpanel"
            id="subtasks-tabpanel"
            aria-labelledby="subtasks-tab"
          >
            {queueItem.coreState === 'Draft' && (
              <div className="d-flex justify-content-end mt-n4 mb-4">
                <button
                  className="btn btn-white btn-sticky-top"
                  onClick={openNewItemMenu}
                  aria-label="Create New Subtask"
                >
                  <span className="fa fa-fw fa-plus" aria-hidden="true" />
                  <span>Create Subtask</span>
                </button>
              </div>
            )}
            {queueItem.children.length > 0 && (
              <ul className="list-group submissions">
                {queueItem.children.map(child => (
                  <QueueCard
                    key={child.id}
                    submission={child}
                    path={`../${child.id}`}
                  />
                ))}
              </ul>
            )}
            {queueItem.children.length < 1 && (
              <EmptyMessage
                title="No subtasks to display"
                message="Subtasks are an easy way to create smaller and/or related tasks to parent task."
              />
            )}
          </div>

          <div
            className={classNames({
              'd-none': currentTab !== 'discussions',
            })}
            role="tabpanel"
            id="discussions-tabpanel"
            aria-labelledby="discussions-tab"
          >
            <DiscussionsPanel
              withAside={true}
              itemType="Submission"
              itemKey={queueItem.id}
              overrideClassName="discussions-container"
              me={profile}
              pageSize={3}
              unreadDiscussionsContainerRef={unreadDiscussionsContainerRef}
              creationFields={creationFields}
              onCreated={onDiscussionCreated}
              CreationForm={CreationForm}
              renderDiscussionsListHeader={({ handleCreateDiscussionClick }) =>
                handleCreateDiscussionClick ? (
                  <div className="d-flex justify-content-end mt-n4 mb-2">
                    <button
                      className="btn btn-white btn-sticky-top"
                      onClick={handleCreateDiscussionClick}
                    >
                      <span className="fa fa-fw fa-plus" />
                      <span>
                        <I18n>Create Discussion</I18n>
                      </span>
                    </button>
                  </div>
                ) : null
              }
            />
          </div>
        </div>
      )}
    </div>
  );
};

const getAttr = (form, attrName) => {
  const attrConfig =
    form.attributes &&
    form.attributes.find(attribute => attribute.name === attrName);
  return attrConfig && attrConfig.values[0];
};

export const mapStateToProps = (state, props) => {
  const queueItem = state.queue.currentItem;
  return {
    filter: props.filter,
    queueItem,
    assignments: selectAssignments(
      state.queueApp.allTeams,
      queueItem.form,
      queueItem,
    ).toJS(),
    defaultFilters: state.queueApp.filters,
    kappSlug: state.app.kappSlug,
    discussionsEnabled: selectDiscussionsEnabled(state),
    profile: state.app.profile,
    currentPageData: state.queue.data,
    hasPreviousPage: state.queue.hasPreviousPage,
    hasNextPage: state.queue.hasNextPage,
  };
};

export const mapDispatchToProps = {
  updateQueueItem: actions.updateQueueItem,
  setCurrentItem: actions.setCurrentItem,
  openNewItemMenu: actions.openNewItemMenu,
  fetchCurrentItem: actions.fetchCurrentItem,
  setOffset: actions.setOffset,
  fetchList: actions.fetchListRequest,
  fetchListCount: actions.fetchListCountRequest,
  fetchNextPage: actions.fetchListNext,
  fetchPreviousPage: actions.fetchListPrevious,
};

export const QueueItemDetailsContainer = compose(
  connect(
    mapStateToProps,
    mapDispatchToProps,
  ),
  withProps(({ queueItem }) => {
    const prohibit = getAttr(queueItem.form, 'Prohibit Subtasks');
    const permitted = getAttr(queueItem.form, 'Permitted Subtasks');
    return {
      prohibitSubtasks: ['True', 'Yes'].includes(prohibit),
      permittedSubtasks: permitted && permitted.split(/\s*,\s*/),
    };
  }),
  withState(
    'currentTab',
    'setCurrentTab',
    props => (!props.prohibitSubtasks ? 'subtasks' : 'discussions'),
  ),
  withState('isAssigning', 'setIsAssigning', false),
  withHandlers({
    refetchCounts: ({ defaultFilters, fetchListCount, filter }) => () => {
      defaultFilters
        .filter(filter => ['Mine', 'Unassigned'].includes(filter.name))
        // Refetch current filters count if it isn't the Mine or Unassigned defaults
        .concat(
          !filter ||
          (filter.type === 'default' &&
            ['Mine', 'Unassigned'].includes(filter.name))
            ? []
            : [filter],
        )
        .forEach(fetchListCount);
    },
    toggleCurrentTab: props => tab => e => props.setCurrentTab(tab),
  }),
  withHandlers({
    toggleAssigning: ({ setIsAssigning, isAssigning }) => () =>
      setIsAssigning(!isAssigning),
    setAssignment: ({
      queueItem,
      updateQueueItem,
      setCurrentItem,
      refetchCounts,
    }) => (_v, assignment) => {
      const teamParts = assignment.team.split('::');
      const values = {
        'Assigned Individual': assignment.username,
        'Assigned Individual Display Name': assignment.displayName,
        'Assigned Team': assignment.team,
        'Assigned Team Display Name': teamParts[teamParts.length - 1],
      };

      updateQueueItem({
        id: queueItem.id,
        values,
        onSuccess: submission => {
          setCurrentItem(submission);
          refetchCounts();
        },
      });
    },
    openNewItemMenu: ({
      openNewItemMenu,
      queueItem,
      permittedSubtasks,
    }) => () => {
      openNewItemMenu({
        permittedSubtasks,
        parentId: queueItem.id,
        originId: queueItem.origin ? queueItem.origin.id : queueItem.id,
      });
    },
    refreshQueueItem: ({
      filter,
      fetchList,
      fetchCurrentItem,
      queueItem,
      refetchCounts,
    }) => () => {
      fetchCurrentItem(queueItem.id);
      refetchCounts();
    },
  }),
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
)(QueueItemDetails);

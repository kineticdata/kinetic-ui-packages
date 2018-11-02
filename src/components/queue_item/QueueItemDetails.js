import React from 'react';
import { connect } from 'react-redux';
import { compose, withState, withHandlers, withProps } from 'recompose';
import { KappLink as Link, TimeAgo } from 'common';
import { selectDiscussionsEnabled } from 'common/src/redux/modules/common';
import {
  actions as discussionActions,
  ViewDiscussionsModal,
} from 'discussions';
import { selectAssignments } from '../../redux/modules/queueApp';
import { actions, selectPrevAndNext } from '../../redux/modules/queue';
import { ViewOriginalRequest } from './ViewOriginalRequest';
import { AssignmentBadge } from './AssignmentBadge';
import { QueueListItemSmall } from '../queue_list/QueueListItem';
import { AssignmentSelector } from '../shared/AssignmentSelector';
import { StatusParagraph } from '../shared/StatusParagraph';
import { WallyButtonContainer } from '../shared/WallyButton';

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
  viewDiscussionsModal,
  prohibitSubtasks,
  refreshQueueItem,
  openDiscussions,
  openDiscussion,
  createDiscussion,
  closeDiscussions,
  relatedDiscussions,
  prevAndNext,
  kappSlug,
  discussionsEnabled,
  profile,
  isSmallLayout,
}) => (
  <div className="queue-item-details">
    {viewDiscussionsModal &&
      isSmallLayout && (
        <ViewDiscussionsModal
          handleCreateDiscussion={createDiscussion}
          handleDiscussionClick={openDiscussion}
          close={closeDiscussions}
          discussions={relatedDiscussions}
          me={profile}
        />
      )}
    <div className="scroll-wrapper">
      <div className="general">
        {discussionsEnabled && (
          <button
            onClick={openDiscussions}
            className="btn btn-inverse btn-discussion d-md-none d-lg-none d-xl-none"
          >
            <span
              className="fa fa-fw fa-comments"
              style={{ fontSize: '16px' }}
            />
            View Discussions
          </button>
        )}
        <StatusParagraph queueItem={queueItem} prevAndNext={prevAndNext} />
        <h1>
          {queueItem.form.name} ({queueItem.handle})
        </h1>
        <p className="summary">{queueItem.values.Summary}</p>
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
            to={`/item/${queueItem.parent.id}`}
            className="btn btn-primary btn-inverse request-button"
          >
            View Parent
          </Link>
        )}
        <ul className="list-group timestamps">
          <li className="list-group-item timestamp">
            <span className="label">Due</span>
            <span className="value">
              <TimeAgo timestamp={queueItem.values['Due Date']} id="due-date" />
            </span>
          </li>
          <li className="list-group-item timestamp">
            <span className="label">Updated</span>
            <span className="value">
              <TimeAgo timestamp={queueItem.updatedAt} id="updated-at" />
            </span>
          </li>
          <li className="list-group-item timestamp">
            <span className="label">Created</span>
            <span className="value">
              <TimeAgo timestamp={queueItem.createdAt} id="created-at" />
            </span>
          </li>
        </ul>
      </div>

      {!prohibitSubtasks && (
        <div className="subtasks-section">
          <h2 className="section__title">
            Subtasks
            {queueItem.coreState === 'Draft' && (
              <button className="btn btn-link" onClick={openNewItemMenu}>
                <span className="fa fa-plus" />
              </button>
            )}
          </h2>
          {queueItem.children.length > 0 && (
            <ul className="list-group submissions">
              {queueItem.children.map(child => (
                <QueueListItemSmall key={child.id} queueItem={child} />
              ))}
            </ul>
          )}
          {queueItem.children.length < 1 && (
            <div className="empty-subtasks">
              <h5>No Subtasks to display</h5>
              <h6>
                Subtasks are an easy way to create smaller and/or related tasks
                to parent task.
              </h6>
            </div>
          )}
        </div>
      )}
    </div>
  </div>
);

const getAttr = (form, attrName) => {
  const attrConfig =
    form.attributes &&
    form.attributes.find(attribute => attribute.name === attrName);
  return attrConfig && attrConfig.values[0];
};

export const mapStateToProps = (state, props) => ({
  filter: props.filter,
  queueItem: state.queue.queue.currentItem,
  relatedDiscussions: state.queue.queue.relatedDiscussions,
  assignments: selectAssignments(state).toJS(),
  prevAndNext: selectPrevAndNext(state, props.filter),
  kappSlug: state.app.config.kappSlug,
  discussionsEnabled: selectDiscussionsEnabled(state),
  profile: state.app.profile,
  isSmallLayout: state.app.layout.get('size') === 'small',
});

export const mapDispatchToProps = {
  updateQueueItem: actions.updateQueueItem,
  setCurrentItem: actions.setCurrentItem,
  openNewItemMenu: actions.openNewItemMenu,
  fetchCurrentItem: actions.fetchCurrentItem,
  openModal: discussionActions.openModal,
  createDiscussion: discussionActions.createIssue,
  setCurrentDiscussion: actions.setCurrentDiscussion,
  setOffset: actions.setOffset,
  fetchList: actions.fetchList,
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
  withState('isAssigning', 'setIsAssigning', false),
  withState('viewDiscussionsModal', 'setViewDiscussionsModal', false),
  withHandlers({
    toggleAssigning: ({ setIsAssigning, isAssigning }) => () =>
      setIsAssigning(!isAssigning),
    setAssignment: ({ queueItem, updateQueueItem, setCurrentItem }) => (
      _v,
      assignment,
    ) => {
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
        onSuccess: setCurrentItem,
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
      setOffset,
      fetchCurrentItem,
      queueItem,
    }) => () => {
      if (filter && filter !== null) {
        fetchList(filter);
        setOffset(0);
      }
      fetchCurrentItem(queueItem.id);
    },
    openDiscussion: props => discussion => () => {
      // Close the discussion list modal and open the discussion modal.
      props.setViewDiscussionsModal(false);
      props.setCurrentDiscussion(discussion);
      props.openModal(discussion.id, 'discussion');
    },
    openDiscussions: props => () => props.setViewDiscussionsModal(true),
    closeDiscussions: props => () => props.setViewDiscussionsModal(false),
    createDiscussion: props => () =>
      props.createDiscussion(
        props.queueItem.label || 'Queue Discussion',
        props.queueItem.values['Details'] || '',
        props.queueItem,
        null,
        (issue, submission) => {
          props.setCurrentItem(submission);
          props.openModal(issue.guid, 'discussion');
        },
      ),
  }),
)(QueueItemDetails);
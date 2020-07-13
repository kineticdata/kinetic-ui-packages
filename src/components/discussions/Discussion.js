import React from 'react';
import t from 'prop-types';
import { is } from 'immutable';
import { MessagesList } from './MessagesList';
import { ScrollHelper } from './ScrollHelper';
import { ChatInputForm } from './ChatInputForm';
import { MoreMessagesBanner } from './MoreMessagesBanner';
import canManage from '../../helpers/discussions/canManage';
import {
  JOIN_DISCUSSION,
  LEAVE_DISCUSSION,
  FETCH_MORE_MESSAGES,
} from './redux';
import './sagas';
import { connect, dispatch } from '../../store';
import { SOCKET_STATUS } from '../../apis/socket/socket';

export class DiscussionComponent extends React.Component {
  static displayName = 'Discussion';

  constructor(props) {
    super(props);
    this.state = {
      scrolledToBottom: true,
      hasUnreadMessages: false,
      editingMessage: null,
      replyingToMessage: null,
    };
  }

  componentDidMount() {
    dispatch(JOIN_DISCUSSION, {
      id: this.props.id,
      invitationToken: this.props.invitationToken,
    });
  }

  componentDidUpdate(prevProps) {
    if (this.props.id !== prevProps.id) {
      dispatch(LEAVE_DISCUSSION, this.props.id);
      dispatch(JOIN_DISCUSSION, {
        id: this.props.id,
        invitationToken: this.props.invitationToken,
      });
    }

    const messages = this.props.discussion && this.props.discussion.messages;
    const prevMessages = prevProps.discussion && prevProps.discussion.messages;

    if (!is(messages, prevMessages)) {
      if (
        !this.state.scrolledToBottom &&
        messages
          // get the messages that are newer than the messages we previously
          // had, we do not care about older messages being loaded above only
          // new messages below
          .slice(0, messages.indexOf(prevMessages.first()))
          // if any of the new messages were not sent by the current user we
          // consider them to be unread
          .some(message => message.createdBy.email !== this.props.profile.email)
      ) {
        this.setState({ hasUnreadMessages: true });
      }
    }
  }

  componentWillUnmount() {
    dispatch(LEAVE_DISCUSSION, this.props.id);
  }

  handleScrollTo = event => {
    this.setState({ scrolledToBottom: event === 'bottom' });
    if (event === 'bottom') {
      this.setState({ hasUnreadMessages: false });
    }
    if (event === 'top' && this.props.hasMoreMessages) {
      dispatch(FETCH_MORE_MESSAGES, this.props.id);
    }
  };

  editMessage = message => {
    this.setState({ editingMessage: message, replyingToMessage: null });
    if (message) this.chatInput.editMessage(message);
  };

  replyToMessage = message => {
    this.setState({ editingMessage: null, replyingToMessage: message });
    if (message) this.chatInput.focus();
  };

  buildMessageActions = () => ({
    editing: this.state.editingMessage,
    replying: this.state.replyingToMessage,
    edit: this.editMessage,
    reply: this.replyToMessage,
    history: this.props.toggleMessageHistory,
  });

  render() {
    const { DiscussionError } = this.props.components;
    if (
      this.props.socketStatus !== SOCKET_STATUS.RECONNECTING &&
      this.props.socketStatus !== SOCKET_STATUS.IDENTIFIED
    ) {
      return (
        <DiscussionError error="Real-time connection to this server has been interrupted. Please refresh and try again" />
      );
    } else if (this.props.error) {
      return <DiscussionError error={this.props.error} />;
    } else if (this.props.discussion && !this.props.loading) {
      const messageActions = this.buildMessageActions();
      return this.props.render({
        error: this.props.error,
        discussion: this.props.discussion,
        canManage: canManage(this.props.discussion, this.props.profile),
        elements: {
          messages: (
            <ScrollHelper
              onScrollTo={this.handleScrollTo}
              ref={el => (this.scrollHelper = el)}
            >
              <MoreMessagesBanner
                hasMore={this.props.hasMoreMessages}
                loading={this.props.loadingMoreMessages}
              />
              <MessagesList
                discussion={this.props.discussion}
                profile={this.props.profile}
                messages={this.props.discussion.messages.reverse()}
                actions={messageActions}
              />
            </ScrollHelper>
          ),
          chatInput: (
            <ChatInputForm
              discussion={this.props.discussion}
              messageActions={messageActions}
              registerChatInput={el => (this.chatInput = el)}
              toggleInvitationForm={this.props.toggleInvitationForm}
            />
          ),
          viewUnreadButton: this.state.hasUnreadMessages ? (
            <button
              type="button"
              className="btn btn-primary btn--banner"
              onClick={this.scrollHelper && this.scrollHelper.scrollToBottom}
            >
              New messages
              <i className="fa fa-fw fa-arrow-down" aria-hidden="true" />
            </button>
          ) : null,
        },
      });
    }

    return this.props.loader ? this.props.loader() : null;
  }
}

const ConnectedDiscussionComponent = connect((state, props) => {
  const path = ['discussions', props.id];
  return {
    socketStatus: state.get('socketStatus'),
    discussion: state.getIn(path),
    loading: state.getIn([...path, 'loading']),
    error: state.getIn([...path, 'error']),
    hasMoreMessages: state.getIn([...path, 'nextPageToken']) !== null,
    loadingMoreMessaes: state.getIn([...path, 'loadingMoreMessages']),
  };
})(DiscussionComponent);

export const Discussion = props => <ConnectedDiscussionComponent {...props} />;

export default Discussion;
Discussion.propTypes = {
  render: t.func.isRequired,
};

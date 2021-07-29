import {
  compose,
  lifecycle,
  withState,
  withHandlers,
  withProps,
} from 'recompose';
import {
  openModalForm,
  selectAdminKappSlug,
  selectDiscussionsEnabled,
  Utils,
} from '@kineticdata/bundle-common';
import { actions } from '../../redux/modules/submission';
import { connect } from '../../redux/store';
import * as constants from '../../constants';
import { getFeedbackFormConfig } from '../../utils';
import { RequestShow } from './RequestShow';

export const mapStateToProps = (state, props) => ({
  submission: state.submission.data,
  error: state.submission.error,
  listType: props.type,
  mode: props.mode,
  discussion: state.submission.discussion,
  sendMessageModalOpen: state.submission.isSendMessageModalOpen,
  kappSlug: state.app.kappSlug,
  appLocation: state.app.location,
  discussionsEnabled: selectDiscussionsEnabled(state),
  me: state.app.profile,
  isSmallLayout: state.app.layoutSize === 'small',
  adminKappSlug: selectAdminKappSlug(state),
});

export const mapDispatchToProps = {
  clearSubmission: actions.clearSubmissionRequest,
  fetchSubmission: actions.fetchSubmissionRequest,
  cloneSubmission: actions.cloneSubmissionRequest,
  deleteSubmission: actions.deleteSubmissionRequest,
  startPoller: actions.startSubmissionPoller,
  stopPoller: actions.stopSubmissionPoller,
  fetchDiscussion: actions.fetchDiscussionRequest,
  setSendMessageModalOpen: actions.setSendMessageModalOpen,
};

const enhance = compose(
  connect(
    mapStateToProps,
    mapDispatchToProps,
  ),
  withState('viewDiscussion', 'setViewDiscussion', false),
  lifecycle({
    componentWillMount() {
      this.props.fetchSubmission(this.props.submissionId);
      this.props.fetchDiscussion(this.props.submissionId);
      this.props.startPoller(this.props.submissionId);
    },
    componentWillUnmount() {
      this.props.clearSubmission();
      this.props.stopPoller();
    },
  }),
  withProps(props => {
    return {
      disableStartDiscussion:
        !props.discussionsEnabled ||
        !props.submission ||
        props.submission.coreState !== constants.CORE_STATE_SUBMITTED ||
        Utils.hasAttributeValue(
          props.submission.form,
          'Comment Disabled',
          ['true', 'yes'],
          true,
          false,
        ),
      disableProvideFeedback:
        !props.submission ||
        props.submission.coreState !== constants.CORE_STATE_CLOSED,
      disableHandleClone:
        !props.submission ||
        Utils.hasAttributeValue(
          props.submission.form,
          'Cloning Disabled',
          ['true', 'yes'],
          true,
          false,
        ),
      disableHandleCancel:
        !props.submission ||
        props.submission.coreState === constants.CORE_STATE_CLOSED ||
        Utils.hasAttributeValue(
          props.submission.form,
          'Cancel Disabled',
          ['true', 'yes'],
          true,
          false,
        ),
    };
  }),
  withHandlers({
    toggleDiscussion: props => () =>
      props.setViewDiscussion(!props.viewDiscussion),
    startDiscussion: props => () =>
      props.setSendMessageModalOpen({ isOpen: true, type: 'comment' }),
    provideFeedback: props => () =>
      openModalForm(
        getFeedbackFormConfig(props.adminKappSlug, props.submission.id),
      ),
    handleClone: props => () =>
      props.cloneSubmission({
        id: props.submission.id,
        success: clonedSubmission =>
          props.navigate(
            `${props.appLocation}/requests/Draft/request/${
              clonedSubmission.id
            }`,
          ),
      }),
    handleCancel: props => () => {
      if (props.submission.coreState === constants.CORE_STATE_DRAFT) {
        props.deleteSubmission({
          id: props.submission.id,
          callback: props.deleteCallback,
        });
      } else {
        props.setSendMessageModalOpen({ isOpen: true, type: 'cancel' });
      }
    },
  }),
);

export const RequestShowContainer = enhance(RequestShow);

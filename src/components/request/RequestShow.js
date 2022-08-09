import React from 'react';
import { Link } from '@reach/router';
import {
  TimeAgo,
  Utils,
  ErrorMessage,
  LoadingMessage,
} from '@kineticdata/bundle-common';
import { bundle } from '@kineticdata/react';
import { RequestShowConfirmationContainer } from './RequestShowConfirmation';
import { RequestActivityList } from './RequestActivityList';
import { SendMessageModal } from './SendMessageModal';
import * as constants from '../../constants';
import {
  getDueDate,
  getDurationInDays,
  getStatus,
  getSubmissionPath,
  isActiveClass,
} from '../../utils';
import { PageTitle } from '../shared/PageTitle';
import { CoreForm, I18n } from '@kineticdata/react';

const ProfileLink = ({ submitter }) => (
  <Link to={`/profile/${encodeURIComponent(submitter)}`}>
    {submitter === bundle.identity() ? <I18n>you</I18n> : submitter}
  </Link>
);

const displayDateMeta = submission => ({
  label: submission.submittedAt ? 'Submitted' : 'Created',
  value: (
    <>
      <TimeAgo
        timestamp={
          submission.submittedAt ? submission.submittedAt : submission.createdAt
        }
      />
      {` `}
      <small>
        <I18n>by</I18n>
      </small>
      {` `}
      <ProfileLink
        submitter={
          submission.submittedAt ? submission.submittedBy : submission.createdBy
        }
      />
    </>
  ),
});

const serviceOwnerMeta = submission => {
  const serviceOwner = Utils.getConfig({
    submission,
    name: constants.ATTRIBUTE_SERVICE_OWNING_TEAM,
  });
  return (
    !!serviceOwner && {
      label: 'Service Owning Team',
      value: (
        <>
          {serviceOwner} <I18n>Team</I18n>
        </>
      ),
    }
  );
};

const estCompletionMeta = submission => {
  const dueDate = getDueDate(submission, constants.ATTRIBUTE_SERVICE_DAYS_DUE);
  return (
    submission.coreState === constants.CORE_STATE_SUBMITTED &&
    !!dueDate && {
      label: 'Est. Completion',
      value: <TimeAgo timestamp={dueDate} />,
    }
  );
};

const completedInMeta = submission => {
  const duration =
    submission.coreState === constants.CORE_STATE_CLOSED &&
    getDurationInDays(submission.createdAt, submission.closedAt);
  return (
    (duration || duration === 0) && {
      label: 'Completed in',
      value: (
        <>
          {duration} {duration === 1 ? <I18n>day</I18n> : <I18n>days</I18n>}
        </>
      ),
    }
  );
};

export const RequestShow = ({
  navigate,
  submission,
  error,
  listType,
  mode,
  sendMessageModalOpen,
  disableProvideFeedback,
  provideFeedback,
  disableHandleClone,
  handleClone,
  disableHandleCancel,
  handleCancel,
  kappSlug,
  me,
  appLocation,
  isSmallLayout,
}) => (
  <div className="page-container">
    <div className="page-panel">
      {sendMessageModalOpen && <SendMessageModal submission={submission} />}
      <PageTitle
        parts={[submission && submission.label, 'Requests']}
        breadcrumbs={[
          { label: 'Home', to: '/' },
          {
            label: 'My Requests',
            to: `${appLocation}/requests`,
          },
          listType && {
            label: listType,
            to: `${appLocation}/requests/${listType}`,
          },
        ]}
        title={!error && submission && submission.form.name}
        subtitle={
          !error && submission && submission.form.name !== submission.label
            ? submission.label
            : null
        }
        actions={
          !error &&
          submission && [
            !disableHandleCancel && {
              label: 'Cancel Request',
              onClick: handleCancel,
              menu: true,
            },
            !disableHandleClone && {
              label: 'Clone as Draft',
              onClick: handleClone,
              menu: true,
            },
            !disableProvideFeedback && {
              label: 'Provide Feedback',
              onClick: provideFeedback,
              menu: true,
            },
          ]
        }
        meta={
          !error &&
          submission && [
            { label: 'Status', value: getStatus(submission) },
            { label: 'Confirmation #', value: submission.handle },
            displayDateMeta(submission),
            serviceOwnerMeta(submission),
            estCompletionMeta(submission),
            completedInMeta(submission),
          ]
        }
      />

      {error && (
        <ErrorMessage
          title="Failed to load submission"
          message={error.message}
        />
      )}
      {!error && !submission && <LoadingMessage />}
      {!error &&
        submission && (
          <>
            {mode === 'confirmation' && (
              <div className="alert alert-primary alert-bar">
                <RequestShowConfirmationContainer submission={submission} />
              </div>
            )}

            <div className="submission-tabs p-0">
              <ul className="nav nav-tabs" role="tablist">
                <li role="tab" className="nav-item">
                  <Link
                    to={getSubmissionPath(
                      appLocation,
                      submission,
                      null,
                      listType,
                    )}
                    getProps={isActiveClass('nav-link')}
                  >
                    <I18n>Timeline</I18n>
                  </Link>
                </li>

                <li role="tab" className="nav-item">
                  <Link
                    to={`${getSubmissionPath(
                      appLocation,
                      submission,
                      'review',
                      listType,
                    )}`}
                    getProps={isActiveClass('nav-link')}
                  >
                    <I18n>Review Request</I18n>
                  </Link>
                </li>
              </ul>
              <div className="submission-tabs__content">
                {mode === 'review' ? (
                  <I18n
                    context={`kapps.${kappSlug}.forms.${submission.form.slug}`}
                  >
                    <CoreForm submission={submission.id} review />
                  </I18n>
                ) : (
                  <RequestActivityList submission={submission} />
                )}
              </div>
            </div>
          </>
        )}
    </div>
  </div>
);

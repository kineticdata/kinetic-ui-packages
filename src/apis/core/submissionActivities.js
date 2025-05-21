import { apiGroup } from '../http';

export const {
  fetchSubmissionActivities,
  fetchSubmissionActivity,
  createSubmissionActivity,
  updateSubmissionActivity,
  deleteSubmissionActivity,
} = apiGroup({
  name: 'SubmissionActivity',
  pluralName: 'SubmissionActivities',
  dataOption: 'activity',
  plural: {
    requiredOptions: ['submissionId'],
    url: ({ submissionId }) => `/submissions/${submissionId}/activities`,
    transform: response => response.data,
  },
  singular: {
    requiredOptions: ['submissionId', 'activityId'],
    url: ({ submissionId, activityId }) =>
      `/submissions/${submissionId}/activities/${activityId}`,
    transform: response => response.data,
  },
});

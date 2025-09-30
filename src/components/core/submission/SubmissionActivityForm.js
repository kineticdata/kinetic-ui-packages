import {
  fetchSubmissionActivity,
  updateSubmissionActivity,
  createSubmissionActivity,
} from '../../../apis';
import { generateForm } from '../../form/Form';
import { get } from 'immutable';

const dataSources = ({ submissionId, activityId }) => ({
  activity: {
    fn: fetchSubmissionActivity,
    params: submissionId &&
      activityId && [{ submissionId, activityId, include: 'details' }],
    transform: result => result.activity,
  },
});

const handleSubmit =
  ({ submissionId, activityId }) =>
  values =>
    (activityId ? updateSubmissionActivity : createSubmissionActivity)({
      submissionId,
      activityId,
      activity: values.toJS(),
    }).then(({ kapp, error }) => {
      if (error) {
        throw (
          (error.statusCode === 400 && error.message) ||
          'There was an error saving the activity'
        );
      }
      return kapp;
    });

const fields =
  ({ submissionId, activityId }) =>
  ({ activity }) =>
    submissionId &&
    (!activityId || activity) && [
      {
        name: 'type',
        label: 'Type',
        type: 'text',
        initialValue: get(activity, 'type'),
      },
      {
        name: 'label',
        label: 'Label',
        type: 'text',
        initialValue: get(activity, 'label'),
      },
      {
        name: 'description',
        label: 'Description',
        type: 'text',
        initialValue: get(activity, 'description'),
      },
      {
        name: 'data',
        label: 'Data',
        type: 'text',
        initialValue: get(activity, 'data'),
      },
    ];

export const SubmissionActivityForm = generateForm({
  formOptions: ['submissionId', 'activityId'],
  dataSources,
  fields,
  handleSubmit,
});

SubmissionActivityForm.displayName = 'SubmissionActivityForm';

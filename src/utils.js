import { Utils } from '@kineticdata/bundle-common';
import * as constants from './constants';

export const getSubmissionPath = (appLocation, submission, mode) => {
  return [appLocation, submission.form.slug, 'submissions', submission.id]
    .filter(s => !!s)
    .join('/');
};

export const getStatus = submission => {
  if (!submission.values) {
    throw new Error(
      'getStatus failed because values were not included on ' +
        'the submission.',
    );
  }
  return submission.values[constants.STATUS_FIELD] || submission.coreState;
};

export const getStatusClass = ({ values, form, coreState }) => {
  if (
    !values ||
    !form ||
    !form.attributes ||
    !form.kapp ||
    !form.kapp.attributes
  ) {
    throw new Error(
      'getStatusClass failed because the submission did not ' +
        'have the required includes (values,form.attributes,form.kapp.attributes)',
    );
  }
  const statusFieldValue = values[constants.STATUS_FIELD];
  if (statusFieldValue) {
    const activeStatuses = Utils.getAttributeValues(
      form,
      constants.STATUSES_ACTIVE,
      Utils.getAttributeValues(form.kapp, constants.STATUSES_ACTIVE, []),
    );
    const inactiveStatuses = Utils.getAttributeValues(
      form,
      constants.STATUSES_INACTIVE,
      Utils.getAttributeValues(form.kapp, constants.STATUSES_INACTIVE, []),
    );
    const cancelledStatuses = Utils.getAttributeValues(
      form,
      constants.STATUSES_CANCELLED,
      Utils.getAttributeValues(form.kapp, constants.STATUSES_CANCELLED, []),
    );
    if (activeStatuses.includes(statusFieldValue)) {
      return constants.SUCCESS_LABEL_CLASS;
    } else if (inactiveStatuses.includes(statusFieldValue)) {
      return constants.WARNING_LABEL_CLASS;
    } else if (cancelledStatuses.includes(statusFieldValue)) {
      return constants.DANGER_LABEL_CLASS;
    } else {
      return constants.DEFAULT_LABEL_CLASS;
    }
  } else {
    switch (coreState) {
      case constants.CORE_STATE_DRAFT:
        return constants.WARNING_LABEL_CLASS;
      case constants.CORE_STATE_SUBMITTED:
        return constants.SUCCESS_LABEL_CLASS;
      default:
        return constants.DEFAULT_LABEL_CLASS;
    }
  }
};

export const getStatusColor = props => {
  switch (getStatusClass(props)) {
    case constants.SUCCESS_LABEL_CLASS:
      return 'success';
    case constants.WARNING_LABEL_CLASS:
      return 'warning';
    case constants.DANGER_LABEL_CLASS:
      return 'danger';
    default:
      return 'dark';
  }
};

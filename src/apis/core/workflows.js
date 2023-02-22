import { apiGroup, handleErrors, headerBuilder, paramBuilder } from '../http';
import axios from 'axios';
import { bundle } from '../../helpers';

export const {
  fetchWorkflows,
  fetchWorkflow,
  createWorkflow,
  updateWorkflow,
  deleteWorkflow,
} = apiGroup({
  name: 'Workflow',
  dataOption: 'workflow',
  plural: {
    requiredOptions: [],
    url: ({ kappSlug, formSlug }) =>
      formSlug
        ? `/kapps/${kappSlug}/forms/${formSlug}/workflows`
        : kappSlug
          ? `/kapps/${kappSlug}/workflows`
          : `/workflows`,
    transform: response => response.data,
  },
  singular: {
    requiredOptions: ['workflowId'],
    url: ({ workflowId, kappSlug, formSlug }) =>
      formSlug
        ? `/kapps/${kappSlug}/forms/${formSlug}/workflows/${workflowId}`
        : kappSlug
          ? `/kapps/${kappSlug}/workflows/${workflowId}`
          : `/workflows/${workflowId}`,
    transform: response => ({
      workflow: response.data,
    }),
  },
});

const repairPath = ({ kappSlug, formSlug }) =>
  kappSlug && formSlug
    ? `${bundle.apiLocation()}/kapps/${kappSlug}/forms/${formSlug}/workflows/repair`
    : kappSlug
      ? `${bundle.apiLocation()}/kapps/${kappSlug}/workflows/repair`
      : `${bundle.apiLocation()}/workflows/repair`;

export const repairWorkflows = (options = {}) => {
  return axios
    .post(repairPath(options), {
      params: paramBuilder(options),
      headers: headerBuilder(options),
    })
    .then(response => response.data)
    .catch(handleErrors);
};

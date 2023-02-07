import React from 'react';
import { List, getIn } from 'immutable';
import {
  createSubmission,
  fetchForm,
  fetchSubmission,
  updateSubmission,
} from '../../../apis';
import { generateForm } from '../../form/Form';
import moment from 'moment';

const dataSources = ({ kappSlug, formSlug, submissionId }) => ({
  submission: {
    fn: fetchSubmission,
    params: submissionId && [
      {
        id: submissionId,
        include:
          'details,values,form,form.fields,form.fields.details,form.pages',
      },
    ],
    transform: result => result.submission,
  },
  form: {
    fn: fetchForm,
    params: kappSlug &&
      formSlug && [
        {
          kappSlug,
          formSlug,
          include: 'pages',
        },
      ],
    transform: result => result.form,
  },
  pages: {
    fn: form => form.get('pages'),
    params: ({ form, submission }) =>
      submission ? [submission.get('form')] : form ? [form] : null,
  },
});

const handleSubmit = ({ kappSlug, formSlug, submissionId: id }) => values =>
  (id
    ? updateSubmission({ id, values: values.toJS() })
    : createSubmission({ kappSlug, formSlug, values: values.toJS() })
  ).then(({ submission, error }) => {
    if (error) {
      throw (error.statusCode === 400 && error.message) ||
        'There was an error saving the submission';
    }
    return submission;
  });

const traverseElement = (traverse, iteratee, acc) => {
  const element = traverse.get(0);
  const elements = traverse.shift();
  const childElements = element.get('elements', List());
  let result = iteratee(element, acc);
  // If the current element has child elements make a recursive call.
  if (childElements.size > 0) {
    result = traverseElement(childElements, iteratee, result);
  }
  if (elements.size > 0) {
    return traverseElement(elements, iteratee, result);
  }
  return result;
};

const convertRenderType = element => {
  if (element.get('renderType') === 'dropdown') {
    return element.get('choicesResourceName') ? 'text' : 'select';
  } else if (element.get('renderType') === 'checkbox') {
    return 'text-multi';
  } else if (element.get('renderType') === 'attachment') {
    if (element.get('allowMultiple')) {
      return 'file-multi';
    } else {
      return 'file';
    }
  }
  return element.get('renderType');
};

const getInitialValue = (submission, element, type) => {
  const name = element.get('name');

  const value =
    getIn(
      submission,
      ['values', name],
      ['checkbox', 'attachment'].includes(element.get('renderType'))
        ? List()
        : '',
    ) || '';

  return type === 'datetime' && value
    ? moment(value).format('yyyy-MM-DDThh:mm')
    : type === 'date' && value
      ? moment(value).format('yyyy-MM-DD')
      : value;
};

const serializer = (element, type) => ({ values }) => {
  const name = element.get('name');

  return type === 'datetime' && values.get(name)
    ? moment(values.get(name)).format()
    : values.get(name);
};

// If the element uses bridged options then the `choices` value represents the
// label/value mapping from and not actual choices.
const getChoices = element =>
  !!element.get('choicesResourceName') ? List() : element.get('choices');

const fields = () => ({ form, pages, submission }) => {
  if (pages) {
    const values = traverseElement(
      pages,
      (element, values) => {
        const name = element.get('name');
        const type = convertRenderType(element);
        const initialValue = getInitialValue(submission || {}, element, type);

        return element.get('type') === 'field'
          ? values.push({
              name,
              label: name,
              type,
              options: getChoices(element, initialValue),
              initialValue,
              transient: element.get('renderType') === 'attachment',
              serialize: serializer(element, type),
            })
          : values;
      },
      List(),
    );
    return values.toJS();
  }
};

export const SubmissionForm = generateForm({
  formOptions: ['kappSlug', 'formSlug', 'submissionId'],
  dataSources,
  fields,
  handleSubmit,
});

SubmissionForm.displayName = 'SubmissionForm';

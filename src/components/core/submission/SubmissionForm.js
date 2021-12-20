import { List, getIn } from 'immutable';
import { fetchSubmission, updateSubmission } from '../../../apis';
import { generateForm } from '../../form/Form';
import moment from 'moment';

const dataSources = ({ submissionId }) => ({
  submission: {
    fn: fetchSubmission,
    params: [
      {
        id: submissionId,
        include:
          'details,values,form,form.fields,form.fields.details,form.pages',
      },
    ],
    transform: result => result.submission,
  },
});

const handleSubmit = ({ submissionId: id }) => values =>
  updateSubmission({ id, values: values.toJS() }).then(
    ({ submission, error }) => {
      if (error) {
        throw (error.statusCode === 400 && error.message) ||
          'There was an error saving the submission';
      }
      return submission;
    },
  );

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
    return element.get('choicesResourceName') ? 'text' : 'checkbox-multi';
  } else if (element.get('renderType') === 'attachment') {
    return 'text';
  }
  return element.get('renderType');
};

const getInitialValue = (submission, element, type) => {
  const name = element.get('name');
  const isBridged = !!element.get('choicesResourceName');
  const isAttachment = element.get('renderType') === 'attachment';

  const value =
    getIn(
      submission,
      ['values', name],
      element.get('renderType') === 'checkbox' ? List() : '',
    ) || '';

  return isBridged || isAttachment
    ? JSON.stringify(List.isList(value) ? value.toJS() : value)
    : type === 'datetime'
      ? moment(value).format('yyyy-MM-DDThh:mm')
      : type === 'date'
        ? moment(value).format('yyyy-MM-DD')
        : value;
};

const serializer = (element, type) => ({ values }) => {
  const name = element.get('name');
  const isBridged = !!element.get('choicesResourceName');

  return isBridged
    ? JSON.parse(values.get(name))
    : type === 'datetime'
      ? moment(values.get(name)).format()
      : values.get(name);
};

const fields = () => ({ submission }) => {
  if (submission) {
    const pages = submission.getIn(['form', 'pages'], List());

    const values = traverseElement(
      pages,
      (element, values) => {
        const name = element.get('name');
        const type = convertRenderType(element);
        const initialValue = getInitialValue(submission, element, type);
        const isAttachment = element.get('renderType') === 'attachment';

        return element.get('type') === 'field'
          ? values.push({
              name,
              label: name,
              type,
              options: element.get('choices'),
              initialValue,
              enabled: !isAttachment,
              transient: isAttachment,
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
  formOptions: ['submissionId'],
  dataSources,
  fields,
  handleSubmit,
});

SubmissionForm.displayName = 'SubmissionForm';

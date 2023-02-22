import { List, getIn, remove, Map } from 'immutable';
import {
  fetchForm,
  fetchSubmission,
  saveSubmissionMultipart,
} from '../../../apis';
import { generateForm } from '../../form/Form';
import moment from 'moment';
import { isArray } from 'lodash-es';

const dataSources = ({ kappSlug, formSlug, submissionId }) => ({
  submission: {
    fn: fetchSubmission,
    params: submissionId && [
      {
        id: submissionId,
        include:
          'details,values.raw,form,form.fields,form.fields.details,form.pages',
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

const handleSubmit = ({ kappSlug, formSlug, submissionId: id }) => values => {
  // Remove the new files to upload from the values.
  const processedValues = values.map(
    value =>
      isArray(value) || List.isList(value)
        ? value.filter(entry => !(entry instanceof File))
        : value,
  );

  // Construct a list of files to upload by iterating through the values,
  // flattening if the value is a List/Array and then filtering to only keep
  // values that are instances of File, which represent new files to upload.
  const files = values
    .entrySeq()
    .flatMap(
      ([field, vals]) =>
        isArray(vals) || List.isList(vals)
          ? List(vals)
              .filter(val => val instanceof File)
              .map(file => Map({ field, file }))
          : [],
    )
    .toList();

  return saveSubmissionMultipart({
    kappSlug,
    formSlug,
    id,
    values: processedValues,
    files,
  }).then(({ submission, error }) => {
    if (error) {
      throw (error.statusCode === 400 && error.message) ||
        'There was an error saving the submission';
    }
    return submission;
  });
};

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
  const fieldKey = element.get('key');

  let value =
    getIn(
      submission,
      ['valuesRaw', fieldKey, 'value'],
      ['checkbox', 'attachment'].includes(element.get('renderType'))
        ? List()
        : '',
    ) || '';

  // To update a submission with existing submissions we need to grab the
  // documentId and insert that into the attachment value normally returned with
  // the submission.
  if (element.get('renderType') === 'attachment') {
    const rawValue = JSON.parse(
      getIn(submission, ['valuesRaw', fieldKey, 'rawValue'], null),
    );
    value = value.map((attachment, i) =>
      attachment.set('documentId', getIn(rawValue, [i, 'documentId'], null)),
    );
  }

  return type === 'datetime' && value
    ? moment(value).format('yyyy-MM-DDThh:mm')
    : type === 'date' && value
      ? moment(value).format('yyyy-MM-DD')
      : value;
};

const serializer = element => ({ values }) => {
  const name = element.get('name');
  const type = element.get('renderType');
  switch (type) {
    case 'datetime':
      return values.get(name) && moment(values.get(name)).format();
    case 'attachment':
      // When updating a submission with existing attachment values, there will
      // be a link property returned from the API that has to be removed from
      // the payload we are going to submit.
      return values
        .get(name)
        .map(
          attachment =>
            attachment instanceof File
              ? attachment
              : remove(attachment, 'link'),
        );
    default:
      return values.get(name);
  }
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

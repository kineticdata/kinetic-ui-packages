import React from 'react';
import { List, getIn } from 'immutable';
import { FieldWrapper, FormUtils } from '@kineticdata/ui';
import { fetchSubmission, updateSubmission } from '../../../apis';
import { generateForm } from '../../form/Form';
import classNames from 'classnames';
import moment from 'moment';

// Custom renderer for attachment fields to show the JSON content, but prevent
// editing. Make JSON more readable since this field is always disabled.
const AttachmentField = props => {
  const renderOptions = FormUtils.parseRenderOptions(props);
  const valueSize = List.isList(props.value) ? props.value.size : 0;
  const value = List.isList(props.value)
    ? JSON.stringify(props.value, null, 4)
    : props.value;
  return (
    <FieldWrapper {...props} renderOptions={renderOptions}>
      <textarea
        ref={props.focusRef}
        rows={valueSize > 0 ? 8 : 1}
        cols={props.cols}
        className={classNames('form-control', {
          'form-control-sm': renderOptions.size === 'sm',
          'is-invalid': renderOptions.hasErrors,
          'has-btn': renderOptions.hasClear && !!props.value,
          'is-empty': !props.value,
        })}
        id={props.id || props.name}
        name={props.name}
        value={value}
        onBlur={props.onBlur}
        onChange={props.onChange}
        onFocus={props.onFocus}
        placeholder={renderOptions.placeholder}
        disabled={!props.enabled}
        form={props.form}
      />
    </FieldWrapper>
  );
};

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
    return 'text-multi';
  } else if (element.get('renderType') === 'attachment') {
    return 'text';
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
              options: getChoices(element, initialValue),
              initialValue,
              enabled: !isAttachment,
              transient: isAttachment,
              component: isAttachment ? AttachmentField : undefined,
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

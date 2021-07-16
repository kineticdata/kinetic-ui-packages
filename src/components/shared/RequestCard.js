import React from 'react';
import { Link } from '@reach/router';
import { get } from 'immutable';
import {
  Card,
  CardCol,
  CardRow,
  TimeAgo,
  services,
} from '@kineticdata/bundle-common';
import * as helpers from '../../utils';
import * as constants from '../../constants';
import { Form } from '../../models';
import { I18n } from '@kineticdata/react';

const DisplayDateListItem = ({ submission }) => {
  const isDraft = submission.coreState === constants.CORE_STATE_DRAFT;
  return (
    <div>
      <dt>
        <I18n>{isDraft ? 'Created' : 'Submitted'}</I18n>
      </dt>
      <dd>
        <TimeAgo
          timestamp={isDraft ? submission.createdAt : submission.submittedAt}
        />
      </dd>
    </div>
  );
};

const EstCompletionListItem = ({ submission }) => {
  const dueDate = helpers.getDueDate(
    submission,
    constants.ATTRIBUTE_SERVICE_DAYS_DUE,
  );
  return (
    submission.coreState === constants.CORE_STATE_SUBMITTED && (
      <div>
        <dt>
          <I18n>Est. Completion</I18n>
        </dt>
        <dd>
          <TimeAgo timestamp={dueDate} />
        </dd>
      </div>
    )
  );
};

const ClosedDateListItem = ({ submission }) =>
  submission.coreState === constants.CORE_STATE_CLOSED && (
    <div>
      <dt>
        <I18n>Closed</I18n>
      </dt>
      <dd>
        <TimeAgo timestamp={submission.closedAt} />
      </dd>
    </div>
  );

export const RequestCard = get(services, 'RequestCard', props => {
  const { submission, path, components = {} } = props;
  const form = submission.form;
  const color = helpers.getStatusColor(submission);
  return (
    <Card
      to={path}
      bar="left"
      barColor={color}
      barSize="xs"
      components={{ Link, ...components }}
    >
      <CardCol>
        <CardRow type="title">
          <span
            className={`fa fa-${(Form(form).icon || 'circle').replace(
              /^fa-/i,
              '',
            )} fa-fw`}
          />
          <span>
            <I18n>{form.name}</I18n>
          </span>
          <span className={`badge badge-pill badge-${color} badge-stylized`}>
            <I18n>{helpers.getStatus(submission)}</I18n>
          </span>
        </CardRow>
        <CardRow>
          {submission.label === submission.id ? (
            <I18n>{form.description}</I18n>
          ) : (
            submission.label
          )}
        </CardRow>
        <CardRow type="meta">
          <dl className="flat text-muted">
            <div>
              <dt>
                <I18n>Confirmation</I18n>
              </dt>
              <dd>{submission.handle}</dd>
            </div>
            <DisplayDateListItem submission={submission} />
            <EstCompletionListItem submission={submission} />
            <ClosedDateListItem submission={submission} />
          </dl>
        </CardRow>
      </CardCol>
    </Card>
  );
});

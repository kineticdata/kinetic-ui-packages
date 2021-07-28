import React from 'react';
import { Card, CardCol, CardRow, TimeAgo } from '@kineticdata/bundle-common';
import { Link } from '@reach/router';
import * as helpers from '../../utils';
import { I18n } from '@kineticdata/react';

// card
const InitiatedDateListItem = ({ submission }) => {
  return (
    <div>
      <dt>
        <I18n>Initiated</I18n>
      </dt>
      <dd>
        <TimeAgo timestamp={submission.createdAt} />
      </dd>
    </div>
  );
};

const DueDateListItem = ({ submission }) => {
  const dueDate = submission.values['Due Date'];
  return (
    <div>
      <dt>
        <I18n>Due</I18n>
      </dt>
      <dd>
        <TimeAgo timestamp={dueDate} />
      </dd>
    </div>
  );
};

export const SurveyCard = props => {
  const { submission, path } = props;
  const form = submission.form;
  const color = helpers.getStatusColor(submission);
  return (
    <Card
      to={path}
      bar="left"
      barColor={color}
      barSize="xs"
      components={{ Link }}
    >
      <CardCol>
        <CardRow type="title">
          <span className={`fa fa-pencil-square fa-fw fa-rounded`} />
          <span>
            <I18n>{form.name}</I18n>
          </span>
          <span className={`badge badge-pill badge-${color} badge-stylized`}>
            <I18n>{helpers.getStatus(submission)}</I18n>
          </span>
        </CardRow>
        <CardRow className="text-muted">
          {submission.label === submission.id ? (
            <I18n>{form.description}</I18n>
          ) : (
            submission.label
          )}
        </CardRow>
        <CardRow type="meta">
          <dl>
            <div>
              <dt>
                <I18n>Confirmation</I18n>
              </dt>
              <dd>{submission.handle}</dd>
            </div>
            <InitiatedDateListItem submission={submission} />
            <DueDateListItem submission={submission} />
          </dl>
        </CardRow>
      </CardCol>
    </Card>
  );
};

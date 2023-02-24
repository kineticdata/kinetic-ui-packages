import React from 'react';
import { Card, CardCol, CardRow, TimeAgo } from '@kineticdata/bundle-common';
import { Link } from '@reach/router';
import * as helpers from '../../utils';
import { I18n } from '@kineticdata/react';
import {
  UncontrolledDropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
} from 'reactstrap';

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
  const { submission, username, appLocation, navigate, path } = props;
  const form = submission.form;
  const color = helpers.getSurveyColor(submission);
  const allowOptOut = JSON.parse(
    submission.form['attributesMap']['Survey Configuration'],
  )['Allow Opt-out'];

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
          <span className={`fa fa-pencil-square fa-fw`} />
          <span>
            <I18n>{form.name}</I18n>
          </span>
          {allowOptOut === 'true' && (
            <UncontrolledDropdown className="badge">
              <DropdownToggle
                onClick={e => e.preventDefault()}
                tag="button"
                className="btn btn-icon-dark"
                aria-label="Survey Card Actions"
              >
                <span className="fa fa-chevron-down fa-fw" />
              </DropdownToggle>
              <DropdownMenu right>
                <DropdownItem
                  onClick={e => {
                    e.preventDefault();
                    navigate(
                      `${appLocation}/survey-opt-out?values[Survey Slug]=${
                        submission.form.slug
                      }&values[recipientEmail]=${username}`,
                    );
                  }}
                >
                  <I18n>Unsubscribe</I18n>
                </DropdownItem>
              </DropdownMenu>
            </UncontrolledDropdown>
          )}
        </CardRow>
        <CardRow className="text-muted">
          {submission.label === submission.id ? (
            <I18n>{form.description}</I18n>
          ) : (
            submission.label
          )}
        </CardRow>
        <CardRow type="meta">
          <dl className="flat">
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

import React from 'react';
import { Link } from '@reach/router';
import { TimeAgo, addToast } from '@kineticdata/bundle-common';
import { StatusContent } from '../shared/StatusContent';
import { I18n } from '@kineticdata/react';
import classNames from 'classnames';

const SelectionToggle = ({ active, checked }) =>
  active ? (
    <span
      className={classNames('selection-toggle fa fa-fw', {
        checked: checked,
      })}
    />
  ) : null;

const AssignmentParagraph = ({ values }) => (
  <span className="submission__assignment">
    <I18n>
      {values['Assigned Team'] &&
        (values['Assigned Team Display Name'] || values['Assigned Team'])}
    </I18n>
    {values['Assigned Individual'] && values['Assigned Team'] && ' > '}
    {values['Assigned Individual'] &&
      (values['Assigned Individual Display Name'] ||
        values['Assigned Individual'])}
  </span>
);

const Timestamp = ({ id, label, value, username }) =>
  value && (
    <li className="list-group-item">
      <I18n>{label}</I18n>
      &nbsp;
      <TimeAgo timestamp={value} id={`${id}-${label}`} />
    </li>
  );

const DueOrCloseDate = ({ queueItem }) => {
  if (queueItem.closedAt) {
    return (
      <Timestamp label="Closed" value={queueItem.closedAt} id={queueItem.id} />
    );
  } else if (queueItem.values['Due Date']) {
    return (
      <Timestamp
        label="Due"
        value={queueItem.values['Due Date']}
        id={queueItem.id}
      />
    );
  } else {
    return null;
  }
};

export const QueueListItemSmall = ({
  queueItem,
  filter,
  path,
  selectionMode,
  selected,
  selectionDisabled,
  toggleSelection,
}) => {
  const { createdAt, createdBy, updatedAt, updatedBy, id, values } = queueItem;
  const content = (
    <>
      <div className="submission__meta">
        <SelectionToggle
          active={selectionMode && !selectionDisabled}
          checked={selected}
        />
        <StatusContent queueItem={queueItem} />
        <div className="submission__handler">
          <I18n
            context={`kapps.${queueItem.form.kapp.slug}.forms.${
              queueItem.form.slug
            }`}
          >
            {queueItem.form.name}
          </I18n>{' '}
          ({queueItem.handle})
        </div>
        <AssignmentParagraph values={values} />
        {queueItem.values['Discussion Id'] && (
          <span className="btn icon icon--discussion">
            <span
              className="fa fa-fw fa-comments"
              style={{ color: 'rgb(9, 84, 130)', fontSize: '16px' }}
            />
          </span>
        )}
      </div>

      <div className="submission__title">{queueItem.label}</div>
      <ul className="submission__timestamps list-group">
        <DueOrCloseDate queueItem={queueItem} />
        <Timestamp
          label="Updated"
          value={updatedAt}
          id={id}
          username={updatedBy}
        />
        <Timestamp
          label="Created"
          value={createdAt}
          id={id}
          username={createdBy}
        />
      </ul>
    </>
  );

  return (
    <li
      className={classNames('submission list-group-item', {
        selection: selectionMode,
        'selection-disabled': selectionMode && selectionDisabled,
        selected: selected,
      })}
    >
      {selectionMode ? (
        <div
          role="button"
          className="submission-summary"
          onClick={e =>
            selectionDisabled
              ? addToast({
                  severity: 'warning',
                  message: 'You cannot select closed items.',
                })
              : toggleSelection(queueItem, e.shiftKey)
          }
        >
          {content}
        </div>
      ) : (
        <Link to={path || `item/${id}`} className="submission-summary">
          {content}
        </Link>
      )}
    </li>
  );
};

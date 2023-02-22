import React, { Fragment } from 'react';
import { Link } from '@reach/router';
import { compose, withHandlers, withState } from 'recompose';
import {
  Dropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
} from 'reactstrap';
import moment from 'moment';
import { Constants } from '@kineticdata/bundle-common';
import { bundle, I18n } from '@kineticdata/react';

const MobileSubmissionCard = ({ submission, columns, path }) => (
  <tr>
    <td className="d-md-none d-table-cell" key={`tcol-0-${submission.id}`}>
      <div className="card">
        <div className="card-body">
          <strong className="card-title">
            getSubmissionData(submission, columns.first())
          </strong>
          <p className="card-text">
            {columns.map((innerColumn, innerIndex) => {
              const innerRowData = getSubmissionData(submission, innerColumn);
              return (
                innerIndex !== 0 && (
                  <Fragment key={`tcol-mobile-${innerIndex}`}>
                    <span>
                      <strong>
                        <I18n>{innerColumn.label}</I18n>:
                      </strong>{' '}
                      {innerRowData}
                    </span>
                    <br />
                  </Fragment>
                )
              );
            })}
          </p>
          <div className="btn-group" role="group" aria-label="Actions">
            <Link to={`${path}/${submission.id}`} className="btn btn-primary">
              <I18n>View / Edit</I18n>
            </Link>
            <button
              type="button"
              onClick={handleClone(submission.id)}
              className="btn btn-success"
            >
              <I18n>Clone</I18n>
            </button>
            <div className="dropdown-divider" role="none" />
            <button
              type="button"
              onClick={handleDelete(submission.id)}
              className="btn btn-danger"
            >
              <I18n>Delete</I18n>
            </button>
          </div>
        </div>
      </div>
    </td>
  </tr>
);

const TableSubmissionColumn = ({ shouldLink, to, label }) => (
  <td className="d-none d-md-table-cell">
    {shouldLink ? <Link to={to}>{label}</Link> : <span>{label}</span>}
  </td>
);

const TableSubmissionRow = ({
  columns,
  submission,
  path,
  openDropdown,
  toggleDropdown,
  handleClone,
  handleDelete,
}) => (
  <tr>
    {columns.map((column, index) => (
      <TableSubmissionColumn
        key={`tcol-${index}-${submission.id}`}
        shouldLink={index === 0}
        to={`${path}/${submission.id}`}
        label={getSubmissionData(submission, column)}
      />
    ))}
    <td>
      <Dropdown
        toggle={toggleDropdown(submission.id)}
        isOpen={openDropdown === submission.id}
      >
        <DropdownToggle color="link" className="btn-sm">
          <span className="fa fa-ellipsis-h fa-2x" />
        </DropdownToggle>
        <DropdownMenu right>
          <DropdownItem tag={Link} to={`${path}/${submission.id}`}>
            <I18n>View / Edit</I18n>
          </DropdownItem>
          <DropdownItem onClick={handleClone(submission.id)}>
            <I18n>Clone</I18n>
          </DropdownItem>
          <DropdownItem divider />
          <DropdownItem
            onClick={handleDelete(submission.id)}
            className="text-danger"
          >
            <I18n>Delete</I18n>
          </DropdownItem>
        </DropdownMenu>
      </Dropdown>
    </td>
  </tr>
);

const SubmissionListItemComponent = ({
  submission,
  columns,
  form,
  handleClone,
  handleDelete,
  openDropdown,
  toggleDropdown,
  path,
  isMobile,
}) =>
  isMobile ? (
    <MobileSubmissionCard
      submission={submission}
      columns={columns}
      path={path}
    />
  ) : (
    <TableSubmissionRow
      columns={columns}
      submission={submission}
      path={path}
      openDropdown={openDropdown}
      toggleDropdown={toggleDropdown}
      handleClone={handleClone}
      handleDelete={handleDelete}
    />
  );

const getSubmissionData = (submission, column) =>
  // Check if column is a field value (and not a property like createdBy)
  column.type === 'value'
    ? Array.isArray(submission.values[column.name])
      ? submission.values[column.name].map((val, i) => (
          // Render each value in an array as a separate div
          <div key={`col-val-${i}`}>
            {!val || typeof val === 'string' ? (
              // If value is a string, just render it
              val
            ) : val.link && val.name ? (
              // If value is a list of objects with link and name properties,
              // render as a link to download the file.
              <a
                href={`${bundle.spaceLocation()}${val.link.replace(
                  `/${bundle.spaceSlug()}`,
                  '',
                )}`}
                download
              >
                {val.name}
              </a>
            ) : (
              // Otherwise stringify the value
              JSON.stringify(val)
            )}
          </div>
        ))
      : submission.values[column.name]
    : // If column is not a value then it must be a property (like createdBy)
      column.name.includes('At')
      ? // If property name includes 'At' render as a date
        moment(submission[column.name]).format(Constants.TIME_FORMAT)
      : submission[column.name];

const handleClone = ({ cloneSubmission, fetchSubmissions }) => id => () =>
  cloneSubmission({ id: id, callback: fetchSubmissions });

const handleDelete = ({ deleteSubmission, fetchSubmissions }) => id => () =>
  deleteSubmission({ id: id, callback: fetchSubmissions });

const toggleDropdown = ({
  setOpenDropdown,
  openDropdown,
}) => dropdownSlug => () =>
  setOpenDropdown(dropdownSlug === openDropdown ? '' : dropdownSlug);

export const SubmissionListItem = compose(
  withState('openDropdown', 'setOpenDropdown', ''),
  withHandlers({
    toggleDropdown,
    handleClone,
    handleDelete,
  }),
)(SubmissionListItemComponent);

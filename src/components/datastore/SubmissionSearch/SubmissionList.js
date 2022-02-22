import React from 'react';
import { connect } from 'react-redux';
import { compose, withHandlers } from 'recompose';
import { actions } from '../../../redux/modules/settingsDatastore';
import { context } from '../../../redux/store';
import { SubmissionListItem } from './SubmissionListItem';
import { I18n } from '@kineticdata/react';
import {
  EmptyMessage,
  LoadingMessage,
  InfoMessage,
  ErrorMessage,
} from '@kineticdata/bundle-common';

const DiscussionIcon = () => (
  <span className="icon">
    <span
      className="fa fa-fw fa-comments"
      style={{
        color: 'rgb(9, 84, 130)',
        fontSize: '16px',
      }}
    />
  </span>
);

const sortTable = ({ clientSortInfo, setClientSortInfo }) => column => {
  if (
    clientSortInfo &&
    clientSortInfo.type === column.type &&
    clientSortInfo.name === column.name
  ) {
    setClientSortInfo({
      ...clientSortInfo,
      direction: clientSortInfo.direction === 'DESC' ? 'ASC' : 'DESC',
    });
  } else {
    setClientSortInfo({
      type: column.type,
      name: column.name,
      direction: 'ASC',
    });
  }
};

const fetchSubmissions = ({
  fetchSubmissionsSimple,
  fetchSubmissionsAdvanced,
  simpleSearchActive,
  clearPageTokens,
}) => () => {
  clearPageTokens();
  if (simpleSearchActive) {
    fetchSubmissionsSimple();
  } else {
    fetchSubmissionsAdvanced();
  }
};

const SubmissionListComponent = ({
  form,
  submissions,
  submissionsError,
  loading,
  columns,
  hasStartedSearching,
  nextPageToken,
  pageTokens,
  searching,
  path,
  isMobile,
  cloneSubmission,
  deleteSubmission,
  fetchSubmissions,
  clientSortInfo,
  sortTable,
}) => {
  const visibleColumns = columns.filter(c => c.visible);
  return (
    <div className="datastore-submissions">
      {loading ? (
        <h3>
          <I18n>Loading</I18n>
        </h3>
      ) : (
        <div>
          {!submissionsError &&
            submissions.size > 0 && (
              <div>
                {nextPageToken === null &&
                  pageTokens.size === 0 &&
                  !searching && (
                    <div className="alert alert-success mt-3">
                      <strong>{submissions.size}</strong>{' '}
                      <I18n>results found</I18n>
                    </div>
                  )}
                {clientSortInfo &&
                  (nextPageToken !== null || pageTokens.size > 0) && (
                    <div className="text-info mb-2">
                      <small>
                        <em>
                          <I18n>
                            Sorting the table columns will only sort the visible
                            records on the current page.
                          </I18n>
                        </em>
                      </small>
                    </div>
                  )}
                <table className="table table-sm table-striped table--settings">
                  <thead className="d-none d-md-table-header-group sortable">
                    <tr>
                      {visibleColumns.map(c => {
                        const isDiscussionIdField =
                          c.name === 'Discussion Id' ? true : false;
                        const sortClass =
                          (clientSortInfo &&
                            clientSortInfo.type === c.type &&
                            clientSortInfo.name === c.name &&
                            (clientSortInfo.direction === 'DESC'
                              ? 'sort-desc'
                              : 'sort-asc')) ||
                          '';
                        return (
                          <th
                            key={`thead-${c.type}-${c.name}`}
                            className={`d-sm-none d-md-table-cell ${sortClass}`}
                            onClick={e => sortTable(c)}
                            scope="col"
                          >
                            {isDiscussionIdField ? (
                              <DiscussionIcon />
                            ) : (
                              <I18n>{c.label}</I18n>
                            )}
                          </th>
                        );
                      })}
                      <th className="sort-disabled" />
                    </tr>
                  </thead>
                  <thead className="d-md-none">
                    <tr>
                      <th scope="col">
                        <div className="input-group">
                          <div className="input-group-prepend">
                            <span className="input-group-text">
                              <I18n>Sort By</I18n>
                            </span>
                          </div>
                          <I18n
                            render={translate => (
                              <select
                                className="form-control"
                                value={
                                  (clientSortInfo &&
                                    `${clientSortInfo.name}::${
                                      clientSortInfo.type
                                    }`) ||
                                  ''
                                }
                                onChange={e => {
                                  const sortInfo = e.target.value.split('::');
                                  sortTable(
                                    sortInfo.length === 2
                                      ? visibleColumns.find(
                                          c =>
                                            c.name === sortInfo[0] &&
                                            c.type === sortInfo[1],
                                        )
                                      : null,
                                  );
                                }}
                              >
                                {!clientSortInfo && <option />}
                                {visibleColumns.map(c => (
                                  <option
                                    key={`${c.name}::${c.type}`}
                                    value={`${c.name}::${c.type}`}
                                  >
                                    {translate(c.label)}
                                  </option>
                                ))}
                              </select>
                            )}
                          />
                          {clientSortInfo && (
                            <I18n
                              render={translate => (
                                <select
                                  className="form-control"
                                  value={
                                    (clientSortInfo &&
                                      clientSortInfo.direction) ||
                                    ''
                                  }
                                  onChange={e => {
                                    sortTable({
                                      ...clientSortInfo,
                                      direction: e.target.value,
                                    });
                                  }}
                                >
                                  <option value="ASC">
                                    {translate('Asc')}
                                  </option>
                                  <option value="DESC">
                                    {translate('Desc')}
                                  </option>
                                </select>
                              )}
                            />
                          )}
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {submissions.map(s => (
                      <SubmissionListItem
                        key={`trow-${s.id}`}
                        submission={s}
                        loading={loading}
                        form={form}
                        columns={visibleColumns}
                        path={path}
                        isMobile={isMobile}
                        cloneSubmission={cloneSubmission}
                        fetchSubmissions={fetchSubmissions}
                        deleteSubmission={deleteSubmission}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          {searching && (
            <LoadingMessage
              title="Searching"
              message="Just a sec while we find those submissions."
            />
          )}
          {!searching &&
            hasStartedSearching &&
            !submissionsError &&
            submissions.size === 0 && (
              <EmptyMessage
                title={`No ${form.name} Submissions Found`}
                message="Add a new one by hitting the new button!"
              />
            )}
          {!searching &&
            hasStartedSearching &&
            submissionsError && (
              <ErrorMessage message={submissionsError.message} />
            )}
          {!searching &&
            !hasStartedSearching &&
            submissions.size === 0 && (
              <InfoMessage
                title="Enter a term to search"
                message="You can search by any field on the form, or by choosing an index and building a search query."
              />
            )}
        </div>
      )}
    </div>
  );
};

export const mapStateToProps = state => ({
  loading: state.settingsDatastore.currentFormLoading,
  form: state.settingsDatastore.currentForm,
  submissions: state.settingsDatastore.submissions,
  submissionsError: state.settingsDatastore.submissionsError,
  clientSortInfo: state.settingsDatastore.clientSortInfo,
  searching: state.settingsDatastore.searching,
  nextPageToken: state.settingsDatastore.nextPageToken,
  pageTokens: state.settingsDatastore.pageTokens,
  columns: state.settingsDatastore.currentForm.columns,
  hasStartedSearching: state.settingsDatastore.hasStartedSearching,
  path: state.router.location.pathname.replace(/\/$/, ''),
  isMobile: state.app.layoutSize === 'small',
  simpleSearchActive: state.settingsDatastore.simpleSearchActive,
});

export const mapDispatchToProps = {
  cloneSubmission: actions.cloneSubmission,
  deleteSubmission: actions.deleteSubmission,
  setClientSortInfo: actions.setClientSortInfo,
  fetchSubmissionsSimple: actions.fetchSubmissionsSimple,
  fetchSubmissionsAdvanced: actions.fetchSubmissionsAdvanced,
  clearPageTokens: actions.clearPageTokens,
};

export const SubmissionList = compose(
  connect(
    mapStateToProps,
    mapDispatchToProps,
    null,
    { context },
  ),
  withHandlers({
    sortTable,
    fetchSubmissions,
  }),
)(SubmissionListComponent);

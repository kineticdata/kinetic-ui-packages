import React from 'react';
import { compose, lifecycle } from 'recompose';
import { Router } from '@reach/router';
import { connect } from '../../redux/store';
import { actions } from '../../redux/modules/settingsDatastore';
import { DatastoreSubmission } from './Submission';
import { FormList } from './FormList';
import { SubmissionSearch } from './SubmissionSearch/SubmissionSearch';
import { DatastoreSettings } from './DatastoreSettings';
import { TableComponents } from '@kineticdata/bundle-common';

const tableKey = 'datastore-list';

/**
 * Wrap all route for a single datastore form so we can reset the search state
 * when the slug changes or the component is unmounted.
 */
const FormWrapper = compose(
  connect(
    null,
    { reset: actions.resetSearchParams },
  ),
  lifecycle({
    componentDidUpdate(prevProps) {
      if (this.props.slug !== prevProps.slug) {
        this.props.reset();
      }
    },
    componentWillUnmount() {
      this.props.reset();
    },
  }),
)(({ slug }) => (
  <Router>
    <SubmissionSearch slug={slug} default />
    <DatastoreSettings slug={slug} tableKey={tableKey} path="settings" />
    <DatastoreSubmission slug={slug} path="new" />
    <DatastoreSubmission slug={slug} path=":id" />
  </Router>
));

export const DatastoreRouter = ({ loading }) =>
  !loading && (
    <Router>
      <TableComponents.MountWrapper tableKey={tableKey} default>
        <FormWrapper path=":slug/*" />
        <FormList tableKey={tableKey} default />
      </TableComponents.MountWrapper>
    </Router>
  );

export const mapStateToProps = state => ({
  loading: state.settingsDatastore.loading,
});

export const Datastore = connect(mapStateToProps)(DatastoreRouter);

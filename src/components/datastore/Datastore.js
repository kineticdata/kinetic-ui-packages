import React from 'react';
import { Router } from '@reach/router';
import { connect } from '../../redux/store';
import { DatastoreSubmission } from './Submission';
import { FormList } from './FormList';
import { SubmissionSearch } from './SubmissionSearch/SubmissionSearch';
import { DatastoreSettings } from './DatastoreSettings';
// import { DatastoreEdit } from './DatastoreEdit';
import { TableComponents } from '@kineticdata/bundle-common';

const tableKey = 'datastore-list';

export const DatastoreRouter = ({ loading }) =>
  !loading && (
    <Router>
      <TableComponents.MountWrapper tableKey={tableKey} default>
        <SubmissionSearch path=":slug" />
        <DatastoreSettings tableKey={tableKey} path=":slug/settings" />
        {/* <DatastoreEdit tableKey={tableKey} path=":slug/settings" /> */}
        <DatastoreSubmission path=":slug/new" />
        <DatastoreSubmission path=":slug/:id/:mode" />
        <DatastoreSubmission path=":slug/:id" />
        <FormList tableKey={tableKey} default />
      </TableComponents.MountWrapper>
    </Router>
  );

export const mapStateToProps = state => ({
  loading: state.settingsDatastore.loading,
});

export const Datastore = connect(mapStateToProps)(DatastoreRouter);

import React, { Component } from 'react';
import FormSubmissionTable from './FormSubmissionTable';
import DatastoreSubmissionTable from './DatastoreSubmissionTable';
import KappSubmissionTable from './KappSubmissionTable';

export class SubmissionTable extends Component {
  componentDidMount() {
    if (this.props.mode === 'space') {
      console.warn(
        'Datastore Submissions are deprecated in Core 5.1, please upgrade to "form" mode.',
      );
    } else if (this.props.mode === 'kapp' || !this.props.mode) {
      console.warn(
        'Kapp Submissions are deprecated in Core 5.1, please upgrade to "form" mode.',
      );
    }
  }

  render() {
    const TableComponent =
      this.props.mode === 'form'
        ? FormSubmissionTable
        : this.props.mode === 'space'
          ? DatastoreSubmissionTable
          : this.props.mode === 'kapp'
            ? KappSubmissionTable
            : KappSubmissionTable;

    return (
      <TableComponent {...this.props}>{this.props.children}</TableComponent>
    );
  }
}

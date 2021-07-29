import React from 'react';
import { connect } from 'react-redux';
import { lifecycle, compose, withState } from 'recompose';
import { actions } from '../../../redux/modules/settingsDatastore';
import { context } from '../../../redux/store';
import { PageTitle } from '../../shared/PageTitle';

import { Searchbar } from './Searchbar';
import { SubmissionList } from './SubmissionList';
import { Paging } from './Paging';
import { DatastoreModal } from '../DatastoreModal';
import { I18n } from '@kineticdata/react';

const SubmissionSearchComponent = ({
  form,
  loading,
  slug,
  openModal,
  optionsOpen,
  setOptionsOpen,
}) => (
  <I18n context={`kapps.datastore.forms.${form.slug}`}>
    {!loading ? (
      <div className="page-container">
        <div className="page-panel">
          <PageTitle
            parts={[form.name, 'Datastore']}
            breadcrumbs={[
              { label: 'Home', to: '/' },
              { label: 'Settings', to: '../..' },
              { label: 'Datastore Forms', to: '..' },
            ]}
            title={form.name}
            actions={[
              {
                label: 'Create Record',
                icon: 'plus',
                to: 'new',
              },
              {
                label: 'Configure Form',
                menu: true,
                to: 'settings',
              },
              {
                label: 'Export Records',
                menu: true,
                onClick: () => openModal('export'),
              },
              {
                label: 'Import Records',
                menu: true,
                onClick: () => openModal('import'),
              },
            ]}
          />
          <Searchbar formSlug={slug} />
          <Paging />
          <SubmissionList />
        </div>
      </div>
    ) : null}
    <DatastoreModal />
  </I18n>
);

export const mapStateToProps = state => ({
  loading: state.settingsDatastore.currentFormLoading,
  form: state.settingsDatastore.currentForm,
  simpleSearchActive: state.settingsDatastore.simpleSearchActive,
  submissions: state.settingsDatastore.submissions,
});

export const mapDispatchToProps = {
  fetchForm: actions.fetchForm,
  clearForm: actions.clearForm,
  resetSearch: actions.resetSearchParams,
  openModal: actions.openModal,
};

export const SubmissionSearch = compose(
  connect(
    mapStateToProps,
    mapDispatchToProps,
    null,
    { context },
  ),
  withState('optionsOpen', 'setOptionsOpen', false),
  lifecycle({
    componentWillMount() {
      this.props.fetchForm(this.props.slug);
    },
    componentWillReceiveProps(nextProps) {
      if (this.props.slug !== nextProps.slug) {
        this.props.fetchForm(nextProps.slug);
        this.props.resetSearch();
      }
    },
    componentWillUnmount() {
      this.props.clearForm();
    },
  }),
)(SubmissionSearchComponent);

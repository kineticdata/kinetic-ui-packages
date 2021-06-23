import React from 'react';
import { compose, lifecycle, withHandlers, withProps } from 'recompose';
import { Link } from '@reach/router';
import {
  DiscussionsPanel,
  LoadingMessage,
  selectDiscussionsEnabled,
} from '@kineticdata/bundle-common';
import { actions } from '../../redux/modules/queue';
import { QueueItemDetailsContainer } from './QueueItemDetails';
import { getFilterByPath } from '../../redux/modules/queueApp';
import { I18n, createRelatedItem } from '@kineticdata/react';
import { connect } from '../../redux/store';
import { PageTitle } from '../shared/PageTitle';
import classNames from 'classnames';

const CreationForm = ({ onChange, values, errors }) => (
  <React.Fragment>
    <div className="form-group">
      <label htmlFor="title">Title</label>
      <input
        id="title"
        name="title"
        type="text"
        value={values.title}
        onChange={onChange}
      />
      {errors.title && (
        <small className="form-text text-danger">{errors.title}</small>
      )}
    </div>
    <div className="form-group">
      <label htmlFor="title">Description</label>
      <textarea
        id="description"
        name="description"
        value={values.description}
        onChange={onChange}
      />
      {errors.description && (
        <small className="form-text text-danger">{errors.description}</small>
      )}
    </div>
    <div className="form-group">
      <div className="form-check-inline">
        <input
          id="relateOriginatingRequest"
          name="relateOriginatingRequest"
          type="checkbox"
          className="form-check-input"
          checked={values.relateOriginatingRequest}
          onChange={onChange}
        />
        <label htmlFor="relateOriginatingRequest" className="form-check-label">
          Relate Originating Request
        </label>
      </div>
    </div>
  </React.Fragment>
);

export const QueueItem = ({
  loading,
  filter,
  queueItem,
  discussionsEnabled,
  creationFields,
  onDiscussionCreated,
  profile,
  isSmallLayout,
  navigate,
}) => (
  <div className="page-container page-container--panels">
    <PageTitle
      parts={[
        !loading ? queueItem.label : '',
        filter ? filter.name || 'Adhoc' : '',
      ]}
    />
    <div
      className={classNames(
        'page-panel page-panel--white page-panel--no-padding page-panel--flex',
        { 'page-panel--three-fifths': !loading },
      )}
    >
      {filter && (
        <div className="page-panel__header">
          <div className="nav-return">
            <Link to="../.." aria-label={`Return to Filter ${filter.name}`}>
              <span className="icon" aria-hidden="true">
                <span className="fa fa-fw fa-chevron-left" />
              </span>
              <I18n>{filter.name || 'Adhoc'}</I18n>
            </Link>
          </div>
        </div>
      )}
      <div className="page-panel__body">
        {loading ? (
          <LoadingMessage />
        ) : (
          <QueueItemDetailsContainer
            filter={filter}
            creationFields={creationFields}
            onCreated={onDiscussionCreated}
            CreationForm={CreationForm}
            navigate={navigate}
          />
        )}
      </div>
    </div>
    {!loading &&
      discussionsEnabled &&
      !isSmallLayout && (
        <DiscussionsPanel
          itemType="Submission"
          itemKey={queueItem.id}
          creationFields={creationFields}
          onCreated={onDiscussionCreated}
          CreationForm={CreationForm}
          me={profile}
        />
      )}
  </div>
);

export const mapStateToProps = (state, props) => ({
  filter: getFilterByPath(state, props.location.pathname),
  loading: !state.queue.currentItem || state.queue.currentItem.id !== props.id,
  queueItem: state.queue.currentItem,
  discussionsEnabled: selectDiscussionsEnabled(state),
  profile: state.app.profile,
  isSmallLayout: state.app.layoutSize === 'small',
});

export const mapDispatchToProps = {
  fetchCurrentItem: actions.fetchCurrentItem,
  setCurrentItem: actions.setCurrentItem,
};

export const QueueItemContainer = compose(
  connect(
    mapStateToProps,
    mapDispatchToProps,
  ),
  withProps(
    props =>
      props.queueItem && {
        creationFields: {
          title: props.queueItem.label || 'Queue Discussion',
          description: props.queueItem.values['Details'] || '',
          owningTeams: [{ name: props.queueItem.values['Assigned Team'] }],
          owningUsers: [
            {
              username:
                props.queueItem.values['Assigned Individual'] ||
                props.profile.username,
            },
          ],
          relateOriginatingRequest: true,
        },
      },
  ),
  withHandlers({
    onDiscussionCreated: props => (discussion, values) => {
      if (values.relateOriginatingRequest) {
        createRelatedItem(discussion.id, {
          type: 'Submission',
          key: props.queueItem.origin.id,
        });
      }
    },
  }),
  lifecycle({
    componentDidMount() {
      this.props.fetchCurrentItem(this.props.id);
    },
    componentDidUpdate(prevProps) {
      if (this.props.id !== prevProps.id) {
        this.props.fetchCurrentItem(this.props.id);
      }
    },
    componentWillUnmount() {
      this.props.setCurrentItem(null);
    },
  }),
)(QueueItem);

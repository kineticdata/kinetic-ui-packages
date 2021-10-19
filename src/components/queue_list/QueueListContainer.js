import { compose, lifecycle, withHandlers, withProps } from 'recompose';
import { is } from 'immutable';
import {
  getFilterByPath,
  selectMyTeamForms,
} from '../../redux/modules/queueApp';
import { actions as queueActions } from '../../redux/modules/queue';
import { QueueList } from './QueueList';
import { validateDateRange } from '../filter_menu/FilterMenuAbstract';
import { connect } from '../../redux/store';

const mapStateToProps = (state, props) => {
  const filter = getFilterByPath(state, props.location.pathname);
  return {
    filter,
    loading: state.queue.loading,
    paging: state.queue.paging,
    data: state.queue.data,
    error: state.queue.error,
    hasPreviousPage: state.queue.hasPreviousPage,
    isMobile: state.app.layoutSize === 'small',
    isDesktop: state.app.layoutSize === 'xlarge',
    hasTeams: state.queueApp.myTeams.size > 0,
    hasForms:
      selectMyTeamForms(state).filter(form => form.type === 'Task').length > 0,
    selectionMode: state.queue.selectedList !== null,
    selectedList: state.queue.selectedList,
  };
};

const mapDispatchToProps = {
  fetchList: queueActions.fetchListRequest,
  resetList: queueActions.fetchListReset,
  toggleSelectedItem: queueActions.toggleSelectedItem,
};

export const QueueListContainer = compose(
  connect(
    mapStateToProps,
    mapDispatchToProps,
  ),
  withProps(({ filter }) => {
    return {
      filterValidations: filter
        ? [validateDateRange].map(fn => fn(filter)).filter(v => v)
        : [],
    };
  }),
  withHandlers({
    handleRefresh: props => () => props.resetList(props.filter),
  }),
  withHandlers(() => {
    let queueListRef = null;
    return {
      setQueueListRef: () => ref => (queueListRef = ref),
      scrollToTop: () => () => {
        queueListRef.scrollTop = 0;
      },
    };
  }),
  lifecycle({
    componentDidMount() {
      this.loadFilter(this.props.filter, this.props.filterValidations);
    },
    componentDidUpdate(prevProps) {
      if (!is(this.props.filter, prevProps.filter)) {
        this.loadFilter(this.props.filter, this.props.filterValidations);
      }
      if (!this.props.paging && prevProps.paging) {
        this.props.scrollToTop();
      }
    },
    loadFilter(filter, filterValidations) {
      if (filterValidations.length <= 0) {
        this.props.fetchList(filter);
      }
    },
  }),
)(QueueList);

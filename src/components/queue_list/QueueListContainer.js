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
    hasNextPage: state.queue.hasNextPage,
    pageIndexStart: state.queue.pageIndexStart,
    pageIndexEnd: state.queue.pageIndexEnd,
    limit: state.queue.limit,
    count: state.queue.counts.get(filter),
    isMobile: state.app.layoutSize === 'small',
    hasTeams: state.queueApp.myTeams.size > 0,
    hasForms:
      selectMyTeamForms(state).filter(form => form.type === 'Task').length > 0,
  };
};

const mapDispatchToProps = {
  fetchList: queueActions.fetchListRequest,
  resetList: queueActions.fetchListReset,
  previousPage: queueActions.fetchListPrevious,
  nextPage: queueActions.fetchListNext,
  updateListLimit: queueActions.updateListLimit,
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
    handlePrevious: props => () => props.previousPage(),
    handleNext: props => () => props.nextPage(),
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
    componentWillMount() {
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

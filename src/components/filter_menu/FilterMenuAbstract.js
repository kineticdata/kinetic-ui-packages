import React, { Fragment } from 'react';
import { compose, lifecycle, withHandlers } from 'recompose';
import { push } from 'redux-first-history';
import { isImmutable, List, Map, OrderedMap } from 'immutable';
import { actions as queueActions } from '../../redux/modules/queue';
import { actions } from '../../redux/modules/filterMenu';
import { actions as appActions } from '../../redux/modules/queueApp';
import { DateRangeSelector } from '@kineticdata/bundle-common';
import moment from 'moment';
import { I18n } from '@kineticdata/react';
import { connect } from '../../redux/store';

const VALID_STATUSES = List(['Open', 'Pending', 'Cancelled', 'Complete']);

export const ASSIGNMENT_LABELS = Map({
  '': 'Any',
  mine: 'Mine',
  unassigned: 'Unassigned',
});

const SORT_OPTIONS = OrderedMap([
  ['createdAt', { label: 'Created At', id: 'sorted-by-created-at' }],
  ['updatedAt', { label: 'Updated At', id: 'sorted-by-updated-at' }],
  ['closedAt', { label: 'Closed At', id: 'sorted-by-closed-at' }],
  ['values[Due Date]', { label: 'Due Date', id: 'sorted-by-due-date' }],
]);

const SORT_DIRECTIONS = OrderedMap([
  ['ASC', { label: 'Ascending', id: 'sorted-ascending' }],
  ['DESC', { label: 'Descending', id: 'sorted-descending' }],
]);

const convertDateRangeValue = dateRange =>
  !dateRange.custom
    ? dateRange.preset
    : { start: dateRange.start, end: dateRange.end };

const formatTimeline = timeline => {
  const match = timeline.match(/(.)(.*)At/);
  return `${match[1].toUpperCase()}${match[2]}`;
};

const formatPreset = preset => {
  const match = preset.match(/(\d+)days/);
  return `${match[1]} days`;
};

const formatDate = date => moment(date).format('l');

const summarizeDateRange = range => (
  <I18n
    key="summarizeDateRange"
    render={translate =>
      range.preset !== ''
        ? translate(
            `${formatTimeline(range.timeline)} in last ${formatPreset(
              range.preset,
            )}`,
          )
        : range.custom
          ? `${translate(formatTimeline(range.timeline))} ${formatDate(
              range.start,
            )} - ${formatDate(range.end)}`
          : null
    }
  />
);

export const validateDateRange = filter => {
  if (filter.dateRange.custom) {
    if (filter.dateRange.start === '' && filter.dateRange.end === '') {
      return 'Select a start and end date';
    } else if (filter.dateRange.start === '' && filter.dateRange.end !== '') {
      return 'Select a start date';
    } else if (filter.dateRange.start !== '' && filter.dateRange.end === '') {
      return 'Select an end date';
    } else if (filter.dateRange.end < filter.dateRange.start) {
      return 'Select an end date after the start date';
    }
  }
};

const validateFilterName = (filter, showing) => {
  if (showing === 'save-filter' && (!filter.name || !filter.name.trim())) {
    return 'Filter name cannot be empty.';
  } else if (filter.name.indexOf('%') >= 0) {
    return 'Percentage signs are not allowed in filter names.';
  }
};

const FilterCheckbox = props => (
  <label htmlFor={props.id}>
    <input type="checkbox" {...props} />
    <I18n>{props.label}</I18n>
  </label>
);

const FilterRadio = props => (
  <label htmlFor={props.id}>
    <input type="radio" {...props} />
    <I18n>{props.label}</I18n>
  </label>
);

const FilterMenuAbstractComponent = props => (
  <I18n
    render={translate =>
      props.currentFilter &&
      props.render({
        teamFilters: props.teams
          .map(team => ({
            id: `filter-menu-team-checkbox-${team.slug}`,
            name: team.name,
            label: team.name,
            checked: props.currentFilter.teams.includes(team.name),
            onChange: props.toggleTeam,
          }))
          .map(props => <FilterCheckbox key={props.name} {...props} />),
        assignmentFilters: ASSIGNMENT_LABELS.toSeq()
          .map((label, value = '') => ({
            id: `filter-menu-assignment-radio-${value || 'any'}`,
            name: 'filter-menu-assignment-radio',
            value: value,
            label,
            checked: props.currentFilter.assignments === value,
            onChange: props.toggleAssignment,
          }))
          .valueSeq()
          .map(props => <FilterRadio key={props.value} {...props} />),
        createdByMeFilter: (
          <FilterCheckbox
            id="createdByMe"
            name="createdByMe"
            label="Created By Me"
            checked={props.currentFilter.createdByMe}
            onChange={props.toggleCreatedByMe}
          />
        ),
        statusFilters: VALID_STATUSES.map(status => ({
          id: `filter-menu-status-checkbox-${status}`,
          name: status,
          label: status,
          checked: props.currentFilter.status.includes(status),
          onChange: props.toggleStatus,
        })).map(props => <FilterCheckbox key={props.name} {...props} />),
        dateRangeFilters: (
          <Fragment>
            <select
              value={props.currentFilter.dateRange.timeline}
              onChange={props.changeTimeline}
              className="form-control"
            >
              <option value="createdAt">{translate('Created At')}</option>
              <option value="updatedAt">{translate('Updated At')}</option>
              <option value="closedAt">{translate('Closed At')}</option>
            </select>
            <DateRangeSelector
              allowNone
              value={convertDateRangeValue(props.currentFilter.dateRange)}
              onChange={props.setDateRange}
            />
          </Fragment>
        ),
        sortedByOptions: SORT_OPTIONS.filter(
          (data, value) =>
            (!props.currentFilter.dateRange.preset &&
              !props.currentFilter.dateRange.current) ||
            value === props.currentFilter.sortBy,
        )
          .map(({ label, id }, value) => (
            <Fragment key={id}>
              <label htmlFor={id}>
                <input
                  type="radio"
                  id={id}
                  value={value}
                  name="sorted-by"
                  checked={value === props.currentFilter.sortBy}
                  onChange={props.changeSortedBy}
                  disabled={
                    props.currentFilter.dateRange.preset ||
                    props.currentFilter.dateRange.current
                  }
                />
                <I18n>{label}</I18n>
              </label>
              {value === props.currentFilter.sortBy &&
                props.currentFilter.sortBy.startsWith('values') && (
                  <small className="text-muted">
                    {translate(
                      "Sorting by %s will exclude items for which the %s field doesn't exist.",
                    ).replace(/%s/g, translate(label))}
                  </small>
                )}
            </Fragment>
          ))
          .toList()
          .push(
            props.currentFilter.dateRange.preset ||
            props.currentFilter.dateRange.current ? (
              <small key="info-msg" className="text-muted">
                {translate(
                  'Options restricted due to the selected date range.',
                )}
              </small>
            ) : null,
          ),
        sortDirectionOptions: SORT_DIRECTIONS.map(({ label, id }, value) => (
          <label key={id} htmlFor={id}>
            <input
              type="radio"
              id={id}
              value={value}
              name="sort-direction"
              checked={value === props.currentFilter.sortDirection}
              onChange={props.changeDirection}
            />
            {translate(label)}
          </label>
        )).toList(),
        saveFilterOptions: (
          <div>
            <label htmlFor="save-filter-name">{translate('Filter Name')}</label>
            <input
              type="text"
              className="form-control"
              id="save-filter-name"
              value={props.currentFilter.name}
              onChange={props.changeFilterName}
              placeholder={translate('New Filter Name')}
            />
          </div>
        ),

        // Current Filter Summaries and Errors
        currentTeamSummary: props.currentFilter.teams.map(translate).join(', '),
        currentAssignmentSummary: translate(
          ASSIGNMENT_LABELS.get(props.currentFilter.assignments),
        ),
        currentStatusSummary: props.currentFilter.status
          .map(translate)
          .join(', '),
        currentDateRangeSummary: summarizeDateRange(
          props.currentFilter.dateRange,
        ),
        currentSortedBySummary: [
          translate(SORT_OPTIONS.getIn([props.currentFilter.sortBy, 'label'])),
          translate(
            SORT_DIRECTIONS.getIn([props.currentFilter.sortDirection, 'label']),
          ),
        ]
          .filter(Boolean)
          .join(' - '),
        currentCreatedByMeChecked: props.currentFilter.createdByMe,
        currentFilterName: props.currentFilter.name,

        dateRangeError: validateDateRange(props.currentFilter),
        filterNameError: validateFilterName(props.currentFilter, props.showing),
        validations: [validateDateRange, validateFilterName]
          .map(fn => fn(props.currentFilter, props.showing))
          .filter(v => v),
        messages: [validateDateRange, validateFilterName]
          .map(fn => fn(props.currentFilter, props.showing))
          .filter(v => v),
        saveMessages: [props.checkFilterName]
          .map(fn => fn(props.currentFilter))
          .filter(v => v),

        // Saved Filter Summaries
        teamSummary: props.filter.teams.map(translate).join(', '),
        assignmentSummary: translate(
          ASSIGNMENT_LABELS.get(props.filter.assignments),
        ),
        statusSummary: props.filter.status.map(translate).join(', '),
        dateRangeSummary: summarizeDateRange(props.filter.dateRange),
        sortedBySummary: translate(
          SORT_OPTIONS.getIn([props.filter.sortBy, 'label']) ||
            translate('Created At'),
        ),

        // Functions and Other Props
        toggleDirection: props.toggleDirection,
        showing: props.showing,
        toggleShowing: props.toggleShowing,
        dirty: !props.currentFilter.equals(props.filter),
        apply: props.applyFilter,
        reset: props.resetFilter,
        hasTeams: props.hasTeams,
        clearTeams: props.clearTeams,
        clearAssignments: props.clearAssignments,
        clearStatus: props.clearStatus,
        clearDateRange: props.clearDateRange,
        toggleCreatedByMe: props.toggleCreatedByMe,
        saveFilter: props.saveFilter,
        removeFilter: props.removeFilter,
        isOpen: props.isOpen,
        openFilterMenu: props.openFilterMenu,
        openNewItemMenu: props.openNewItemMenu,
      })
    }
  />
);

export const mapStateToProps = (state, props) => ({
  myFilters: state.queueApp.myFilters,
  currentFilter: state.filterMenu.get('currentFilter'),
  showing: state.filterMenu.get('activeSection'),
  isOpen: state.filterMenu.get('isOpen'),
  teams: state.queueApp.myTeams,
  hasTeams: state.queueApp.myTeams.size > 0,
  forms: state.queueApp.forms,
  location: state.app.location,
});

export const mapDispatchToProps = {
  open: actions.open,
  close: actions.close,
  show: actions.showSection,
  resetFilter: actions.reset,
  toggleTeam: actions.toggleTeam,
  toggleAssignment: actions.toggleAssignment,
  toggleCreatedByMe: actions.toggleCreatedByMe,
  toggleStatus: actions.toggleStatus,
  setDateRangeTimeline: actions.setDateRangeTimeline,
  setDateRange: actions.setDateRange,
  setSortedBy: actions.setSortedBy,
  setDirection: actions.setDirection,
  setFilterName: actions.setFilterName,
  push,
  setAdhocFilter: queueActions.setAdhocFilter,
  addPersonalFilter: appActions.addPersonalFilter,
  updatePersonalFilter: appActions.updatePersonalFilter,
  removePersonalFilter: appActions.removePersonalFilter,
  openNewItemMenu: queueActions.openNewItemMenu,
};

const toggleTeam = props => e => props.toggleTeam(e.target.name);
const toggleAssignment = props => e => props.toggleAssignment(e.target.value);
const toggleCreatedByMe = props => e =>
  props.toggleCreatedByMe(!props.currentFilter.createdByMe);
const toggleStatus = props => e => props.toggleStatus(e.target.name);
const changeTimeline = props => e => props.setDateRangeTimeline(e.target.value);
const changeSortedBy = props => e => props.setSortedBy(e.target.value);
const changeDirection = props => e => props.setDirection(e.target.value);
const changeFilterName = props => e => props.setFilterName(e.target.value);

const toggleShowing = props => (name, persistChanges = false) => () => {
  if (!persistChanges) {
    props.resetFilter();
  }
  props.show(props.showing === name ? null : name);
};

const applyFilter = props => filter => {
  props.close();
  props.setAdhocFilter(isImmutable(filter) ? filter : props.currentFilter);
  props.push(`${props.location}/adhoc`);
};
const clearTeams = props => () =>
  props.applyFilter(props.filter.delete('teams'));
const clearAssignments = props => () =>
  props.applyFilter(props.filter.delete('assignments'));
const clearStatus = props => () =>
  props.applyFilter(props.filter.set('status', List()));
const clearDateRange = props => () =>
  props.applyFilter(props.filter.delete('dateRange'));
const toggleDirection = props => () =>
  props.applyFilter(
    props.filter.update(
      'sortDirection',
      dir => (dir === 'ASC' ? 'DESC' : 'ASC'),
    ),
  );

const checkFilterName = props => filter => {
  if (props.myFilters.find(f => f.name === filter.name)) {
    return 'A filter with that name already exists and will be updated';
  }
};
const saveFilter = props => filter => {
  const currentFilter = isImmutable(filter) ? filter : props.currentFilter;
  if (props.myFilters.find(f => f.name === currentFilter.name)) {
    props.updatePersonalFilter(currentFilter.set('type', 'custom'));
  } else {
    props.addPersonalFilter(currentFilter.set('type', 'custom'));
  }
  props.push(
    `${props.location}/custom/${encodeURIComponent(currentFilter.name)}`,
  );
};

const removeFilter = props => filter => {
  props.removePersonalFilter(
    isImmutable(filter) ? filter : props.currentFilter,
  );
  props.push(`${props.location}/list/Mine`);
};

export const FilterMenuAbstract = compose(
  connect(
    mapStateToProps,
    mapDispatchToProps,
  ),
  withHandlers({ applyFilter }),
  withHandlers({
    toggleShowing,
    toggleTeam,
    toggleAssignment,
    toggleStatus,
    toggleCreatedByMe,
    changeTimeline,
    changeSortedBy,
    changeDirection,
    changeFilterName,
    toggleDirection,
    clearTeams,
    clearAssignments,
    clearStatus,
    clearDateRange,
    checkFilterName,
    saveFilter,
    removeFilter,
  }),
  lifecycle({
    componentDidMount() {
      this.props.open(this.props.filter);
    },
    componentDidUpdate(prevProps) {
      if (!this.props.filter.equals(prevProps.filter)) {
        this.props.open(this.props.filter);
      }
    },
  }),
)(FilterMenuAbstractComponent);

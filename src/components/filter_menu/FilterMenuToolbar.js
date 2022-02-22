import React, { Fragment, useState, useCallback } from 'react';
import {
  UncontrolledTooltip,
  Dropdown,
  DropdownToggle,
  DropdownMenu,
} from 'reactstrap';
import { FilterMenuAbstract } from './FilterMenuAbstract';
import { QueueListSidebar } from '../queue_list/QueueListSidebar';
import isarray from 'isarray';
import { I18n } from '@kineticdata/react';
import classNames from 'classnames';

export const Menu = props => {
  const toggle = props.toggleShowing(props.name);
  const id = `${props.name}-dropdown`;
  return (
    <Fragment>
      <Dropdown
        target={id}
        isOpen={props.showing === props.name}
        toggle={toggle}
        setActiveFromChild
      >
        {props.renderButton({ onClick: toggle, id })}

        <DropdownMenu className="filter-menu-dropdown">
          {(isarray(props.renderContent)
            ? props.renderContent
            : [props.renderContent]
          ).map((renderContentFn, index) => (
            <div
              className="filter-menu-dropdown__content"
              key={`content-${index}`}
            >
              {renderContentFn()}
            </div>
          ))}
          {(props.validations.length > 0 ||
            (props.messages && props.messages.length > 0)) && (
            <div className="filter-menu-dropdown__validations">
              {props.validations.map((validation, i) => (
                <p key={i} className="text-danger">
                  <small>
                    <I18n>{validation}</I18n>
                  </small>
                </p>
              ))}
              {props.messages &&
                props.messages.map((message, i) => (
                  <p key={i} className="text-info">
                    <small>
                      <I18n>{message}</I18n>
                    </small>
                  </p>
                ))}
            </div>
          )}
          <div className="filter-menu-dropdown__footer">
            <button className="btn btn-link" onClick={props.reset}>
              <I18n>{props.resetLabel || 'Reset'}</I18n>
            </button>
            <button
              className="btn btn-primary"
              onClick={props.apply}
              disabled={!props.dirty || props.validations.length > 0}
            >
              <I18n>{props.applyLabel || 'Apply'}</I18n>
            </button>
          </div>
        </DropdownMenu>
      </Dropdown>
    </Fragment>
  );
};

// Define some simple button components just to cleanup the toolbar component.
const MenuButton = props => (
  <DropdownToggle tag="button" className="btn btn-white" {...props} />
);
const ClearButton = props => {
  const disabled = typeof props.action === 'string';
  return (
    <Fragment>
      <button
        type="button"
        id={props.id}
        className={`btn btn-white ${disabled ? 'disabled' : ''}`}
        onClick={!disabled ? props.action : undefined}
        aria-label="Clear Filter"
      >
        <i className="fa fa-times" aria-hidden="true" />
      </button>
      {disabled && (
        <UncontrolledTooltip placement="right" target={props.id}>
          <I18n>{props.action}</I18n>
        </UncontrolledTooltip>
      )}
    </Fragment>
  );
};

const DirectionButton = props => {
  const icon = props.direction === 'ASC' ? 'asc' : 'desc';
  return (
    <Fragment>
      <button
        type="button"
        className={`btn btn-white`}
        onClick={props.action}
        aria-label={`Sort by ${icon}`}
      >
        <i className={`fa fa-sort-amount-${icon}`} aria-hidden="true" />
      </button>
    </Fragment>
  );
};

export const FilterMenuToolbar = ({ filter, refresh, showFilterMenu }) => {
  const [filtersDropdownOpen, setFiltersDropdownOpen] = useState(false);
  const toggleFiltersDropdown = useCallback(
    () => setFiltersDropdownOpen(open => !open),
    [setFiltersDropdownOpen],
  );

  return (
    <FilterMenuAbstract
      filter={filter}
      render={({
        dirty,
        validations,
        apply,
        reset,
        showing,
        toggleShowing,
        ...props
      }) => {
        const popoverProps = {
          dirty,
          apply,
          reset,
          showing,
          toggleShowing,
          validations,
        };
        return (
          <div className="queue-controls">
            <div className="queue-controls__heading">
              {showFilterMenu ? (
                <Dropdown
                  className="filters-dropdown"
                  isOpen={filtersDropdownOpen}
                  toggle={toggleFiltersDropdown}
                >
                  <DropdownToggle
                    caret
                    tag="button"
                    className={classNames({
                      edited: filter.type === 'adhoc' && filter.name,
                    })}
                  >
                    <I18n>
                      <span className="group">
                        <I18n>
                          {filter.type === 'default'
                            ? 'Default Filter'
                            : filter.type === 'team'
                              ? 'Team Filter'
                              : filter.type === 'custom'
                                ? 'My Filter'
                                : 'Adhoc Filter'}
                        </I18n>
                        {filter.name ? ': ' : ''}
                      </span>
                      <span className="name">{filter.name}</span>{' '}
                    </I18n>
                  </DropdownToggle>
                  <DropdownMenu className="">
                    <QueueListSidebar
                      showCreateNew={false}
                      onSidebarAction={toggleFiltersDropdown}
                    />
                  </DropdownMenu>
                </Dropdown>
              ) : (
                <h2
                  className={classNames({
                    edited: filter.type === 'adhoc' && filter.name,
                  })}
                >
                  <I18n>{filter.name || 'Adhoc'}</I18n>
                </h2>
              )}
              <div className="buttons ml-3">
                {filter.type === 'adhoc' && (
                  <Menu
                    name="save-filter"
                    {...popoverProps}
                    dirty={true}
                    apply={props.saveFilter}
                    applyLabel="Save"
                    reset={toggleShowing('save-filter')}
                    resetLabel="Cancel"
                    messages={props.saveMessages}
                    renderButton={btnProps => (
                      <MenuButton
                        {...btnProps}
                        className="btn btn-link text-primary"
                      >
                        <span className="icon">
                          <span className="fa fa-fw fa-bookmark-o text-primary" />
                        </span>
                        <span>
                          <I18n>Save Filter</I18n>
                        </span>
                      </MenuButton>
                    )}
                    renderContent={() => props.saveFilterOptions}
                  />
                )}
                {filter.type === 'custom' && (
                  <Menu
                    name="delete-filter"
                    {...popoverProps}
                    dirty={true}
                    apply={props.removeFilter}
                    applyLabel="Delete"
                    reset={toggleShowing('delete-filter')}
                    resetLabel="Cancel"
                    renderButton={btnProps => (
                      <MenuButton
                        {...btnProps}
                        className="btn btn-link text-danger"
                      >
                        <span className="icon">
                          <span className="fa fa-fw fa-trash-o text-danger" />
                        </span>
                        <span>
                          <I18n>Delete Filter</I18n>
                        </span>
                      </MenuButton>
                    )}
                    renderContent={() => (
                      <div>
                        <label>
                          <I18n>Are you sure?</I18n>
                        </label>
                      </div>
                    )}
                  />
                )}
              </div>
              <div className="buttons">
                <button
                  type="button"
                  className="btn btn-icon"
                  onClick={refresh}
                  aria-label="Refresh"
                >
                  <span className="icon">
                    <span className="fa fa-fw fa-refresh" />
                  </span>
                  <span>
                    <I18n>Refresh</I18n>
                  </span>
                </button>
                {showFilterMenu && (
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={props.openNewItemMenu}
                    aria-label="New Task"
                  >
                    <span className="fa fa-fw fa-plus" />
                    <span>
                      <I18n>New Task</I18n>
                    </span>
                  </button>
                )}
              </div>
            </div>
            <div className="queue-controls__filter">
              <div className="queue-filter-list">
                {props.hasTeams && (
                  <Menu
                    name="team"
                    {...popoverProps}
                    renderButton={btnProps =>
                      filter.teams.isEmpty() ? (
                        <MenuButton {...btnProps} caret>
                          <I18n>Any Team</I18n>
                        </MenuButton>
                      ) : (
                        <div className="btn-group">
                          <MenuButton {...btnProps} caret>
                            <I18n>Team</I18n>: {props.teamSummary}
                          </MenuButton>
                          <ClearButton action={props.clearTeams} />
                        </div>
                      )
                    }
                    renderContent={() => props.teamFilters}
                  />
                )}
                <I18n
                  render={translate => (
                    <Menu
                      name="assignment"
                      {...popoverProps}
                      renderButton={btnProps =>
                        !filter.assignments ? (
                          <MenuButton {...btnProps} caret>
                            {translate('Any Assignment')}
                            {filter.createdByMe &&
                              ` | ${translate('Created By Me')}`}
                          </MenuButton>
                        ) : (
                          <div className="btn-group">
                            <MenuButton {...btnProps} caret>
                              {translate('Assignment')}:{' '}
                              {props.assignmentSummary}
                              {filter.createdByMe &&
                                ` | ${translate('Created By Me')}`}
                            </MenuButton>
                          </div>
                        )
                      }
                      renderContent={[
                        () => props.assignmentFilters,
                        () => props.createdByMeFilter,
                      ]}
                    />
                  )}
                />
                <Menu
                  name="status"
                  {...popoverProps}
                  renderButton={btnProps =>
                    filter.status.isEmpty() ? (
                      <MenuButton {...btnProps} caret>
                        <I18n>Any Status</I18n>
                      </MenuButton>
                    ) : (
                      <div className="btn-group">
                        <MenuButton {...btnProps} caret>
                          <I18n>Status</I18n>: {props.statusSummary}
                        </MenuButton>
                        <ClearButton action={props.clearStatus} />
                      </div>
                    )
                  }
                  renderContent={() => props.statusFilters}
                />
                <Menu
                  name="date-range"
                  {...popoverProps}
                  renderButton={btnProps =>
                    !filter.dateRange.custom &&
                    filter.dateRange.preset === '' ? (
                      <MenuButton {...btnProps} caret>
                        <I18n>Any Date Range</I18n>
                      </MenuButton>
                    ) : (
                      <div className="btn-group">
                        <MenuButton {...btnProps} caret>
                          {props.dateRangeSummary}
                        </MenuButton>
                        <ClearButton
                          id="clearDateRange"
                          action={props.clearDateRange}
                        />
                      </div>
                    )
                  }
                  renderContent={() => props.dateRangeFilters}
                />
                <Menu
                  name="order-by"
                  {...popoverProps}
                  renderButton={btnProps => (
                    <div className="btn-group">
                      <MenuButton {...btnProps} caret>
                        <I18n>Sort by</I18n> {props.sortedBySummary}
                      </MenuButton>
                      <DirectionButton
                        action={props.toggleDirection}
                        direction={filter.sortDirection}
                      />
                    </div>
                  )}
                  renderContent={[
                    () => props.sortedByOptions,
                    () => props.sortDirectionOptions,
                  ]}
                />
              </div>
            </div>
          </div>
        );
      }}
    />
  );
};

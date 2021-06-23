import React, { useState } from 'react';
import { FilterMenuAbstract } from './FilterMenuAbstract';
import { Modal, ModalBody, ModalFooter } from 'reactstrap';
import { I18n } from '@kineticdata/react';
import { openConfirm } from '@kineticdata/bundle-common';

export const FilterMenuModal = ({ filter, refresh }) => {
  const [visible, setVisible] = useState(false);

  return (
    <I18n
      render={translate => (
        <FilterMenuAbstract
          filter={filter}
          render={({ ...props }) => {
            const toggleFilterModal = open => () => {
              setVisible(!!open);
              if (typeof open === 'string') {
                props.toggleShowing(open, true)();
              } else if (!!open) {
                props.toggleShowing(null, true)();
              } else {
                props.toggleShowing(null, false)();
              }
            };

            return (
              <div className="queue-controls">
                <div className="queue-controls__heading">
                  <h2
                    className={
                      filter.type === 'adhoc' && filter.name ? 'edited' : ''
                    }
                  >
                    <I18n>{filter.name || 'Adhoc'}</I18n>
                  </h2>
                  <div className="buttons ml-2">
                    {filter.type === 'adhoc' && (
                      <button
                        type="button"
                        className="btn btn-icon"
                        onClick={toggleFilterModal('save')}
                        aria-label="Save Filter"
                      >
                        <span className="icon" aria-hidden="true">
                          <span className="fa fa-fw fa-bookmark-o text-primary" />
                        </span>
                      </button>
                    )}
                    {filter.type === 'custom' && (
                      <button
                        type="button"
                        className="btn btn-icon"
                        onClick={() => {
                          openConfirm({
                            title: 'Delete Filter',
                            body: (
                              <span>
                                Are you sure you want to delete the{' '}
                                <strong>{filter.name}</strong> filter?
                              </span>
                            ),
                            actionName: 'Delete',
                            ok: props.removeFilter,
                          });
                        }}
                        aria-label="Delete Filter"
                      >
                        <span className="icon" aria-hidden="true">
                          <span className="fa fa-fw fa-trash-o text-danger" />
                        </span>
                      </button>
                    )}
                  </div>
                  <div className="buttons">
                    <button
                      type="button"
                      className="btn btn-icon"
                      onClick={toggleFilterModal(true)}
                      aria-label="Filter Menu"
                    >
                      <span
                        className={`fa fa-fw fa-sliders`}
                        aria-hidden="true"
                      />
                    </button>
                    <button
                      type="button"
                      className="btn btn-icon"
                      onClick={refresh}
                      aria-label="Refresh"
                    >
                      <span className="icon" aria-hidden="true">
                        <span className="fa fa-fw fa-refresh" />
                      </span>
                    </button>
                  </div>
                </div>
                <div className="queue-controls__summary">
                  <button
                    type="button"
                    className="btn btn-text"
                    onClick={toggleFilterModal(true)}
                  >
                    {[
                      filter.teams.isEmpty()
                        ? translate('Any Team')
                        : `${translate('Team')}: ${props.teamSummary}`,
                      ' \u00B7 ',
                      !filter.assignments
                        ? translate('Any Assignment')
                        : `${translate('Assignment')}: ${
                            props.assignmentSummary
                          }`,
                      ' \u00B7 ',
                      filter.createdByMe && [
                        translate('Created By Me'),
                        ' \u00B7 ',
                      ],
                      filter.status.isEmpty()
                        ? translate('Any Status')
                        : `${translate('Status')}: ${props.statusSummary}`,
                      ' \u00B7 ',
                      !filter.dateRange.custom && filter.dateRange.preset === ''
                        ? translate('Any Date Range')
                        : props.dateRangeSummary,
                      ' \u00B7 ',
                      `${translate('Sort by')} ${props.sortedBySummary}`,
                    ].filter(Boolean)}
                  </button>
                  <button
                    type="button"
                    className={`btn btn-icon`}
                    onClick={props.toggleDirection}
                    aria-label={`Sort Direction ${
                      filter.sortDirection === 'ASC'
                        ? 'Ascending'
                        : 'Descending'
                    }`}
                  >
                    <span
                      className={`fa fa-sort-amount-${
                        filter.sortDirection === 'ASC' ? 'asc' : 'desc'
                      }`}
                      aria-hidden="true"
                    />
                  </button>
                </div>

                <Modal
                  isOpen={visible}
                  toggle={toggleFilterModal(false)}
                  className="queue-controls__modal"
                >
                  <div className="modal-header">
                    <div className="modal-title">
                      <button
                        type="button"
                        className="btn btn-link"
                        onClick={toggleFilterModal(false)}
                      >
                        <I18n>Close</I18n>
                      </button>
                      <span>
                        <I18n>Filters</I18n>
                      </span>
                      {props.showing !== 'save' && (
                        <button
                          type="button"
                          className="btn btn-link"
                          disabled={!props.dirty}
                          onClick={props.reset}
                        >
                          <I18n>Reset</I18n>
                        </button>
                      )}
                    </div>
                    {!!props.showing && (
                      <button
                        type="button"
                        className="btn btn-link btn-back"
                        onClick={props.toggleShowing(
                          null,
                          props.showing !== 'save',
                        )}
                      >
                        <span className="icon">
                          <span className="fa fa-fw fa-angle-left" />
                        </span>
                        <I18n>Filters</I18n>
                      </button>
                    )}
                  </div>

                  {!props.showing && (
                    <ModalBody>
                      <ul className="list-group button-list">
                        {props.hasTeams && (
                          <FilterListItem
                            label="Teams"
                            summary={props.currentTeamSummary}
                            onClick={props.toggleShowing('teams', true)}
                          />
                        )}
                        <FilterListItem
                          label="Assignment"
                          summary={props.currentAssignmentSummary}
                          onClick={props.toggleShowing('assignment', true)}
                        />
                        <FilterListCheckbox
                          label="Created By Me"
                          checked={props.currentCreatedByMeChecked}
                          onClick={props.toggleCreatedByMe}
                        />
                        <FilterListItem
                          label="Status"
                          summary={props.currentStatusSummary}
                          onClick={props.toggleShowing('status', true)}
                        />
                        <FilterListItem
                          label="Date Range"
                          summary={props.currentDateRangeSummary}
                          error={props.dateRangeError}
                          onClick={props.toggleShowing('date', true)}
                        />
                        <FilterListItem
                          label="Sort By"
                          summary={props.currentSortedBySummary}
                          onClick={props.toggleShowing('sort', true)}
                        />
                      </ul>
                    </ModalBody>
                  )}

                  {props.showing === 'teams' && (
                    <ModalBody className="filter-section">
                      <FilterItemSection
                        label="Teams"
                        content={props.teamFilters}
                      />
                    </ModalBody>
                  )}
                  {props.showing === 'assignment' && (
                    <ModalBody className="filter-section">
                      <FilterItemSection
                        label="Assignment"
                        content={props.assignmentFilters}
                      />
                    </ModalBody>
                  )}
                  {props.showing === 'status' && (
                    <ModalBody className="filter-section">
                      <FilterItemSection
                        label="Status"
                        content={props.statusFilters}
                      />
                    </ModalBody>
                  )}
                  {props.showing === 'date' && (
                    <ModalBody className="filter-section">
                      <FilterItemSection
                        label="Date Range"
                        content={props.dateRangeFilters}
                        error={props.dateRangeError}
                      />
                    </ModalBody>
                  )}
                  {props.showing === 'sort' && (
                    <ModalBody className="filter-section">
                      <FilterItemSection
                        label="Sort By"
                        content={props.sortedByOptions}
                      />
                      <FilterItemSection
                        label="Direction"
                        content={props.sortDirectionOptions}
                      />
                    </ModalBody>
                  )}

                  {props.showing === 'save' && (
                    <ModalBody className="filter-section">
                      <FilterItemSection
                        label="Save Filter"
                        content={props.saveFilterOptions}
                        error={props.filterNameError}
                        messages={props.saveMessages}
                      />
                    </ModalBody>
                  )}

                  <ModalFooter>
                    {props.showing === 'save' ? (
                      <button
                        type="button"
                        className="btn btn-primary"
                        disabled={
                          !props.currentFilterName || props.filterNameError
                        }
                        onClick={() => {
                          props.saveFilter();
                          setVisible(false);
                        }}
                      >
                        <I18n>Save Filter</I18n>
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="btn btn-primary"
                        disabled={!props.dirty || props.dateRangeError}
                        onClick={() => {
                          props.apply();
                          setVisible(false);
                        }}
                      >
                        <I18n>Apply Filter</I18n>
                      </button>
                    )}
                  </ModalFooter>
                </Modal>
              </div>
            );
          }}
        />
      )}
    />
  );
};

const FilterListItem = ({ label, summary, onClick, error }) => (
  <li className="list-group-item">
    <button type="button" className="btn btn-link" onClick={onClick}>
      <span className="button-title">
        <I18n>{label}</I18n>
      </span>
      {error ? (
        <span className="summary text-danger">
          <I18n>{error}</I18n>
        </span>
      ) : (
        <span className="summary">{summary}</span>
      )}
      <span className="icon">
        <span className="fa fa-angle-right" />
      </span>
    </button>
  </li>
);

const FilterListCheckbox = ({ label, checked, onClick }) => (
  <li className="list-group-item">
    <button type="button" className="btn btn-link" onClick={onClick}>
      <span className="button-title">
        <I18n>{label}</I18n>
      </span>
      <span>
        <input
          type="checkbox"
          checked={checked}
          disabled
          style={{ pointerEvents: 'none' }}
        />
      </span>
    </button>
  </li>
);

const FilterItemSection = ({ label, content, error, messages }) => (
  <>
    <h5>
      <I18n>{label}</I18n>
      {error && (
        <small className="text-danger d-block">
          <I18n>{error}</I18n>
        </small>
      )}
      {messages &&
        messages.length > 0 && (
          <I18n
            render={translate =>
              messages.map((msg, i) => (
                <small key={`msg-${i}`} className="text-info d-block">
                  {translate(msg)}
                </small>
              ))
            }
          />
        )}
    </h5>
    {content}
  </>
);

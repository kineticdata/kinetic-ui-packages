import React from 'react';
import { compose, withHandlers, withProps, withState } from 'recompose';
import { connect } from '../../redux/store';
import { actions } from '../../redux/modules/queue';
import { Modal, ModalBody, ModalFooter, Progress } from 'reactstrap';
import { I18n } from '@kineticdata/react';

const BulkStatusModalComponent = ({
  status,
  toggle,
  label,
  progressValue,
  progressMax,
  keepSelection,
  handleKeepSelectionChange,
}) =>
  status.open ? (
    <Modal
      isOpen={true}
      toggle={toggle}
      size="lg"
      backdrop={status.completed ? undefined : 'static'}
      keyboard={status.completed}
    >
      <div className="modal-header">
        <div className="modal-title">
          <span>
            <I18n
              render={translate =>
                translate(
                  `${label} %d Selected Item${status.count > 1 ? 's' : ''}`,
                ).replace('%d', status.count)
              }
            />
          </span>
        </div>
      </div>
      <ModalBody className="px-3 py-4">
        {!status.completed ? (
          <>
            <div className="text-center h6">
              <I18n>In Progress...</I18n>
            </div>
            <Progress multi>
              <Progress
                animated
                bar
                value={status.success.length}
                max={status.count}
              />
              <Progress
                animated
                bar
                color="danger"
                value={status.error.length}
                max={status.count}
              />
            </Progress>
          </>
        ) : (
          <>
            <div className="text-center h6 mb-4">
              <span className="fa fa-fw fa-lg fa-check-circle ml-2 text-success" />
              {status.success.length === status.count ? (
                <I18n>All of the selected items were updated successfully.</I18n>
              ) : (
                <I18n
                  render={translate =>
                    translate(
                      `%d of the selected item${
                        status.success.length !== 1 ? 's' : ''
                      } updated successfully.`,
                    ).replace('%d', status.success.length)
                  }
                />
              )}
            </div>

            {status.error.length > 0 && (
              <div className="alert alert-danger alert-bar mb-4">
                <div className="text-center h6 mb-4">
                  <span className="fa fa-fw fa-lg fa-exclamation-triangle ml-2 text-danger" />
                  <I18n
                    render={translate =>
                      translate(
                        `%d of the selected item${
                          status.error.length > 1 ? 's' : ''
                        } failed to update.`,
                      ).replace('%d', status.error.length)
                    }
                  />
                </div>
                <table className="table table-sm table-striped">
                  <thead>
                    <tr>
                      <th>
                        <I18n>Handle</I18n>
                      </th>
                      <th>
                        <I18n>Form</I18n>
                      </th>
                      <th>
                        <I18n>Error</I18n>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {status.error.map(error => {
                      const item = status.items.find(
                        item => item.id === error.submissionId,
                      );
                      return (
                        <tr key={error.correlationId}>
                          <td>
                            <I18n>{item && item.handle}</I18n>
                          </td>
                          <td>
                            <I18n>{item && item.form.name}</I18n>
                          </td>
                          <td>
                            <I18n>{error.message}</I18n>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {status.error.length > 0 ||
            status.success.some(item => item.coreState === 'Draft') ? (
              <div className="form">
                <div className="form-group radio">
                  <label className="field-label">
                    <I18n>Update Selected Items When Done</I18n>
                  </label>
                  <label htmlFor="keep-selection-radio-1">
                    <input
                      type="radio"
                      name="keep-selection-radio-group"
                      id="keep-selection-radio-1"
                      value="none"
                      checked={keepSelection === 'none'}
                      onChange={handleKeepSelectionChange}
                    />
                    <I18n>Deselect All Items</I18n>
                  </label>
                  <label htmlFor="keep-selection-radio-2">
                    <input
                      type="radio"
                      name="keep-selection-radio-group"
                      id="keep-selection-radio-2"
                      value="all"
                      checked={keepSelection === 'all'}
                      onChange={handleKeepSelectionChange}
                    />
                    <I18n>Keep All Selected</I18n>
                  </label>
                  {status.success.length !== status.count &&
                    status.success.some(item => item.coreState === 'Draft') && (
                      <label htmlFor="keep-selection-radio-3">
                        <input
                          type="radio"
                          name="keep-selection-radio-group"
                          id="keep-selection-radio-3"
                          value="success"
                          checked={keepSelection === 'success'}
                          onChange={handleKeepSelectionChange}
                        />
                        <I18n>Select Only Successful Items</I18n>
                      </label>
                    )}
                  {status.error.length > 0 && (
                    <label htmlFor="keep-selection-radio-4">
                      <input
                        type="radio"
                        name="keep-selection-radio-group"
                        id="keep-selection-radio-4"
                        value="error"
                        checked={keepSelection === 'error'}
                        onChange={handleKeepSelectionChange}
                      />
                      <I18n>Select Only Failed Items</I18n>
                    </label>
                  )}
                  {status.success.some(item => item.coreState !== 'Draft') && (
                    <small className="text-muted">
                      <I18n>
                        Items that are now closed will be automatically
                        deselected.
                      </I18n>
                    </small>
                  )}
                </div>
              </div>
            ) : (
              <small className="text-muted">
                <I18n>
                  All items will be deselected because they are now all closed.
                </I18n>
              </small>
            )}
          </>
        )}
      </ModalBody>
      <ModalFooter>
        <button
          type="button"
          className="btn btn-primary"
          onClick={toggle}
          disabled={!status.completed}
        >
          <I18n>Done</I18n>
        </button>
      </ModalFooter>
    </Modal>
  ) : null;

const mapStateToProps = (state, props) => {
  return {
    status: state.queue.bulkStatus,
  };
};

const mapDispatchToProps = {
  bulkStatusReset: actions.bulkStatusReset,
  toggleSelectionMode: actions.toggleSelectionMode,
};

export const BulkStatusModal = compose(
  connect(
    mapStateToProps,
    mapDispatchToProps,
  ),
  withState('keepSelection', 'setKeepSelection', 'none'),
  withProps(props => ({
    label: props.status.type === 'assign' ? 'Assigning' : 'Working',
  })),
  withHandlers({
    handleKeepSelectionChange: props => e =>
      props.setKeepSelection(e.target.value),
    toggle: props => () => {
      const itemsToKeep = [
        // All successful items that are still open
        ...(['all', 'success'].includes(props.keepSelection)
          ? props.status.success.filter(item => item.coreState === 'Draft')
          : []),
        // All failed items
        ...(['all', 'error'].includes(props.keepSelection)
          ? props.status.items.filter(item =>
              props.status.error.find(
                error => error.submissionId === item.id,
              ),
            )
          : []),
      ];

      props.bulkStatusReset();
      props.toggleSelectionMode(true, itemsToKeep);
      props.refresh();
    },
  }),
)(BulkStatusModalComponent);

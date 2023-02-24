import React from 'react';
import { compose, withHandlers, withProps, withState } from 'recompose';
import { connect } from '../../redux/store';
import { Modal, ModalBody, ModalFooter } from 'reactstrap';
import { CoreForm, I18n } from '@kineticdata/react';
import { Map } from 'immutable';

const BulkWorkModalComponent = props => (
  <Modal isOpen={true} toggle={props.toggle} size="lg">
    <div className="modal-header">
      <div className="modal-title">
        <button type="button" className="btn btn-link" onClick={props.toggle}>
          <I18n>Close</I18n>
        </button>
        <span>
          <I18n
            render={translate =>
              translate(
                `Work %d Selected Item${props.items.size > 1 ? 's' : ''}`,
              ).replace('%d', props.items.size)
            }
          />
        </span>
      </div>
    </div>
    <ModalBody>
      <I18n context={`kapps.${props.kapp.slug}.forms.${props.formSlug}`}>
        <CoreForm
          kapp={props.kapp.slug}
          form={props.formSlug}
          onLoaded={props.handleLoaded}
          values={{ 'Bulk Action': 'Yes' }}
        />
      </I18n>
    </ModalBody>
    <ModalFooter>
      <button
        type="button"
        className="btn btn-primary"
        onClick={props.submitWork}
      >
        <I18n
          render={translate =>
            translate(
              `Update %d Item${props.items.size > 1 ? 's' : ''}`,
            ).replace('%d', props.items.size)
          }
        />
      </button>
    </ModalFooter>
  </Modal>
);

const mapStateToProps = (state, props) => {
  return {
    kapp: state.app.kapp,
    items: state.queue.selectedList,
    forms: state.queueApp.forms,
  };
};

export const BulkWorkModal = compose(
  connect(mapStateToProps),
  withProps(props => {
    return {
      formSlug: props.items.size > 0 ? props.items.first().form.slug : null,
    };
  }),
  withState('kineticForm', 'setKineticForm', null),
  withHandlers({
    handleLoaded: props => form => props.setKineticForm(form),
    submitWork: props => () => {
      if (Object.keys(props.kineticForm.validate()).length > 0) {
        props.kineticForm.submitPage();
      } else {
        props.handleSubmit(
          Map(props.kineticForm.serialize())
            .filter((value, name) => value && value.length > 0)
            .toJS(),
        );
      }
    },
  }),
)(BulkWorkModalComponent);

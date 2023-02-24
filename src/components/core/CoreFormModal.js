import React, { Component } from 'react';
import { CoreForm } from './CoreForm';
import { CoreModal, CoreModalBody, CoreModalHeader } from './CoreModal';

const MODAL_PROPS = ['dismissed', 'size'];
const FORM_PROPS = [
  'created',
  'updated',
  'completed',
  'form',
  'kapp',
  'submission',
  'review',
  'error',
  'unauthorized',
  'forbidden',
  'notFound',
];

export class CoreFormModal extends Component {
  constructor(props) {
    super(props);
    this.state = { visible: false, title: '' };
    this.modalProps = {};
    MODAL_PROPS.forEach(prop => {
      this.modalProps[prop] = this.props[prop];
    });
    this.formProps = {};
    FORM_PROPS.forEach(prop => {
      this.formProps[prop] = this.props[prop];
    });
    this.onFormLoaded = this.onFormLoaded.bind(this);
  }

  onFormLoaded(form) {
    this.setState({
      visible: true,
      title: form.name(),
    });
    if (typeof this.props.loaded === 'function') {
      this.props.loaded(form);
    }
  }

  render() {
    return (
      <CoreModal {...this.modalProps} visible={this.state.visible}>
        <CoreModalHeader>
          <h1>{this.state.title}</h1>
        </CoreModalHeader>
        <CoreModalBody>
          <CoreForm {...this.formProps} loaded={this.onFormLoaded} />
        </CoreModalBody>
      </CoreModal>
    );
  }
}

/* eslint-disable jsx-a11y/no-static-element-interactions */
import React, { Component } from 'react';
import ReactDOM from 'react-dom';

export const CoreModalHeader = props => (
  <div className="kd-modal-header">{props.children}</div>
);

export const CoreModalBody = props => (
  <div className="kd-modal-body">{props.children}</div>
);

export const CoreModalFooter = props => (
  <div className="kd-modal-footer">{props.children}</div>
);

const sizes = {
  sm: '30%',
  md: '50%',
  lg: '80%',
};

export class CoreModal extends Component {
  constructor(props) {
    super(props);
    this.dismiss = this.dismiss.bind(this);
    this.keyupHandler = this.keyupHandler.bind(this);
  }

  componentDidMount() {
    this.modalTarget = document.createElement('div');
    document.body.appendChild(this.modalTarget);
    document.addEventListener('keyup', this.keyupHandler);
    this.myRender();
  }

  componentDidUpdate() {
    this.myRender();
  }

  componentWillUnmount() {
    ReactDOM.unmountComponentAtNode(this.modalTarget);
    document.body.removeChild(this.modalTarget);
    document.removeEventListener('keyup', this.keyupHandler);
  }

  dismiss() {
    if (typeof this.props.dismissed === 'function' && this.props.visible) {
      this.props.dismissed();
    }
  }

  keyupHandler(event) {
    // Call dismiss if the escape key was pressed.
    if (event.keyCode === 27) {
      this.dismiss();
    }
  }

  myRender() {
    ReactDOM.render(
      <div
        className="kd-modal-backdrop"
        onClick={this.dismiss}
        style={this.props.visible ? {} : { display: 'none' }}
      >
        <div
          className="kd-modal-content"
          onClick={event => event.stopPropagation()}
          style={{ width: sizes[this.props.size] || '80%' }}
        >
          {this.props.children}
        </div>
      </div>,
      this.modalTarget,
    );
  }

  render() {
    return <noscript />;
  }
}

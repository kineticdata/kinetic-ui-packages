import React, { Component } from 'react';

export class TextMultiField extends Component {
  onEdit = index => event => {
    this.props.onChange(
      event.target.value
        ? this.props.value.set(index, event.target.value)
        : this.props.value.delete(index),
    );
  };

  onAdd = event => {
    this.props.onChange(this.props.value.push(event.target.value));
  };

  onRemove = index => () => {
    this.props.onChange(this.props.value.delete(index));
  };

  // When rendering the inputs we append an empty string to the list of values,
  // this is helpful because then the "new" input is in the keyed collection so
  // when text is entered there we get a smooth addition of another new input.
  render() {
    return (
      this.props.visible && (
        <div className="field">
          <h5>{this.props.label}</h5>
          {this.props.value.push('').map((selection, i) => (
            <div key={i}>
              <input
                type="text"
                onBlur={this.props.onBlur}
                onChange={selection ? this.onEdit(i) : this.onAdd}
                onFocus={this.props.onFocus}
                placeholder={this.props.placeholder}
                value={selection}
              />
              {selection && (
                <button
                  type="button"
                  onFocus={this.props.onFocus}
                  onBlur={this.props.onBlur}
                  onClick={this.onRemove(i)}
                >
                  &times;
                </button>
              )}
            </div>
          ))}
        </div>
      )
    );
  }
}

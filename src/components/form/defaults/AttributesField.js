import React, { Component, Fragment } from 'react';
import { List, Map, Repeat } from 'immutable';

export class AttributesField extends Component {
  constructor(props) {
    super(props);
    this.state = { added: List(), adding: '' };
  }

  // returns the number of attribute values that were previously set
  countPrevious = name =>
    this.props.value.get(name).size - this.countAdded(name);

  // returns the number of attribute values that have been added
  countAdded = name => this.state.added.filter(n => n === name).size;

  onRemove = (name, index) => () => {
    const addedIndex = index - this.countPrevious(name);
    if (addedIndex >= 0) {
      this.setState(state => ({
        added: filterWithOccurrences(
          state.added,
          (n, i) => n !== name || i !== addedIndex,
        ),
      }));
    }
    this.props.onChange(this.props.value.deleteIn([name, index]));
  };

  onInputChange = (name, index) => event => {
    const value = event.target.value;
    if (!this.props.value.hasIn([name, index])) {
      this.setState(state => ({
        added: state.added.push(state.adding),
        adding: '',
      }));
    }
    this.props.onChange(
      this.props.value.update(name, List(), values => values.set(index, value)),
    );
  };

  onSelectChange = event => {
    this.setState({ adding: event.target.value });
  };

  render() {
    const attributes = mapWithOccurrences(
      this.props.value
        .keySeq()
        .sort()
        .flatMap(name => Repeat(name, this.countPrevious(name)))
        .concat(this.state.added.push(this.state.adding)),
      (name, index) => ({
        name,
        index,
        value: this.props.value.getIn([name, index], ''),
      }),
    );
    return (
      this.props.visible && (
        <Fragment>
          <h5>{this.props.label}</h5>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Value</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {attributes.size === 1 && this.props.placeholder && (
                <tr>
                  <td colSpan={3}>
                    <em>{this.props.placeholder}</em>
                  </td>
                </tr>
              )}
              {attributes.map(({ name, value, index }, i) => (
                <tr key={i}>
                  <td>
                    {i < attributes.size - 1 ? (
                      name
                    ) : (
                      <select onChange={this.onSelectChange} value={name}>
                        <option hidden />
                        {availableAttributes(
                          this.props.options,
                          this.props.value,
                        ).map(option => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    )}
                  </td>
                  <td>
                    <input
                      type="text"
                      value={value}
                      onFocus={this.props.onFocus}
                      onBlur={this.props.onBlur}
                      onChange={this.onInputChange(name, index)}
                    />
                  </td>
                  <td>
                    {i < attributes.size - 1 && (
                      <button
                        type="button"
                        onFocus={this.props.onFocus}
                        onBlur={this.props.onBlur}
                        onClick={this.onRemove(name, index)}
                      >
                        &times;
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Fragment>
      )
    );
  }
}

// Helper function that maps for a List but instead of providing the index in
// the overall list, it gives the lambda the count of the occurrences of current
// value that have already occurred in the list.
// For example: ['red', 'green', ''red',]
// Would call: ['red,' 0], ['green', 0], ['red', 1], ['blue', 0]
const mapWithOccurrences = (list, mapper) =>
  list.reduce(
    ([result, counts], current) => [
      result.push(mapper(current, counts.get(current, 0))),
      counts.update(current, 0, count => count + 1),
    ],
    [List(), Map()],
  )[0];

// Same idea as mapWithOccurrences above.
const filterWithOccurrences = (list, pred) =>
  list.reduce(
    ([result, counts], current) => [
      pred(current, counts.get(current, 0)) ? result.push(current) : result,
      counts.update(current, 0, count => count + 1),
    ],
    [List(), Map()],
  )[0];

const availableAttributes = (options, value) =>
  options
    .filter(
      option =>
        option.get('allowsMultiple') ||
        value.get(option.get('name'), List()).isEmpty(),
    )
    .map(option => option.get('name'));

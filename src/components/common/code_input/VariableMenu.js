import React, { Component } from 'react';
import classNames from 'classnames';

export class VariableMenu extends Component {
  constructor(props) {
    super(props);
    this.state = { position: null };
  }

  componentDidMount() {
    this.setPosition();
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    this.setPosition();
  }

  setPosition() {
    const el = document.getElementById(this.props.target);
    if (el !== this.state.el) {
      const { x, y, height } = el.getBoundingClientRect();
      this.setState({ position: { left: x, top: y + height }, el });
    }
  }

  render() {
    const { onSelect, options, active } = this.props;
    const { top, left } = this.state.position || {};
    return (
      !!top && (
        <div
          style={{ position: 'fixed', left, top }}
          className="variable-typeahead-menu"
          contentEditable={false}
        >
          <ul>
            {options.map(({ label, children, value, tags }, i) => (
              <li
                className={classNames({ active: i === active })}
                key={label}
                onClick={onSelect(label, value)}
                style={{ userSelect: 'none', MozUserSelect: 'none' }}
              >
                <span>{label}</span>
                <span className="tags">
                  {tags &&
                    tags.map((tag, i) => (
                      <span key={i} className="tag">
                        {tag}
                      </span>
                    ))}
                </span>
                {children && <i className="fa fa-chevron-right"></i>}
              </li>
            ))}
          </ul>
        </div>
      )
    );
  }
}

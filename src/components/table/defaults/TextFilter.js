import React from 'react';
import { I18n } from '../../core/i18n/I18n';

const TextFilter = ({ value, name, title, label, onChange }) => (
  <div>
    <label htmlFor={`filter-input-${name}`}>
      <I18n>{title || label}</I18n>:
    </label>

    <input
      type="text"
      name="filter-input"
      id={`filter-input-${name}`}
      value={value}
      onChange={e => onChange(e.target.value)}
    />
  </div>
);

export default TextFilter;

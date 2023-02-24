import React from 'react';
import { I18n } from '../../core/i18n/I18n';

const BooleanFilter = ({ value, name, title, onChange }) => (
  <div>
    <label htmlFor={`filter-input-${name}`}>
      <I18n>{title}</I18n>:
    </label>

    <select
      type="text"
      name="filter-input"
      id={`filter-input-${name}`}
      value={value}
      onChange={e => onChange(e.target.value)}
    >
      <option />
      <option value="true">Yes</option>
      <option value="false">No</option>
    </select>
  </div>
);

export default BooleanFilter;

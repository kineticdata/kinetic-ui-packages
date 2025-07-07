import React from 'react';

const FilterControl = ({ filterFields }) => (
  <div>
    {filterFields?.map(field => (
      <div className="field">
        <input
          type="checkbox"
          id={`filter-toggle-${field.get('name')}`}
          checked={field.get('checked')}
          onChange={field.get('toggle')}
        />
        <label htmlFor={`filter-toggle-${field.get('name')}`}>
          {field.get('label')}
        </label>
      </div>
    ))}
  </div>
);

export default FilterControl;

import React from 'react';

const ColumnControl = ({ columns }) => (
  <div>
    {columns.map(column => (
      <div className="field">
        <input
          type="checkbox"
          id={`column-${column.get('value')}`}
          checked={column.get('checked')}
          disabled={!column.get('enabled')}
          onChange={column.get('toggle')}
        />
        <label htmlFor={`column-${column.get('value')}`}>
          {column.get('label')}
        </label>
      </div>
    ))}
  </div>
);

export default ColumnControl;

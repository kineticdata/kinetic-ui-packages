import React, { Fragment } from 'react';

const FilterLayout = ({
  filters,
  validFilters,
  onSearch,
  columnSet,
  loading,
  initializing,
}) => (
  <form onSubmit={onSearch}>
    {filters
      .filter((_filter, name) => columnSet.includes(name))
      .map((filter, name) => <Fragment key={name}>{filter}</Fragment>)
      .toIndexedSeq()
      .toList()}
    <button type="submit">Search</button>
  </form>
);

export default FilterLayout;

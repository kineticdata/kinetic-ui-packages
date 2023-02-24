import React from 'react';
import t from 'prop-types';

const Header = ({ headerRow }) => <thead>{headerRow}</thead>;

Header.propTypes = {
  /** A flag that signifies if sorting is enabled or disabled. */
  sortable: t.bool,
  /** Contains the rendered header row component. */
  headerRow: t.object,
};

export default Header;

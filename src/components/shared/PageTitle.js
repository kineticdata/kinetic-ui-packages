import React from 'react';
import { Link } from '@reach/router';
import { connect } from '../../redux/store';
import { compose, withProps } from 'recompose';
import { PageTitle as CommonPageTitle } from '@kineticdata/bundle-common';

export const mapStateToProps = state => ({
  space: state.app.space,
});

export const PageTitle = compose(
  connect(mapStateToProps),
  withProps(({ parts = [], ...props }) => ({
    parts: parts.concat([['Settings'].filter(Boolean).join(' ')]),
  })),
)(props => <CommonPageTitle {...props} components={{ Link }} />);

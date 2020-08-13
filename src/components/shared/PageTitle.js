import { connect } from '../../redux/store';
import { compose, withProps } from 'recompose';
import { PageTitle as CommonPageTitle } from '@kineticdata/bundle-common';

export const mapStateToProps = state => ({
  space: state.app.space,
});

export const PageTitle = compose(
  connect(mapStateToProps),
  withProps(({ parts = [], ...props }) => {
    return {
      parts: parts.concat(['Settings', props.space && props.space.name]),
    };
  }),
)(CommonPageTitle);

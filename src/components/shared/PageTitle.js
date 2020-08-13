import { connect } from '../../redux/store';
import { compose, withProps } from 'recompose';
import {
  PageTitle as CommonPageTitle,
  selectCurrentKapp,
} from '@kineticdata/bundle-common';

export const mapStateToProps = state => ({
  space: state.app.space,
  kapp: selectCurrentKapp(state),
});

export const PageTitle = compose(
  connect(mapStateToProps),
  withProps(({ parts = [], ...props }) => ({
    parts: parts.concat([
      [props.kapp && props.kapp.name, props.settings && 'Settings']
        .filter(Boolean)
        .join(' '),
      props.space && props.space.name,
    ]),
  })),
)(CommonPageTitle);

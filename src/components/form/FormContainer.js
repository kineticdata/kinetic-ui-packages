import { compose, withHandlers, withState } from 'recompose';
import { parse } from 'query-string';
import { Form } from './Form';
import { actions } from '../../redux/modules/submission';
import { connect } from '../../redux/store';
import { addToast, refetchActivityFeed } from '@kineticdata/bundle-common';
import { requestFeedKey } from '../../App';

const valuesFromQueryParams = queryParams => {
  const params = parse(queryParams);
  return Object.entries(params).reduce((values, [key, value]) => {
    if (key.startsWith('values[')) {
      const vk = key.match(/values\[(.*?)\]/)[1];
      return { ...values, [vk]: value };
    }
    return values;
  }, {});
};

export const handleCompleted = props => response => {
  if (props.authenticated) {
    // Check if either currentPage is null (pre form consolidation) or
    // displayedPage.type is not 'confirmation' (post form-consolidation)
    // to determine that there is no confirmation page and we should redirect.
    if (
      !response.submission.currentPage ||
      (response.submission.displayedPage &&
        response.submission.displayedPage.type !== 'confirmation')
    ) {
      props.navigate(
        `${props.appLocation}/requests/request/${
          response.submission.id
        }/confirmation`,
      );
    } else {
      props.setPage(response.submission.currentPage);
    }
    refetchActivityFeed(requestFeedKey);
  }
};

export const handleCreated = props => response => {
  if (
    response.submission.coreState !== 'Submitted' &&
    props.page === response.submission.currentPage
  ) {
    addToast('Form saved successfully');
  } else {
    props.setPage(response.submission.currentPage);
  }
  // Redirect to route with submission id if submission is not submitted or
  // there is a confirmation page to render, defined as currentPage is set and
  // displayedPage is undefined (pre form consolidation) or displayedPage.type
  // is 'confirmation' (post form-consolidation).
  if (
    response.submission.coreState !== 'Submitted' ||
    (response.submission.currentPage &&
      (!response.submission.displayedPage ||
        response.submission.displayedPage.type === 'confirmation'))
  ) {
    props.navigate(response.submission.id);
  }
};

export const handleUpdated = props => response => {
  if (
    response.submission.coreState !== 'Submitted' &&
    props.page === response.submission.currentPage
  ) {
    addToast('Form saved successfully');
  } else {
    props.setPage(response.submission.currentPage);
  }
};

export const handleUnauthorized = props => response => {
  if (!props.authenticated) {
    props.navigate(props.authRoute);
  }
};

export const handleLoaded = props => form => {
  props.setForm({
    slug: form.slug(),
    name: form.name(),
    description: form.description(),
  });
  props.setPage(form.page().name());
};

export const handleDelete = props => () => {
  const deleteCallback = () => {
    refetchActivityFeed(requestFeedKey);
    props.navigate(props.appLocation);
  };
  props.deleteSubmission({ id: props.submissionId, callback: deleteCallback });
};

export const mapStateToProps = (state, { categorySlug }) => ({
  category: state.servicesApp.categoryGetter(categorySlug),
  forms: state.forms.data,
  values: valuesFromQueryParams(state.router.location.search),
  kappSlug: state.app.kappSlug,
  appLocation: state.app.location,
  authenticated: state.app.authenticated,
  authRoute: state.app.authRoute,
});

export const mapDispatchToProps = {
  deleteSubmission: actions.deleteSubmissionRequest,
};

const enhance = compose(
  connect(
    mapStateToProps,
    mapDispatchToProps,
  ),
  withState('form', 'setForm', props => props.form),
  withState('page', 'setPage', ''),
  withHandlers({
    handleCompleted,
    handleCreated,
    handleUpdated,
    handleLoaded,
    handleDelete,
    handleUnauthorized,
  }),
);

export const FormContainer = enhance(Form);

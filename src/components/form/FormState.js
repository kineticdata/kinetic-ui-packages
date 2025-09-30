import { connect, store } from '../../store';

const selectFormState = formState => ({
  dirty: formState?.fields?.some(field => field.dirty),
  error: formState?.error,
});

const mapStateToProps = (state, props) => ({
  formState: state.getIn(['forms', props.formKey]),
});

const FormStateComopnent = props =>
  props.children((props.selector || selectFormState)(props.formState));

const FormState = connect(mapStateToProps)(FormStateComopnent);

FormState.get = formKey =>
  selectFormState(store.getState()?.getIn(['forms', formKey]));

export { FormState };

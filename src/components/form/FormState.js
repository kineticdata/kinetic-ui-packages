import { connect } from '../../store';

const selectFormState = formState => ({
  dirty: formState.fields.some(field => field.dirty),
  error: formState.error,
});

const mapStateToProps = (state, props) => ({
  formState: state.getIn(['forms', props.formKey], null),
});

const FormStateComopnent = props =>
  props.formState && props.children(selectFormState(props.formState));

export const FormState = connect(mapStateToProps)(FormStateComopnent);

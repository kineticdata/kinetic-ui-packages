import React, { Component, createRef } from 'react';
import t from 'prop-types';
import { call, select, takeEvery } from 'redux-saga/effects';
import { List, Map } from 'immutable';
import { connect, dispatch, regHandlers, regSaga } from '../../store';
import { ComponentConfigContext } from '../common/ComponentConfigContext';
import { generateKey } from '../../helpers';
import {
  createFormState,
  evaluateFields,
  getComponentName,
  getFieldComponentProps,
  getFieldComponents,
} from './SimpleForm.helpers';

const resetFields = fields =>
  fields.map(field => field.merge({ touched: false }));

regHandlers({
  MOUNT_SIMPLE_FORM: (state, { payload: { formKey } }) =>
    state.setIn(['forms', formKey], null),
  UNMOUNT_SIMPLE_FORM: (state, { payload: { formKey } }) =>
    state.deleteIn(['forms', formKey]),
  CONFIGURE_SIMPLE_FORM: (state, { payload }) =>
    state.getIn(['forms', payload.formKey]) !== null
      ? state.setIn(['forms', payload.formKey, 'callOnLoad'], false)
      : state.setIn(['forms', payload.formKey], createFormState(payload)),
  SIMPLE_FORM_FOCUS_FIELD: (state, { payload: { formKey, name } }) =>
    state.setIn(['forms', formKey, 'fields', name, 'focused'], true),
  SIMPLE_FORM_BLUR_FIELD: (state, { payload: { formKey, name } }) =>
    state.mergeIn(['forms', formKey, 'fields', name], {
      changed: false,
      focused: false,
      touched: true,
    }),
  SIMPLE_FORM_CHANGE_FIELD: (state, { payload: { formKey, name } }) =>
    state.mergeIn(['forms', formKey, 'fields', name], {
      changed: true,
      touched: true,
    }),
  SIMPLE_FORM_RESET: (state, { payload: { formKey, values } }) =>
    !!state.getIn(['forms', formKey])
      ? state
          .updateIn(['forms', formKey, 'fields'], resetFields)
          .updateIn(
            ['forms', formKey, 'initialValues'],
            initialValues => values || initialValues,
          )
      : state,
});

const selectForm = formKey => state => state.getIn(['forms', formKey]);
const selectField = (formKey, fieldName) => state =>
  state.getIn(['forms', formKey, 'fields', fieldName]);

regSaga(
  takeEvery('CONFIGURE_SIMPLE_FORM', function*({ payload: { formKey } }) {
    const formState = yield select(selectForm(formKey));
    if (
      formState &&
      formState.callOnLoad &&
      typeof formState.onLoad === 'function'
    ) {
      yield call(formState.onLoad);
    }
  }),
);

regSaga(
  takeEvery('SIMPLE_FORM_FOCUS_FIELD', function*({
    payload: { formKey, name, bindings },
  }) {
    const { onFocus } = yield select(selectField(formKey, name));
    if (typeof onFocus === 'function') {
      onFocus(bindings);
    }
  }),
);

regSaga(
  takeEvery('SIMPLE_FORM_CHANGE_FIELD', function*({
    payload: { formKey, name, value, bindings },
  }) {
    const { onChange } = yield select(selectField(formKey, name));
    if (typeof onChange === 'function') {
      onChange(value, bindings);
    } else {
      console.error('Field is missing onChange event:', name);
    }
  }),
);

regSaga(
  takeEvery('SIMPLE_FORM_BLUR_FIELD', function*({
    payload: { formKey, name, bindings },
  }) {
    const { onBlur } = yield select(selectField(formKey, name));
    if (typeof onBlur === 'function') {
      onBlur(bindings);
    }
  }),
);

export const onFocus = ({ formKey, name }) => bindings => () => {
  dispatch('SIMPLE_FORM_FOCUS_FIELD', { formKey, name, bindings });
};

export const onBlur = ({ formKey, name }) => bindings => () => {
  dispatch('SIMPLE_FORM_BLUR_FIELD', { formKey, name, bindings });
};

export const onChange = ({ formKey, type, name }) => bindings => event => {
  let value;
  if (type === 'checkbox' && event && event.target) {
    value = event.target.checked;
  } else if (type === 'checkbox-multi') {
    value = event.target.value;
  } else if (
    type === 'select-multi' &&
    event &&
    event.target &&
    event.target.options
  ) {
    value = List(event.target.options)
      .filter(o => o.selected)
      .map(o => o.value);
  } else if (event && event.target) {
    value = event.target.value;
  } else {
    value = event;
  }

  dispatch('SIMPLE_FORM_CHANGE_FIELD', { formKey, name, value, bindings });
};

export const mountSimpleForm = formKey =>
  dispatch('MOUNT_SIMPLE_FORM', { formKey });

export const unmountSimpleForm = formKey =>
  dispatch('UNMOUNT_SIMPLE_FORM', { formKey });

export const configureSimpleForm = config =>
  dispatch('CONFIGURE_SIMPLE_FORM', config);

export const resetSimpleForm = (formKey, values) => {
  dispatch('SIMPLE_FORM_RESET', { formKey, values });
};

// Wraps the FormImpl to handle the formKey behavior. If this is passed a
// formKey prop this wrapper is essentially a noop, but if it is not passed a
// formKey then it generates one and stores it as component state and passes
// that to FormImpl. When it generates its own form key it then mounts/unmounts
// the form state in its lifecycle methods. Note that we need a second component
// to do this because we need to use the form key in the mapStateToProps of the
// wrapped component.

/**
 * @component
 */
export class SimpleForm extends Component {
  constructor(props) {
    super(props);
    this.auto = !this.props.formKey || this.props.uncontrolled;
    this.formKey = this.props.formKey || 'f' + generateKey();
  }

  componentDidMount() {
    if (this.auto) {
      mountSimpleForm(this.formKey);
    }
  }

  componentWillUnmount() {
    if (this.auto) {
      unmountSimpleForm(this.formKey);
    }
  }

  render() {
    const { components, ...props } = this.props;
    return (
      <ComponentConfigContext.Consumer>
        {config => (
          <SimpleFormImpl
            {...props}
            formKey={this.auto ? this.formKey : this.props.formKey}
            components={config.merge(Map(components).filter(c => !!c))}
          />
        )}
      </ComponentConfigContext.Consumer>
    );
  }
}

class SimpleFormImplComponent extends Component {
  focusRef = createRef();

  checkConfigure() {
    if (this.props.formState === null) {
      configureSimpleForm(this.props);
    }
  }

  componentDidMount() {
    this.checkConfigure();
    // if the form was mounted then hidden (by being unrendered) its possible
    // that when its shown again the fields will already be ready to render so
    // we need to check focus on mount as well
    if (
      this.props.formState &&
      this.props.formState.fields &&
      this.focusRef.current
    ) {
      this.focusRef.current.focus();
    }
  }

  componentDidUpdate(prevProps) {
    this.checkConfigure();
    // after the first render where fields should be rendered, check to see if
    // we should focus a field (based on the autoFocus prop passed to the Form)
    if (
      this.props.formState &&
      this.props.formState.fields &&
      !(prevProps.formState && prevProps.formState.fields) &&
      this.focusRef.current
    ) {
      this.focusRef.current.focus();
    }
    // else if the autoFocus prop has been changed we will also focus the new
    // resulting focus element
    else if (
      this.props.autoFocus !== prevProps.autoFocus &&
      this.focusRef.current
    ) {
      this.focusRef.current.focus();
    }
  }

  onReset = () =>
    typeof this.props.onReset === 'function'
      ? e => this.props.onReset(e, { formKey: this.props.formKey })
      : undefined;

  onSubmit = () =>
    typeof this.props.onSubmit === 'function'
      ? e => this.props.onSubmit(e, { formKey: this.props.formKey })
      : undefined;

  render() {
    const {
      autoFocus,
      bindings: passThroughBindings = {},
      components,
      error,
      fields: fieldsOrig,
      formKey,
      formState,
      readOnly,
      validateOnLoad,
      values,
    } = this.props;
    const initialized = formState ? !!formState.fields : false;
    let form = null;
    if (initialized) {
      const { FormButtons, FormError, FormLayout } = components.toObject();
      const { fields, initialValues } = formState;
      const bindings = { ...passThroughBindings, values, initialValues };
      const evaluatedFields = evaluateFields(fields, bindings, validateOnLoad);
      const dirty = evaluatedFields.some(field => field.dirty);
      const fieldComponents = getFieldComponents(fieldsOrig);
      form = (
        <FormLayout
          formKey={formKey}
          fields={evaluatedFields.mapEntries(([name, field], index) => {
            const FieldImpl =
              fieldComponents.get(name) ||
              components.get(getComponentName(field), null);
            return [
              name,
              FieldImpl ? (
                <FieldImpl
                  key={name}
                  focusRef={
                    name === autoFocus || index === autoFocus
                      ? this.focusRef
                      : null
                  }
                  {...getFieldComponentProps(field, readOnly)}
                />
              ) : null,
            ];
          })}
          dirty={dirty}
          error={error && <FormError error={error} />}
          buttons={
            !readOnly && (
              <FormButtons
                dirty={dirty}
                fields={evaluatedFields}
                formKey={formKey}
                reset={this.onReset()}
                submit={this.onSubmit()}
                error={error}
              />
            )
          }
          meta={evaluatedFields.map(field =>
            Map({
              visible: field.visible,
            }),
          )}
        />
      );
    }
    return typeof this.props.children === 'function'
      ? this.props.children({ form, initialized })
      : form;
  }
}

export const mapStateToProps = (state, props) => ({
  formState: selectForm(props.formKey)(state),
});

const SimpleFormImpl = connect(mapStateToProps)(SimpleFormImplComponent);

SimpleForm.propTypes = {
  /** Name or index of field that should be auto focused when the form loads. */
  autoFocus: t.oneOfType([t.string, t.number]),
  /** Object containing bindings that will be passed through when evaluating
   * field functions.  */
  bindings: t.object,
  /** Component overrides */
  components: t.object,
  /** Error message rendered in the FormError component and passed into the
   * FormButtons component. */
  error: t.string,
  /** Fields to render in the form. */
  fields: t.arrayOf(
    t.shape({
      // Name of field that corresponds to a property of the values object.
      name: t.string,
      label: t.string,
      type: t.string,
      onChange: t.func.isRequired,
      // TODO add more valid props
    }),
  ).isRequired,
  /**
   * Load function that is called when the form first loads.
   */
  onLoad: t.func,
  /**
   * Reset function that is responsible for resetting the values object that is
   * passed into this form. This function is passed into the FormButtons
   * component.
   */
  onReset: t.func,
  /**
   * Submit function that is responsible for performing any necessary actions.
   * This function is passed into the FormButtons component.
   */
  onSubmit: t.func,
  /** Is the form read only. */
  readOnly: t.bool,
  /** Values map (as an immutable Map). */
  values: t.instanceOf(Map),
};

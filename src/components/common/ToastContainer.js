import React, { useCallback, useEffect } from 'react';
import t from 'prop-types';
import { regHandlers, connect, dispatch } from '../../store';
import { generateKey } from '@kineticdata/react';
import { get, List, OrderedMap, Record } from 'immutable';
import { ComponentConfigContext } from './ComponentConfigContext';

export const ToastState = Record({
  title: null,
  content: null,
  icon: null,
  color: null,
  className: '',
  autoHide: true,
  duration: null,
});

regHandlers({
  // Initialize state for toasts as an OrderedMap so the order doesn't change
  INIT_TOASTS: state =>
    state.update(
      'toasts',
      toasts =>
        OrderedMap.isOrderedMap(toasts) ? toasts : OrderedMap(toasts || {}),
    ),
  ADD_TOAST: (state, action) =>
    state.setIn(['toasts', action.payload.toastKey], action.payload),
  SHOW_TOAST: (state, action) =>
    state.hasIn(['toasts', action.payload])
      ? state.setIn(['toasts', action.payload, 'show'], true)
      : state,
  HIDE_TOAST: (state, action) =>
    state.hasIn(['toasts', action.payload])
      ? state.setIn(['toasts', action.payload, 'show'], false)
      : state,
  REMOVE_TOAST: (state, action) => state.removeIn(['toasts', action.payload]),
  CLEAR_TOASTS: (state, action) =>
    state.update(
      'toasts',
      toasts =>
        action.payload
          ? toasts.filter(toast => toast.containerKey !== action.payload)
          : OrderedMap(),
    ),
});

// Adds toast to state and shows it after 100ms delay to trigger animation
const showToast = toast => {
  const toastKey = generateKey();
  dispatch('ADD_TOAST', {
    containerKey: toast.containerKey,
    toast: ToastState(toast).update(
      // Make sure duration is a number, or set to a default numeric value
      'duration',
      duration =>
        typeof duration === 'number'
          ? Math.max(duration, 4000)
          : toast.content
            ? 7000
            : 4000,
    ),
    toastKey,
    show: false,
  });
  setTimeout(() => {
    dispatch('SHOW_TOAST', toastKey);
  }, 100);
  return toastKey;
};

// Hides the toast and removes it from state after animation ends
const hideToast = toastKey => {
  dispatch('HIDE_TOAST', toastKey);
  setTimeout(() => {
    dispatch('REMOVE_TOAST', toastKey);
  }, 300);
};

// Clears all toasts, or if containerKey is provided, only the matching ones
const clearToasts = containerKey => {
  dispatch('CLEAR_TOASTS', containerKey);
};

const ToastWrapper = ({ component: Toast, show, toastKey, toast }) => {
  const { autoHide, content, ...toastProps } = toast.toJS();
  const toggle = useCallback(() => hideToast(toastKey), [toastKey]);

  return (
    <Toast
      key={toastKey}
      {...toastProps}
      show={show}
      toggle={toggle}
      autoHide={autoHide}
    >
      {content}
    </Toast>
  );
};

const ToastContainerComponent = ({ components, toasts, persistentToasts }) => {
  useEffect(() => {
    dispatch('INIT_TOASTS');
    return () => {};
  }, []);

  return (
    <ComponentConfigContext.Consumer>
      {componentConfig => {
        const component = get(
          components,
          'Toast',
          componentConfig.get('Toast'),
        );
        return (
          <>
            <div
              className="toast-container"
              aria-live="polite"
              aria-atomic="true"
            >
              {toasts.map(props => (
                <ToastWrapper
                  key={props.toastKey}
                  {...props}
                  component={component}
                />
              ))}
            </div>
            <div
              className="toast-container-persistent"
              aria-live="polite"
              aria-atomic="true"
            >
              {persistentToasts.map(props => (
                <ToastWrapper
                  key={props.toastKey}
                  {...props}
                  component={component}
                />
              ))}
            </div>
          </>
        );
      }}
    </ComponentConfigContext.Consumer>
  );
};

const mapStateToProps = (state, props) => {
  // Get the toasts for this container
  const containerToasts = state
    .get('toasts', List())
    .filter(
      ({ containerKey }) =>
        props.containerKey
          ? containerKey === props.containerKey
          : !containerKey,
    )
    .toList()
    .reverse();

  return {
    // Get all toasts that hide automatically
    toasts: containerToasts.filter(({ toast }) => !!toast.autoHide),
    // Get all toasts that require a user to close
    persistentToasts: containerToasts.filter(({ toast }) => !toast.autoHide),
  };
};

const ToastContainer = connect(mapStateToProps)(ToastContainerComponent);

export { ToastContainer, showToast, hideToast, clearToasts };

ToastContainer.propTypes = {
  /** A key used to scope toasts to this container */
  containerKey: t.string,
  components: t.shape({
    /** Override the default Toast component */
    Toast: t.func,
  }),
};

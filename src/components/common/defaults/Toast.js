import React from 'react';
import t from 'prop-types';

const Toast = ({ className, title, toggle, children }) => {
  return (
    <div
      className={className}
      style={{
        zIndex: 9999,
        pointerEvents: 'auto',
      }}
    >
      <div>
        <strong>{title}</strong>
      </div>
      <div>{children}</div>
      {toggle && (
        <button type="button" onClick={toggle}>
          &times;
        </button>
      )}
    </div>
  );
};

Toast.propTypes = {
  /** Classes to add to the toast element. */
  className: t.string,
  /** Title or short message to show in the toast. */
  title: t.string,
  /** Function to close the toast. */
  toggle: t.func.isRequired,
  /** JSX content to render in the body of the toast. */
  children: t.node,
};
export default Toast;

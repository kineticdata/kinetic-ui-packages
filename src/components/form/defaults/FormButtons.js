import React from 'react';

export const FormButtons = props => (
  <div>
    <button
      type="submit"
      onClick={props.submit}
      disabled={!props.dirty || props.submitting}
    >
      Submit
    </button>
  </div>
);

import React from 'react';
import { compose, withHandlers, withProps, withState } from 'recompose';
import { List, Map } from 'immutable';

export const InvitationFormComponent = props => {
  const InviteesInput = props.renderInviteesInput;
  return props.render({
    formElement: (
      <form className="invitation-form" onSubmit={props.handleSubmit}>
        <div className="form-group required">
          <label>Invitees</label>
          <InviteesInput
            id="invitees"
            onChange={props.handleUserChange}
            value={props.values.get('invitees')}
            disabledFn={props.disabledFn}
          />
          <small className="form-text text-muted">
            Enter a valid email address to invite a new user
          </small>
        </div>
        <div className="form-group">
          <label htmlFor="message">Message for Invitees</label>
          <textarea
            name="message"
            id="message"
            onChange={props.handleChange}
            value={props.values.get('message')}
          />
          <small className="form-text text-muted">
            This note will be sent as part of the invitation and visible to all
            members inside the discussion
          </small>
        </div>
      </form>
    ),
    invalid: props.required && props.values.get('invitees').size === 0,
    submit: props.handleSubmit,
    buttonProps: {
      onClick: props.handleSubmit,
      disabled:
        props.saving ||
        (props.required && props.values.get('invitees').size === 0),
    },
  });
};

const mapProps = props => ({
  associatedUsers: props.discussion
    ? props.discussion.participants
        .concat(
          props.discussion.invitations.filter(invitation => invitation.user),
        )
        .map(involvement => involvement.user.username)
    : List([props.profile.username]),
  associatedEmails: props.discussion
    ? props.discussion.invitations
        .filter(invitation => invitation.email)
        .map(invitation => invitation.email)
    : List(),
});

const handleChange = props => event => {
  const field = event.target.id;
  const value = event.target.value;
  props.setValues(values => values.set(field, value));
};

const handleUserChange = props => user => {
  props.setValues(values => values.set('invitees', user ? user : List()));
};

const handleSubmit = props => event => {
  event && event.preventDefault && event.preventDefault();
  props.setSaving(true);
  if (typeof props.onSubmit === 'function') {
    props.onSubmit(props.values, () => props.setSaving(false));
  }
};

const disabledFn = props => option => {
  if (option.user) {
    return (
      props.associatedUsers.contains(option.user.username) && 'Already involved'
    );
  } else if (option.customOption) {
    return props.associatedEmails.contains(option.label) && 'Already invited';
  }
  return false;
};

export const InvitationForm = compose(
  withProps(mapProps),
  withState('saving', 'setSaving', false),
  withState('values', 'setValues', Map({ invitees: List(), message: '' })),
  withHandlers({ handleChange, handleUserChange, handleSubmit, disabledFn }),
)(InvitationFormComponent);

export default InvitationForm;

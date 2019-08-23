import React from 'react';
import { Typeahead } from './Typeahead';
import { fetchUsers } from '../../apis';

const emailPattern = /^.+@.+\..+$/;

const fields = {
  username: 'Username',
  displayName: 'Display Name',
  email: 'Email',
};

const searchUsers = (searchField, value) =>
  fetchUsers({
    q: Object.keys(fields)
      .filter(field => !searchField || field === searchField)
      .map(field => `${field} =* "${value}"`)
      .join(' OR '),
    limit: 25,
  }).then(({ users, error, nextPageToken }) => ({
    suggestions: users || [],
    error,
    nextPageToken,
  }));

const userToValue = user => user.get('username') || user.get('email');

const valueToCustomUser = value =>
  value.match(emailPattern) && { email: value };

const getStatusProps = props => ({
  info: props.searchField ? `Find Users by ${fields[props.searchField]}` : null,
  warning:
    props.error || props.more || props.empty
      ? props.error && props.error.key === 'too_many_matches'
        ? 'Too many users to display. Please refine your search below'
        : props.more
        ? 'Too many users, first 25 shown. Please refine your search.'
        : props.empty && !props.custom
        ? 'No matching users.'
        : props.empty && props.custom
        ? 'No matching users. You may also enter a valid email.'
        : 'There was an error fetching users.'
      : null,
  clearFilterField: props.searchField ? props.setSearchField(null) : null,
  filterFieldOptions:
    props.error && props.error.key === 'too_many_matches'
      ? Object.entries(props.error.errorData.matches).map(([field, count]) => ({
          field,
          count,
          label: fields[field],
          value: props.value,
          onClick: props.setSearchField(field),
        }))
      : null,
});

export const UserSelect = props => (
  <Typeahead
    components={props.components || {}}
    textMode={props.textMode}
    multiple={props.multiple}
    custom={props.allowNew && valueToCustomUser}
    search={searchUsers}
    getSuggestionValue={userToValue}
    getStatusProps={getStatusProps}
    value={props.value}
    onChange={props.onChange}
    onFocus={props.onFocus}
    onBlur={props.onBlur}
    placeholder={props.placeholder}
  />
);

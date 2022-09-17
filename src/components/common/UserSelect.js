import React from 'react';
import { Typeahead } from './Typeahead';
import { fetchUsers } from '../../apis';
import { Map } from 'immutable';

const emailPattern = /^.+@.+\..+$/;
const validateCustomOption = value => value.match(emailPattern);

const fields = {
  username: 'Username',
  displayName: 'Display Name',
  email: 'Email',
};

const searchUsers = ({ search = Map() }) => (searchField, value, callback) =>
  fetchUsers({
    q: Object.keys(fields)
      .filter(field => !searchField || field === searchField)
      .map(field => `${field} =* "${value}"`)
      .join(' OR '),
    limit: search.get('limit') || 25,
    include: search.get('include') || '',
    public: !!search.get('public'),
  })
    .then(({ users, error, nextPageToken }) => ({
      suggestions: users || [],
      error,
      nextPageToken,
    }))
    .then(callback);

const userToValue = user =>
  (user && (user.get('username') || user.get('email') || '')) || '';

// Converts a typed in value to an option object. Used when adding custom values
// when allowNew is true.
const valueToCustomUser = ({ allowNew }) => value =>
  value.length > 0
    ? (typeof allowNew === 'function' && allowNew(value)) ||
      validateCustomOption(value)
      ? { email: value }
      : null
    : null;

const getStatusProps = ({
  search = Map(),
  messages: {
    // Not enough characters have been typed in to trigger a search.
    short = 'Type to find a user.',
    // No results found; custom options not allowed.
    empty = 'No matching users.',
    // No results found; custom options allowed.
    custom = 'No matching users. You may also enter a valid email.',
    // Searching in progress.
    pending = 'Searching...',
    // Too many results to show all.
    more = `Too many users, first ${search.get('limit') ||
      ''} shown. Please refine your search.`,
    // An error ocurred when searching.
    error = 'There was an error fetching users.',
  } = {},
}) => props => ({
  meta: props.searchField ? `Find Users by ${fields[props.searchField]}` : null,
  info: props.short ? short : props.pending ? pending : null,
  warning:
    props.error || props.more || props.empty
      ? props.error && props.error.key === 'too_many_matches'
        ? 'Too many users to display. Please refine your search below.'
        : props.more
          ? more
          : props.empty && !props.custom
            ? empty
            : props.empty && props.custom
              ? custom
              : error
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
    disabled={props.disabled}
    multiple={props.multiple}
    custom={props.allowNew && valueToCustomUser(props)}
    search={searchUsers(props)}
    minSearchLength={props.minSearchLength}
    getSuggestionValue={userToValue}
    getStatusProps={getStatusProps(props)}
    value={props.value}
    onChange={props.onChange}
    onFocus={props.onFocus}
    onBlur={props.onBlur}
    placeholder={props.placeholder}
    id={props.id}
  />
);

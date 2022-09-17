import React from 'react';
import { Typeahead } from './Typeahead';
import { fetchTeams } from '../../apis';
import { Map } from 'immutable';

const fields = {
  name: 'Full Name',
  localName: 'Local Name',
};

const searchTeams = ({ search = Map() }) => (field, value, callback) =>
  fetchTeams({
    q: Object.keys(fields)
      .filter(searchField => !field || searchField === field)
      .map(field => `${field} =* "${value}"`)
      .join(' OR '),
    limit: search.get('limit') || 25,
    include: search.get('include') || '',
    public: !!search.get('public'),
  })
    .then(({ teams, error, nextPageToken }) => ({
      suggestions: teams || [],
      error,
      nextPageToken,
    }))
    .then(callback);

const teamToValue = team => (team && team.get('name')) || '';

// Converts a typed in value to an option object. Used when adding custom values
// when allowNew is true.
const valueToCustomTeam = ({ allowNew }) => value =>
  value.length > 0
    ? typeof allowNew !== 'function' || allowNew(value)
      ? { name: value }
      : null
    : null;

const getStatusProps = ({
  search = Map(),
  messages: {
    // Not enough characters have been typed in to trigger a search.
    short = 'Type to find a team.',
    // No results found; custom options not allowed.
    empty = 'No matching teams.',
    // No results found; custom options allowed.
    custom = 'No matching teams. Type to enter a custom option.',
    // Searching in progress.
    pending = 'Searching...',
    // Too many results to show all.
    more = `Too many teams, first ${search.get('limit') ||
      25} shown. Please refine your search.`,
    // An error ocurred when searching.
    error = 'There was an error fetching teams.',
  } = {},
}) => props => ({
  meta: props.searchField ? `Find Teams by ${fields[props.searchField]}` : null,
  info: props.short ? short : props.pending ? pending : null,
  warning:
    props.error || props.more || props.empty
      ? props.error && props.error.key === 'too_many_matches'
        ? 'Too many teams to display. Please refine your search below.'
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

export const TeamSelect = props => (
  <Typeahead
    components={props.components || {}}
    disabled={props.disabled}
    multiple={props.multiple}
    custom={props.allowNew && valueToCustomTeam(props)}
    search={searchTeams(props)}
    minSearchLength={props.minSearchLength}
    getSuggestionValue={teamToValue}
    getStatusProps={getStatusProps(props)}
    value={props.value}
    onChange={props.onChange}
    onFocus={props.onFocus}
    onBlur={props.onBlur}
    placeholder={props.placeholder}
    id={props.id}
  />
);

import React from 'react';
import { Typeahead } from './Typeahead';
import { List, Map } from 'immutable';
import { defineFilter } from '@kineticdata/react';

const fields = [{ name: 'label' }, { name: 'value' }];

const OPERATORS = Map({
  equals: 'equals',
  matches: 'matches',
  startsWith: 'startsWith',
});

// Dynamically build filter function with correct operators
const buildFilter = searchFields => {
  const filter = searchFields
    .reduce(
      (filter, { name, operator }) =>
        filter[OPERATORS.get(operator, 'startsWith')](name, name),
      defineFilter(true, 'or'),
    )
    .end();
  // Build values object to pass into above filter option
  return (options, value) => {
    const values = searchFields.reduce(
      (values, { name }) => ({ ...values, [name]: value }),
      {},
    );
    return options.filter(option => filter(option, values));
  };
};

const searchOptions = ({ allowNew, options, search = Map() }) => (
  field,
  value,
  callback,
) => {
  // Determine the fields config
  const searchFields =
    Map.isMap(search) && search.has('fields') && !search.get('fields').isEmpty()
      ? search.get('fields').toJS()
      : fields;

  if (List.isList(options) && (allowNew || !options.isEmpty())) {
    // Get or build the filter function
    const filter =
      typeof search.get('fn') === 'function'
        ? search.get('fn')
        : buildFilter(searchFields);

    // Filter the options
    const suggestions = filter(options.toJS(), value);
    const limit = search.get('limit') || 25;

    // Return the matching suggestions
    return callback({
      suggestions: suggestions.slice(0, limit),
      nextPageToken: suggestions.length > limit,
    });
  } else {
    // If no options provided, return error message
    return callback({
      error: 'No options provided.',
      suggestions: [],
    });
  }
};

// Converts an option object to a single unique value. Used for comparing values
// and filtering out already selected values for multi selects.
const optionToValue = ({ valueProp = 'value' }) => option =>
  (option && option.get(valueProp)) || '';

// Converts a typed in value to an option object. Used when adding custom values
// when allowNew is true.
const valueToCustomOption = ({ valueProp = 'value', allowNew }) => value =>
  value.length > 0
    ? typeof allowNew !== 'function' || allowNew(value)
      ? { [valueProp]: value }
      : null
    : null;

const getStatusProps = ({
  search = Map(),
  messages: {
    // Not enough characters have been typed in to trigger a search.
    short = 'Type to find an option.',
    // No results found; custom options not allowed.
    empty = 'No matches found.',
    // No results found; custom options allowed.
    custom = 'No matches found. Type to enter a custom option.',
    // Searching in progress.
    pending = 'Searching...',
    // Too many results to show all.
    more = `Too many results, first ${search.get('limit') ||
      25} shown. Please refine your search.`,
  } = {},
}) => props => ({
  info: props.short ? short : props.pending ? pending : null,
  warning:
    props.error || props.empty || props.more
      ? props.error
        ? props.error
        : props.more
          ? more
          : props.empty
            ? props.custom
              ? custom
              : empty
            : null
      : null,
});

export const StaticSelect = props => (
  <Typeahead
    components={props.components || {}}
    disabled={props.disabled}
    multiple={props.multiple}
    custom={props.allowNew && valueToCustomOption(props)}
    search={searchOptions(props)}
    minSearchLength={props.minSearchLength}
    getSuggestionValue={optionToValue(props)}
    getStatusProps={getStatusProps(props)}
    value={props.value}
    onChange={props.onChange}
    onFocus={props.onFocus}
    onBlur={props.onBlur}
    placeholder={props.placeholder}
    id={props.id}
  />
);

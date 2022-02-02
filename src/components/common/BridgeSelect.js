import React from 'react';
import { Typeahead } from './Typeahead';
import { fetchBridgedResource } from '../../apis';
import { Map } from 'immutable';

const searchOptions = ({ search = Map() }) => (field, value, callback) => {
  const searchFields =
    Map.isMap(search) && search.has('fields') && !search.get('fields').isEmpty()
      ? search.get('fields').toJS()
      : [];

  const limit = search.get('limit') || 25;
  return fetchBridgedResource({
    datastore: search.get('datastore'),
    kappSlug: search.get('kappSlug'),
    formSlug: search.get('formSlug'),
    bridgedResourceName: search.get('bridgedResourceName'),
    values: searchFields.reduce(
      (values, { name, value: staticValue }) => ({
        ...values,
        [name]: staticValue || value,
      }),
      {},
    ),
    public: !!search.get('public'),
  })
    .then(({ records, error }) => ({
      suggestions: records ? records.slice(0, limit) : [],
      error,
      nextPageToken: records && records.length > limit,
    }))
    .then(callback);
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
    // An error ocurred when searching.
    error = 'There was an error fetching data.',
  } = {},
}) => props => ({
  info: props.short ? short : props.pending ? pending : null,
  warning:
    props.error || props.empty || props.more
      ? props.error
        ? error
        : props.more
          ? more
          : props.empty
            ? props.custom
              ? custom
              : empty
            : null
      : null,
});

export const BridgeSelect = props => (
  <Typeahead
    components={props.components || {}}
    disabled={props.disabled}
    multiple={props.multiple}
    custom={props.allowNew && valueToCustomOption(props)}
    search={searchOptions(props)}
    minSearchLength={
      typeof props.minSearchLength === 'number' ? props.minSearchLength : 1
    }
    getSuggestionValue={optionToValue(props)}
    getStatusProps={getStatusProps(props)}
    value={props.value}
    onChange={props.onChange}
    onFocus={props.onFocus}
    onBlur={props.onBlur}
    placeholder={props.placeholder}
  />
);

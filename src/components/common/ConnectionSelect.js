import React from 'react';
import { Typeahead } from './Typeahead';
import { fetchConnections } from '../../apis';
import { Map } from 'immutable';

const searchConnections =
  ({ search = Map() }) =>
  (field, value, callback) => {
    return fetchConnections({
      type: search.getIn(['config', 'configType']),
    })
      .then(({ connections, error, nextPageToken }) => ({
        suggestions: connections || [],
        error,
        nextPageToken,
      }))
      .then(callback);
  };

const connectionToValue = connection =>
  (connection && connection.get('id')) || '';

const getStatusProps =
  ({
    search = Map(),
    messages: {
      // Not enough characters have been typed in to trigger a search.
      short = 'Type to find a connection.',
      // No results found; custom options not allowed.
      empty = 'No matching connections.',
      // Searching in progress.
      pending = 'Searching...',
      // Too many results to show all.
      more = `Too many connections, first ${
        search.get('limit') || 25
      } shown. Please refine your search.`,
      // An error occurred when searching.
      error = 'There was an error fetching connections.',
    } = {},
  }) =>
  props => ({
    info: props.short ? short : props.pending ? pending : null,
    warning:
      props.error || props.empty || props.more
        ? props.error
          ? error
          : props.more
            ? more
            : props.empty
              ? empty
              : null
        : null,
  });

export const ConnectionSelect = props => (
  <Typeahead
    components={props.components || {}}
    disabled={props.disabled}
    multiple={props.multiple}
    search={searchConnections(props)}
    minSearchLength={props.minSearchLength}
    getSuggestionValue={connectionToValue}
    getStatusProps={getStatusProps(props)}
    value={props.value}
    onChange={props.onChange}
    onFocus={props.onFocus}
    onBlur={props.onBlur}
    placeholder={props.placeholder}
    id={props.id}
    form={props.form}
  />
);

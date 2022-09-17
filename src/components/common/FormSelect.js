import React from 'react';
import { Typeahead } from './Typeahead';
import { fetchForms } from '../../apis';
import { Map } from 'immutable';
import { defineKqlQuery } from '@kineticdata/react';

const fields = isDatastore =>
  isDatastore
    ? [{ name: 'name' }, { name: 'slug' }]
    : [{ name: 'name' }, { name: 'slug' }, { name: 'category' }];

// If dynamic is true, only use operators that can support a single string value
const OPERATORS = dynamic =>
  Map({
    equals: 'equals',
    matches: 'matches',
    startsWith: 'startsWith',
    ...(dynamic ? {} : { in: 'in' }),
  });

// Dynamically build query using correct operators
const buildQuery = (searchFields, value) => {
  // Start building a KQL query using any provided static values
  const fixedQueryBuilder = searchFields
    // Filter to fields that provided a value
    .filter(field => field.name && field.value)
    // For each field, apply the appropriate operator function
    .reduce(
      (filter, { name, operator, strict }) =>
        filter[OPERATORS(false).get(operator, 'startsWith')](
          name,
          name,
          strict,
        ),
      defineKqlQuery(),
    );

  // Add any fields using the typed in dynamic value to the KQL query
  const queryBuilder = searchFields
    // Filter to fields that didn't provide a value
    .filter(field => field.name && !field.value)
    // For each field, apply the appropriate operator function
    .reduce(
      (filter, { name, operator, strict }) =>
        filter[OPERATORS(true).get(operator, 'startsWith')](name, name, strict),
      // Start with the above KQL query and start an OR block
      fixedQueryBuilder.or(),
    )
    // End once for the OR block and once to build the query
    .end()
    .end();

  // Build values object using by query builder
  const values = searchFields.reduce(
    (values, field) => ({ ...values, [field.name]: field.value || value }),
    {},
  );

  // Build the query
  return queryBuilder(values);
};

const searchForms = ({ search = Map() }) => (field, value, callback) => {
  const searchFields =
    Map.isMap(search) && search.has('fields') && !search.get('fields').isEmpty()
      ? search.get('fields').toJS()
      : fields(search.get('datastore'));

  return fetchForms({
    datastore: search.get('datastore'),
    kappSlug: search.get('kappSlug'),
    q: buildQuery(searchFields, value),
    include:
      search.get('include') ||
      (search.get('datastore') ? '' : 'categorizations.category'),
    limit: search.get('limit') || 25,
    public: !!search.get('public'),
  })
    .then(({ forms, error, nextPageToken }) => ({
      suggestions: forms || [],
      error,
      nextPageToken,
    }))
    .then(callback);
};

const formToValue = form => (form && form.get('slug')) || '';

// Converts a typed in value to an option object. Used when adding custom values
// when allowNew is true.
const valueToCustomForm = ({ allowNew }) => value =>
  value.length > 0
    ? typeof allowNew !== 'function' || allowNew(value)
      ? { slug: value }
      : null
    : null;

const getStatusProps = ({
  search = Map(),
  messages: {
    // Not enough characters have been typed in to trigger a search.
    short = 'Type to find a form.',
    // No results found; custom options not allowed.
    empty = 'No matching forms.',
    // No results found; custom options allowed.
    custom = 'No matching forms. Type to enter a custom option.',
    // Searching in progress.
    pending = 'Searching...',
    // Too many results to show all.
    more = `Too many forms, first ${search.get('limit') ||
      25} shown. Please refine your search.`,
    // An error ocurred when searching.
    error = 'There was an error fetching forms.',
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

export const FormSelect = props => (
  <Typeahead
    components={props.components || {}}
    disabled={props.disabled}
    multiple={props.multiple}
    custom={props.allowNew && valueToCustomForm(props)}
    search={searchForms(props)}
    minSearchLength={props.minSearchLength}
    getSuggestionValue={formToValue}
    getStatusProps={getStatusProps(props)}
    value={props.value}
    onChange={props.onChange}
    onFocus={props.onFocus}
    onBlur={props.onBlur}
    placeholder={props.placeholder}
    id={props.id}
  />
);

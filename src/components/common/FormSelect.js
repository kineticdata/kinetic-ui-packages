import React from 'react';
import { Typeahead } from './Typeahead';
import { fetchForms } from '../../apis';
import { List, Map } from 'immutable';

const fields = [{ name: 'name' }, { name: 'slug' }, { name: 'category' }];

const searchForms = ({ options, search }) => (field, value, callback) => {
  const searchFields =
    Map.isMap(search) && search.has('fields') && !search.get('fields').isEmpty()
      ? search.get('fields').toJS()
      : fields;

  // Static Options
  if (List.isList(options) && !options.isEmpty()) {
    const filter =
      typeof search === 'function'
        ? search
        : (options, value) =>
            options.filter(option =>
              searchFields.some(
                field =>
                  option[field.name] &&
                  (field.exact
                    ? option[field.name] === value
                    : option[field.name]
                        .toLowerCase()
                        .startsWith(value.toLowerCase())),
              ),
            );
    return callback({ suggestions: filter(options.toJS(), value) });
  }
  // Server Side Fetching
  else {
    // If value is specified in the fields array, given value will be used.
    // These query aprts will be joined with AND statements to the grouping of
    // user input query options.
    const fixedSearchParts = searchFields
      .filter(field => field.name && field.value)
      .map(
        field =>
          Array.isArray(field.value)
            ? `${field.name} IN [${field.value.map(v => `"${v}"`).join(',')}]`
            : `${field.name} ${field.exact ? '=' : '=*'} "${field.value}"`,
      );

    // If value is not specified in the fields array, user entered value will be
    // matched. These query parts will be joined with OR statements.
    const userSearchParts = searchFields
      .filter(field => field.name && !field.value)
      .map(field => `${field.name} ${field.exact ? '=' : '=*'} "${value}"`)
      .join(' OR ');

    return fetchForms({
      kappSlug: search.get('kappSlug'),
      q: [...fixedSearchParts, userSearchParts].join(' AND '),
      include: 'categorizations.category',
      limit: 25,
    })
      .then(({ forms, error, nextPageToken }) => ({
        suggestions: forms || [],
        error,
        nextPageToken,
      }))
      .then(callback);
  }
};

const formToValue = form => (form && form.get('slug')) || '';

const getStatusProps = props => ({
  info: props.short
    ? 'Type to find a form.'
    : props.pending
      ? 'Searching…'
      : null,
  warning:
    props.error || props.more || props.empty
      ? props.error
        ? 'There was an error fetching forms.'
        : props.more
          ? 'Too many forms, first 25 shown. Please refine your search.'
          : props.empty && !props.custom
            ? 'No matching forms.'
            : null
      : null,
});

export const FormSelect = props => (
  <Typeahead
    components={props.components || {}}
    disabled={props.disabled}
    multiple={props.multiple}
    search={searchForms(props)}
    minSearchLength={props.minSearchLength}
    getSuggestionValue={formToValue}
    getStatusProps={getStatusProps}
    value={props.value}
    onChange={props.onChange}
    onFocus={props.onFocus}
    onBlur={props.onBlur}
    placeholder={props.placeholder}
  />
);

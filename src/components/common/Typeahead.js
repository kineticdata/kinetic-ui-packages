import React, { createRef, Fragment } from 'react';
import Autosuggest from 'react-autosuggest';
import { fromJS, is, List } from 'immutable';
import { debounce } from 'lodash-es';

const initialState = {
  editing: false,
  searchField: null,
  searchValue: '',
  refocus: false,
  result: null,
};

export class Typeahead extends React.Component {
  constructor(props) {
    super(props);
    this.state = initialState;
    this.autosuggest = createRef();
    this.focusRef = createRef();
    this.search = debounce((...args) => {
      this.props.search(...args);
    }, 150);
    this.renderInputComponent = renderInputComponent.bind(this);
    this.renderSuggestion = renderSuggestion.bind(this);
    this.renderSuggestionsContainer = renderSuggestionsContainer.bind(this);
    this.renderSelections = renderSelections.bind(this);
  }

  edit = event => {
    if (
      event.type === 'click' ||
      (event.type === 'keydown' &&
        (event.keyCode === 13 || event.keyCode === 32))
    ) {
      event.preventDefault();
      event.stopPropagation();
      if (!this.props.disabled) {
        this.setState({ editing: true });
      }
    }
  };

  remove = i => event => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    if (!this.props.disabled) {
      this.props.onChange(
        this.props.multiple ? this.props.value.delete(i) : null,
      );
    }
  };

  onHighlight = ({ suggestion }) => {
    if (typeof this.props.onHighlight === 'function') {
      this.props.onHighlight(suggestion);
    }
  };

  onSuggestionsResponse = searchedValue => ({
    suggestions,
    error,
    nextPageToken,
  }) => {
    if (searchedValue === this.state.searchValue) {
      // when multiple mode is enabled we don't want to allow the same
      // suggestion to be selected twice, we compare existing selections to
      // suggestions using the getSuggestionValue function that returns a string
      // this is necessary because one of the objects may have additional fields
      // but should be treated as equal to an object without those fields.
      const mappedValues =
        this.props.multiple &&
        this.props.value.map(this.props.getSuggestionValue);
      const filtered = suggestions
        .map(suggestion => fromJS(suggestion))
        .filter(
          suggestion =>
            !this.props.multiple ||
            !mappedValues.includes(this.props.getSuggestionValue(suggestion)),
        );
      const customSuggestion =
        this.props.custom &&
        // if the current searchValue matches an existing suggestion we do not
        // include it as a custom option
        filtered.filter(
          suggestion =>
            this.props.getSuggestionValue(suggestion) ===
            this.state.searchValue,
        ).length === 0 &&
        fromJS(this.props.custom(this.state.searchValue));
      this.setState({
        result: {
          error,
          nextPageToken,
          suggestions: customSuggestion
            ? [...filtered, customSuggestion]
            : filtered,
          customSuggestion,
        },
      });
    }
  };

  // Called by Autosuggest when a fetch is requested. With the prop
  // alwaysRenderSuggestions this will be called onFocus, onChange, and even
  // when a suggestion is selected. Because of the latter, we check to see if we
  // should ignore the operation. Otherwise we update the searchValue in the
  // state and componentDidUpdate is responsible for calling search. We also
  // check to see if escape was pressed while the searchValue is empty, if so we
  // close the Autosuggest by setting state to initialState.
  onSuggestionsFetchRequested = ({ value: searchValue, reason }) => {
    if (reason === 'escape-pressed' && this.state.searchValue === '') {
      this.setState(initialState);
    } else if (reason !== 'suggestion-selected') {
      this.setState({ editing: true, searchValue });
    } else if (!this.props.multiple) {
      this.setState({ refocus: true });
    }
  };

  // This implementation assumes that this is only called on blur of the input
  // because we are using the `alwaysRenderSuggestions` prop.
  onSuggestionsClearRequested = () => {
    this.setState(initialState);
  };

  setSearchField = searchField => () => {
    this.setState({ searchField });
  };

  // Called when a suggestion is clicked or enter is pressed. For multiple mode
  // we also reset the searchValue to an empty string and the Autosuggest will
  // remain open. For single mode we close the Autosuggest entirely by setting
  // state to initialState. Finally we call the onChange event to update the
  // parent field.
  onSuggestionSelected = (event, { method, suggestion }) => {
    // Prevent form submission if enter key is used to select suggestion.
    if (method === 'enter') {
      event.preventDefault();
    }
    // Update state if single search or query is multiple and should be cleared
    if (
      !this.props.multiple ||
      (!event.ctrlKey && !event.metaKey && !event.shiftKey)
    ) {
      this.setState(this.props.multiple ? { searchValue: '' } : initialState);
    }
    this.props.onChange(
      this.props.multiple ? this.props.value.push(suggestion) : suggestion,
    );
  };

  componentDidUpdate(prevProps, prevState, snapshot) {
    const searchLongEnough =
      !this.props.minSearchLength ||
      this.state.searchValue.length >= this.props.minSearchLength;
    const searchChanged =
      this.state.searchField !== prevState.searchField ||
      this.state.searchValue !== prevState.searchValue;
    const valueChanged = !is(this.props.value, prevProps.value);
    if (this.state.editing) {
      if (searchChanged || valueChanged || !prevState.editing) {
        // Always clear the result even if the search value is not long enough,
        // in that case a message should be displayed in place of results.
        this.setState({ result: null });
        if (searchLongEnough) {
          this.search(
            this.state.searchField,
            this.state.searchValue,
            this.onSuggestionsResponse(this.state.searchValue),
          );
        }
      }
      // If the previous state was not editing then we make sure the Autosuggest
      // input element is focused because it may not be visible before this.
      if (!prevState.editing) {
        this.autosuggest.current.input.focus();
      }
    }
    if (this.state.refocus && !prevState.refocus) {
      if (this.focusRef.current) {
        this.focusRef.current.focus();
      }
      this.setState({ refocus: false });
    }
  }

  render() {
    const {
      SelectionsContainer = SelectionsContainerDefault,
    } = this.props.components;
    return (
      <SelectionsContainer
        disabled={this.props.disabled}
        multiple={this.props.multiple}
        value={this.props.value}
        selections={
          this.props.multiple || !this.state.editing
            ? this.renderSelections()
            : null
        }
        input={
          (this.props.multiple || this.state.editing) && (
            <Autosuggest
              alwaysRenderSuggestions
              getSuggestionValue={this.props.getSuggestionValue}
              highlightFirstSuggestion={!this.props.noAutoHighlight}
              inputProps={{
                value: this.state.searchValue,
                onBlur: this.props.onBlur,
                onChange: onChangeNOOP,
                onFocus: this.props.onFocus,
                selection: this.props.value,
                placeholder: this.props.placeholder,
                id: this.props.id,
              }}
              onSuggestionHighlighted={this.onHighlight}
              onSuggestionSelected={this.onSuggestionSelected}
              onSuggestionsClearRequested={this.onSuggestionsClearRequested}
              onSuggestionsFetchRequested={this.onSuggestionsFetchRequested}
              ref={this.autosuggest}
              renderInputComponent={this.renderInputComponent}
              renderSuggestion={this.renderSuggestion}
              renderSuggestionsContainer={this.renderSuggestionsContainer}
              suggestions={
                this.state.result ? this.state.result.suggestions : []
              }
            />
          )
        }
      />
    );
  }
}

// RENDER HELPERS below need to bind to the Typeahead instance because they use
// methods / props / state. They could be defined in the class instead but since
// they do not alter state at all they were moved here to make that class
// hopefully easier to comprehend. They are intended to be passed to the
// corresponding (by name) props of the Autosuggest component.

// https://github.com/moroshko/react-autosuggest#render-suggestions-container-prop
function renderSuggestionsContainer({ containerProps, children }) {
  const {
    props: {
      components: {
        Status = StatusDefault,
        SuggestionsContainer = SuggestionsContainerDefault,
      },
      custom,
      getStatusProps,
      minSearchLength,
    },
    setSearchField,
    state,
  } = this;
  return (
    <SuggestionsContainer containerProps={containerProps} open={state.editing}>
      <Status
        {...getStatusProps({
          searchField: state.searchField,
          setSearchField,
          error: state.result && state.result.error,
          value: state.searchValue,
          empty: state.result && state.result.suggestions.length === 0,
          more: state.result && !!state.result.nextPageToken,
          short: minSearchLength && state.searchValue.length < minSearchLength,
          pending: !state.result,
          custom: !!custom,
        })}
      />
      {children}
    </SuggestionsContainer>
  );
}

// https://github.com/moroshko/react-autosuggest#render-suggestion-prop
function renderSuggestion(suggestion, { isHighlighted }) {
  const {
    props: {
      components: { Suggestion = SuggestionDefault },
      getSuggestionValue,
    },
  } = this;
  const custom =
    this.state.result && this.state.result.customSuggestion === suggestion;
  return (
    <Suggestion
      active={isHighlighted}
      custom={custom}
      suggestion={suggestion}
      suggestionValue={getSuggestionValue(suggestion)}
    />
  );
}

// https://github.com/moroshko/react-autosuggest#renderinputcomponent-optional
function renderInputComponent(inputProps) {
  const {
    props: {
      components: { Input = TypeaheadInputDefault },
    },
  } = this;
  return <Input inputProps={inputProps} />;
}

// Another render helper like the ones above but not actually for Autosuggest,
// just meant to cleanup the render function of Typeahead.
function renderSelections() {
  const {
    edit,
    focusRef,
    props: {
      components: { Selection = SelectionDefault },
      disabled,
      getSuggestionValue,
      multiple,
      value,
      placeholder,
      id,
    },
    remove,
  } = this;
  return (multiple ? value : List.of(value)).map((selection, i) => {
    const suggestionValue = getSuggestionValue(selection);
    return (
      <Selection
        key={suggestionValue}
        disabled={disabled}
        edit={!multiple ? edit : null}
        focusRef={!multiple ? focusRef : null}
        remove={multiple ? remove(i) : remove()}
        selection={selection}
        suggestionValue={suggestionValue}
        placeholder={!multiple ? placeholder : null}
        id={!multiple ? id : null}
      />
    );
  });
}

// DEFAULT COMPONENTS below render minimally useful content. They can and should
// be overridden by the components prop passed to Typeahead. If they need props
// or state from the Typeahead instance there will be a render* helper above
// that will bind to it.

const StatusDefault = props => (
  <div>
    {props.info && (
      <div>
        {props.info}
        <button onClick={props.clearFilterField}>&times;</button>
      </div>
    )}
    {props.warning && <div>{props.warning}</div>}
    {props.filterFieldOptions &&
      props.filterFieldOptions.map(({ label, onClick }, i) => (
        <button onClick={onClick} key={i}>
          {label}
        </button>
      ))}
  </div>
);

const SuggestionsContainerDefault = ({ children, containerProps, open }) => (
  <div {...containerProps} style={open ? {} : { display: 'none' }}>
    {children}
  </div>
);

const SelectionsContainerDefault = ({ selections, input }) => (
  <Fragment>
    {selections}
    {input}
  </Fragment>
);

const SelectionDefault = ({ selection, remove, edit, suggestionValue }) => (
  <div>
    <span>{suggestionValue || <em>None</em>}</span>
    {edit && (
      <button type="button" onClick={edit}>
        {suggestionValue ? 'edit' : 'add'}
      </button>
    )}
    {selection && (
      <button type="button" onClick={remove}>
        remove
      </button>
    )}
  </div>
);

const SuggestionDefault = ({ active, suggestionValue }) => (
  <div>{active ? <strong>{suggestionValue}</strong> : suggestionValue}</div>
);

const TypeaheadInputDefault = ({ inputProps }) => <input {...inputProps} />;

// This is passed to the Autosuggest input but we do not want to update that
// value when pressing up/down and we do not want to set that input when a
// suggestion is clicked so we are making this a noop. Instead we update the
// searchValue state when `onSuggestionsFetchRequested` is called.
const onChangeNOOP = (event, { newValue, method }) => {};

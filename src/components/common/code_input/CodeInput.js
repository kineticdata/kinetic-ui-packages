import React, { Component } from 'react';
import {
  CompositeDecorator,
  convertFromRaw,
  Editor,
  EditorState,
  getDefaultKeyBinding,
} from 'draft-js';
import classNames from 'classnames';
import { Manager, Reference, Popper } from 'react-popper';
import {
  apply,
  applyFilter,
  checkFocus,
  checkSelectionEntities,
  checkSelectionPosition,
  closeTypeahead,
  findByEntityType,
  getCurrentIndentation,
  getEntities,
  getEntitiesImpl,
  insertText,
  nextTypeaheadItem,
  previousTypeaheadItem,
  selectTypeaheadItem,
  startTypeahead,
} from './draftHelpers';
import {
  processErbTemplate,
  processJavaScript,
  processJavaScriptTemplate,
  processRuby,
} from './languageHelpers';
import { Scroller } from '../Scroller';

export class CodeInput extends Component {
  constructor(props) {
    super(props);
    this.newLine = '\n';
    this.indentation = '  ';
    this.state = {
      editorState: EditorState.createWithContent(
        convertFromRaw({
          entityMap: {},
          blocks: [
            {
              text: props.value,
            },
          ],
        }),
        new CompositeDecorator([
          {
            strategy: findByEntityType('typeahead-start'),
            component: props => (
              <span
                className={classNames('code typeahead-start', {
                  'typeahead-tentative': this.state.typeaheadTentative,
                })}
              >
                {props.children}
              </span>
            ),
          },
          {
            strategy: findByEntityType('typeahead-selection'),
            component: props => (
              <span className="code typeahead-selection">{props.children}</span>
            ),
          },
          {
            strategy: findByEntityType('typeahead-filter'),
            component: ({ children, entityKey, contentState }) => {
              const { options, active } = contentState
                .getEntity(entityKey)
                .getData();
              return (
                <Manager>
                  <Reference>
                    {({ ref }) => (
                      <span
                        ref={ref}
                        className={classNames('code typeahead-filter', {
                          'typeahead-tentative': this.state.typeaheadTentative,
                        })}
                      >
                        {children}
                      </span>
                    )}
                  </Reference>
                  <Popper placement="bottom-start">
                    {({ ref, style, placement }) => (
                      <div
                        ref={ref}
                        style={style}
                        data-placement={placement}
                        className="variable-typeahead-menu"
                        contentEditable={false}
                      >
                        <Scroller>
                          {({ parentRef, childRef }) => (
                            <ul ref={parentRef}>
                              {options.map(
                                (
                                  { label, children, value, selection, tags },
                                  i,
                                ) => (
                                  <li
                                    className={classNames({
                                      active: i === active,
                                    })}
                                    key={label}
                                    onClick={selectTypeaheadItem(this)(
                                      label,
                                      value,
                                      selection,
                                    )}
                                    style={{
                                      userSelect: 'none',
                                      MozUserSelect: 'none',
                                    }}
                                    ref={i === active ? childRef : null}
                                  >
                                    <span>{label}</span>
                                    <span className="tags">
                                      {tags &&
                                        tags.map((tag, i) => (
                                          <span key={i} className="tag">
                                            {tag}
                                          </span>
                                        ))}
                                    </span>
                                    {children && (
                                      <i className="fa fa-chevron-right" />
                                    )}
                                  </li>
                                ),
                              )}
                            </ul>
                          )}
                        </Scroller>
                      </div>
                    )}
                  </Popper>
                </Manager>
              );
            },
          },
          {
            strategy: (contentBlock, callback, contentState) => {
              const entities = getEntitiesImpl(contentBlock, contentState);
              const typeaheadStart = entities.isEmpty()
                ? null
                : entities.first().start;
              const typeaheadEnd = entities.isEmpty()
                ? null
                : entities.last().end;
              const text =
                typeaheadStart !== null
                  ? contentBlock.getText().slice(0, typeaheadStart) +
                    ' '.repeat(typeaheadEnd - typeaheadStart) +
                    contentBlock.getText().slice(typeaheadEnd)
                  : contentBlock.getText();
              const processor =
                props.language === 'js'
                  ? processJavaScript
                  : props.language === 'js-template'
                  ? processJavaScriptTemplate
                  : props.language === 'ruby'
                  ? processRuby
                  : props.language === 'erb'
                  ? processErbTemplate
                  : null;
              if (processor) {
                this.tokenStarts = {};
                this.tokenEnds = {};
                processor(text).reduce((start, [content, ...type]) => {
                  const end = start + content.length;
                  this.tokenStarts[start] = type;
                  this.tokenEnds[end] = type;
                  if (start < typeaheadStart && end > typeaheadStart) {
                    callback(start, typeaheadStart);
                  }
                  if (start < typeaheadEnd && end > typeaheadEnd) {
                    callback(typeaheadEnd, end);
                  }
                  if (
                    !(start < typeaheadStart && end > typeaheadStart) &&
                    !(start < typeaheadEnd && end > typeaheadEnd)
                  ) {
                    callback(start, end);
                  }
                  return end;
                }, 0);
              }
            },
            component: ({ children, start, end }) => (
              <span
                className={classNames(
                  'code',
                  this.tokenStarts[start] || this.tokenEnds[end],
                )}
              >
                {children}
              </span>
            ),
          },
        ]),
      ),
    };
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (
      this.props.value !== prevProps.value &&
      this.props.value !==
        this.state.editorState
          .getCurrentContent()
          .getFirstBlock()
          .getText()
    ) {
      this.onChange(
        EditorState.push(
          this.state.editorState,
          convertFromRaw({
            entityMap: {},
            blocks: [
              {
                text: this.props.value,
              },
            ],
          }),
          'insert-characters',
        ),
      );
    }
  }

  onMetaChange = editorState => {
    this.setState({ editorState });
  };

  onChange = editorState => {
    const nextEditorState = apply(
      editorState,
      checkFocus,
      checkSelectionEntities,
      checkSelectionPosition,
      applyFilter(this.props.bindings),
    );
    const entities = getEntities(nextEditorState);
    const valueChanged =
      this.state.editorState
        .getCurrentContent()
        .getFirstBlock()
        .getText() !==
      nextEditorState
        .getCurrentContent()
        .getFirstBlock()
        .getText();
    this.setState(
      {
        editorState: nextEditorState,
        typeaheadOpen: !entities.isEmpty(),
        typeaheadTentative: entities.size === 2,
      },
      () => {
        if (valueChanged && typeof this.props.onChange === 'function') {
          this.props.onChange(
            nextEditorState
              .getCurrentContent()
              .getFirstBlock()
              .getText(),
          );
        }
      },
    );
  };

  handleDroppedFiles = (selection, [file]) => {
    if (typeof this.props.onChange === 'function') {
      const fileReader = new FileReader();
      fileReader.onloadend = () => {
        this.props.onChange(fileReader.result);
      };
      fileReader.readAsText(file);
    }
  };

  handleKeyCommand = (command, editorState) => {
    if (command === 'start-typeahead') {
      this.onChange(startTypeahead(editorState));
    }
    if (command === 'close-typeahead') {
      this.onChange(closeTypeahead(editorState));
    }
    if (command === 'insert-tab') {
      this.onChange(
        insertText({ text: this.indentation })(this.state.editorState),
      );
    }
    if (command === 'insert-newline') {
      const currentIndentation = getCurrentIndentation(
        this.newLine,
        this.state.editorState,
      );
      this.onChange(
        insertText({ text: this.newLine + currentIndentation })(
          this.state.editorState,
        ),
      );
    }
    if (command === 'select-typeahead-option') {
      const { options, active } = getEntities(
        this.state.editorState,
      ).last().data;
      const activeOption = options.get(active);
      if (activeOption) {
        const { label, value, selection } = activeOption;
        selectTypeaheadItem(this)(label, value, selection)();
      }
    }
    if (command === 'next-typeahead-option') {
      this.onMetaChange(nextTypeaheadItem(editorState));
    }
    if (command === 'previous-typeahead-option') {
      this.onMetaChange(previousTypeaheadItem(editorState));
    }
    return 'not-handled';
  };

  handlePastedText = (text, html, editorState) => {
    this.onChange(insertText({ text: text })(editorState));
    return true;
  };

  keyBindingFn = event => {
    if (this.state.typeaheadOpen) {
      if (event.keyCode === 27) {
        this.stopEscape = true;
        return 'close-typeahead';
      } else if (event.keyCode === 9 || event.keyCode === 13) {
        return 'select-typeahead-option';
      } else if (
        event.keyCode === 38 ||
        (event.keyCode === 80 && event.ctrlKey)
      ) {
        return 'previous-typeahead-option';
      } else if (
        event.keyCode === 40 ||
        (event.keyCode === 78 && event.ctrlKey)
      ) {
        return 'next-typeahead-option';
      }
    } else {
      if (
        event.keyCode === 52 &&
        event.shiftKey &&
        !this.props.bindings.isEmpty()
      ) {
        return 'start-typeahead';
      } else if (
        event.keyCode === 9 &&
        this.props.value.indexOf(this.newLine) > -1
      ) {
        event.preventDefault();
        return 'insert-tab';
      } else if (event.keyCode === 13) {
        return 'insert-newline';
      }
    }
    return getDefaultKeyBinding(event);
  };

  onKeyUp = event => {
    // since we are not able to stop propagation in keyBindingFn above, we set a
    // boolean there and this onKeyUp handler (that fires afterwards) checks for
    // that boolean and stop's propagation if necessary and resets the boolean
    if (event.keyCode === 27 && this.stopEscape) {
      this.stopEscape = false;
      event.stopPropagation();
    }
  };

  startTypeahead = () => {
    this.onChange(startTypeahead(this.state.editorState));
  };

  copy = () => {
    const el = document.createElement('textarea');
    el.value = this.state.editorState
      .getCurrentContent()
      .getFirstBlock()
      .getText();
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
  };

  render() {
    return this.props.children({
      wrapperProps: { onKeyUp: this.onKeyUp },
      copy: this.copy,
      editor: (
        <Editor
          readOnly={this.props.disabled}
          editorState={this.state.editorState}
          onFocus={this.props.onFocus}
          onBlur={this.props.onBlur}
          onChange={this.onChange}
          ref={this.props.focusRef}
          handleDroppedFiles={this.handleDroppedFiles}
          handlePastedText={this.handlePastedText}
          handleKeyCommand={this.handleKeyCommand}
          keyBindingFn={this.keyBindingFn}
        />
      ),
      startTypeahead: this.startTypeahead,
    });
  }
}

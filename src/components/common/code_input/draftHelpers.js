import { EditorState, Modifier } from 'draft-js';
import { List } from 'immutable';

// DOMAIN-SPECIFIC HELPERS

const filterEntity = { type: 'typeahead-filter', mutability: 'MUTABLE' };
const startEntity = { type: 'typeahead-start', mutability: 'IMMUTABLE' };
const selectionEntity = {
  type: 'typeahead-selection',
  mutability: 'IMMUTABLE',
};

const matches = (searcher, text) =>
  text.toLowerCase().indexOf(searcher.toLowerCase()) > -1;

export const nextTypeaheadItem = editorState => {
  const filterEntity = getEntities(editorState).last();
  const data = filterEntity.data;
  const active = (data.active + 1) % data.options.size;
  return applyEntity({
    ...filterEntity,
    key: undefined,
    data: { ...data, active },
  })(editorState);
};

export const previousTypeaheadItem = editorState => {
  const filterEntity = getEntities(editorState).last();
  const data = filterEntity.data;
  const n = data.options.size;
  // https://dev.to/maurobringolf/a-neat-trick-to-compute-modulo-of-negative-numbers-111e
  const active = (((data.active - 1) % n) + n) % n;
  return applyEntity({
    ...filterEntity,
    key: undefined,
    data: { ...data, active },
  })(editorState);
};

export const traverseBindings = (bindings, [head, ...tail]) =>
  head ? traverseBindings(bindings.get(head).get('children'), tail) : bindings;

export const checkSelectionEntities = editorState => {
  const entities = getEntities(editorState);
  if (!entities.isEmpty()) {
    const validEntities = entities.reduce(
      (reduction, entity) =>
        reduction.isEmpty() ||
        entity.data.index === reduction.last().data.index + 1
          ? reduction.push(entity)
          : reduction,
      List(),
    );
    if (validEntities.last().end !== entities.last().end) {
      const start = validEntities.last().end;
      const end = entities.last().end;
      const index = validEntities.last().data.index + 1;
      return apply(
        editorState,
        select({ anchor: start, focus: end }),
        insertText({
          text: ' ',
          entity: { ...filterEntity, data: { index } },
        }),
        select({ anchor: offset => offset - 1, focus: offset => offset - 1 }),
      );
    }
  }
  return editorState;
};

export const applyFilter = bindings => editorState => {
  const entities = getEntities(editorState);
  if (!entities.isEmpty()) {
    const selections = entities
      .rest()
      .butLast()
      .map(entity => entity.text);
    const {
      end,
      start,
      text: filter,
      data: { index },
    } = entities.last();
    const options = traverseBindings(bindings, selections.toArray())
      .entrySeq()
      .toList()
      .filter(([label]) => matches(filter, label))
      .map(([label, value]) => value.set('label', label).toObject());
    if (options.size === 0 && entities.size === 2) {
      return closeTypeahead(editorState);
    } else {
      const data = { index, options, active: 0 };
      return applyEntity({ ...filterEntity, start, end, data })(editorState);
    }
  }
  return editorState;
};

export const checkSelectionPosition = editorState => {
  const entities = getEntities(editorState);
  if (!entities.isEmpty()) {
    const selection = editorState.getSelection();
    const start = entities.first().start;
    const end = entities.last().end;
    if (
      selection.getStartOffset() <= start ||
      selection.getEndOffset() >= end
    ) {
      return closeTypeahead(editorState);
    }
  }
  return editorState;
};

export const checkFocus = editorState => {
  const entities = getEntities(editorState);
  if (!entities.isEmpty()) {
    return editorState.getSelection().getHasFocus()
      ? editorState
      : closeTypeahead(editorState);
  }
  return editorState;
};

export const startTypeahead = editorState => {
  return apply(
    editorState,
    insertText({ text: '$', entity: { ...startEntity, data: { index: 0 } } }),
    insertText({ text: ' ', entity: { ...filterEntity, data: { index: 1 } } }),
    select({ anchor: offset => offset - 1, focus: offset => offset - 1 }),
  );
};

export const closeTypeahead = editorState => {
  const entities = getEntities(editorState);
  const start = entities.first().start;
  const end = entities.last().end;
  const text =
    entities.size === 1
      ? entities.first().text
      : entities.size === 2
      ? `${entities.first().text}${entities.last().text}`
      : '';
  return apply(
    editorState,
    select({ anchor: start, focus: end }),
    insertText({ text }),
  );
};

export const selectTypeaheadItem = self => (label, value, selection) => () => {
  // determine how the selected value should be wrapped based on the language of
  // this CodeInput instance,
  const text =
    self.props.language === 'js-template'
      ? `\${${value}}`
      : self.props.language === 'erb'
      ? `<%= ${value} %>`
      : value;
  // when a selection is passed with a value we need to accommodate for the
  // number of characters we add when we wrap the value
  const templateOffset =
    self.props.language === 'js-template'
      ? 2
      : self.props.language === 'erb'
      ? 4
      : 0;

  const entities = getEntities(self.state.editorState);
  if (!value) {
    const { start, end, data } = entities.last();
    self.onChange(
      apply(
        self.state.editorState,
        select({ anchor: start, focus: end }),
        insertText({
          text: label,
          entity: { ...selectionEntity, data: { index: data.index } },
        }),
        insertText({
          text: ' ',
          entity: { ...filterEntity, data: { index: data.index + 1 } },
        }),
        select({ anchor: offset => offset - 1, focus: offset => offset - 1 }),
      ),
    );
  } else {
    const start = entities.first().start;
    const end = entities.last().end;
    self.onChange(
      apply(
        self.state.editorState,
        select({ anchor: start, focus: end }),
        insertText({ text }),
        selection &&
          select({
            anchor: start + selection.get('start') + templateOffset,
            focus: start + selection.get('end') + templateOffset,
          }),
      ),
    );
  }
};

export const getEntities = editorState =>
  getEntitiesImpl(
    editorState.getCurrentContent().getFirstBlock(),
    editorState.getCurrentContent(),
  );

export const getEntitiesImpl = (block, content) => {
  const text = block.getText();
  const ranges = [];
  block.findEntityRanges(
    character => character.getEntity(),
    (start, end) => {
      const key = block.getEntityAt(start);
      ranges.push({
        start,
        end,
        key,
        text: text.slice(start, end),
        data: content.getEntity(key).getData(),
        type: content.getEntity(key).getType(),
        mutability: content.getEntity(key).getMutability(),
      });
    },
  );
  return List(ranges).map((range, i) => {
    if (range.type === 'typeahead-filter') {
      const start = i === 0 ? range.start : ranges[i - 1].end;
      return {
        ...range,
        start,
        text: text.slice(start, range.end).replace(/\s$/, ''),
      };
    } else {
      return range;
    }
  });
};

// SUPER GENERIC HELPERS

export const apply = (editorState, ...operations) =>
  operations
    .filter(op => !!op)
    .reduce((reduction, op) => op(reduction), editorState);

export const select = ({ anchor, focus }) => editorState => {
  const selection0 = editorState.getSelection();
  const selection1 = selection0.set(
    'anchorOffset',
    typeof anchor === 'number'
      ? anchor
      : typeof anchor === 'function'
      ? anchor(selection0.getAnchorOffset())
      : selection0.getAnchorOffset(),
  );
  const selection2 = selection1.set(
    'focusOffset',
    typeof focus === 'number'
      ? focus
      : typeof focus === 'function'
      ? focus(selection1.getFocusOffset())
      : selection1.getFocusOffset(),
  );
  return EditorState.forceSelection(editorState, selection2);
};

export const insertText = ({ text, entity }) => editorState => {
  const modifier = editorState.getSelection().isCollapsed()
    ? Modifier.insertText
    : Modifier.replaceText;
  const contentState0 = editorState.getCurrentContent();
  const contentState1 = entity
    ? contentState0.createEntity(entity.type, entity.mutability, entity.data)
    : contentState0;
  const contentState2 = modifier(
    contentState1,
    editorState.getSelection(),
    text,
    null,
    entity ? contentState1.getLastCreatedEntityKey() : null,
  );
  return EditorState.push(
    editorState,
    contentState2,
    'insert-characters',
    true,
  );
};

export const applyEntity = ({
  data,
  end,
  key,
  mutability,
  start,
  type,
}) => editorState => {
  const contentState0 = editorState.getCurrentContent();
  const contentState1 = key
    ? contentState0
    : contentState0.createEntity(type, mutability, data);
  const entityKey = key || contentState1.getLastCreatedEntityKey();
  const selection = editorState
    .getSelection()
    .set('anchorOffset', start)
    .set('focusOffset', end);
  const contentState2 = Modifier.applyEntity(
    contentState1,
    selection,
    entityKey,
  );
  return EditorState.forceSelection(
    EditorState.push(editorState, contentState2, 'apply-entity'),
    editorState.getSelection(),
  );
};

export const findByEntityType = type => (
  contentBlock,
  callback,
  contentState,
) =>
  contentBlock.findEntityRanges(
    char =>
      char.getEntity()
        ? contentState.getEntity(char.getEntity()).getType() === type
        : false,
    callback,
  );

export const getCurrentIndentation = (newLine, editorState) => {
  const text = editorState
    .getCurrentContent()
    .getBlockForKey(editorState.getSelection().getStartKey())
    .getText();
  const textBeforeCursor = text.slice(
    0,
    editorState.getSelection().getStartOffset(),
  );
  const lineBeforeCursor = textBeforeCursor.slice(
    textBeforeCursor.lastIndexOf(newLine) + 1,
  );
  return lineBeforeCursor.replace(/\S.*$/, '');
};

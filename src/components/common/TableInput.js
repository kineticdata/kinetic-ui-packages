import React, { Fragment } from 'react';
import { Map } from 'immutable';
import { DragDropContext, Draggable, Droppable } from 'react-beautiful-dnd';

const TextInput = props => (
  <input
    type="text"
    id={props.id || props.name}
    name={props.name}
    value={props.value || ''}
    onBlur={props.onBlur}
    onChange={props.onChange}
    onFocus={props.onFocus}
    form={props.form}
  />
);

const CheckboxInput = props => (
  <input
    type="checkbox"
    id={props.id || props.name}
    name={props.name}
    checked={props.value || false}
    onBlur={props.onBlur}
    onChange={props.onChange}
    onFocus={props.onFocus}
    form={props.form}
  />
);

const DragHandle = props => <span {...props}>&#8597;</span>;

export const TableLayout = ({ rows, onAdd, options }) => (
  <Fragment>
    <table>
      <thead>
        <tr>
          {options
            .toIndexedSeq()
            .toList()
            .map(config => (
              <th key={config.get('name')}>{config.get('label')}</th>
            ))}
          <th>&nbsp;</th>
        </tr>
      </thead>
      <tbody>{rows}</tbody>
    </table>
    <button type="button" onClick={onAdd}>
      Add
    </button>
  </Fragment>
);

const RowLayout = ({ fields, onDelete }) => (
  <tr>
    {fields.map((field, name) => <td key={name}>{field}</td>).toList()}
    <td>
      <button type="button" onClick={onDelete}>
        Delete
      </button>
    </td>
  </tr>
);

const typeToComponent = {
  drag: 'DragHandle',
  text: 'TextInput',
  checkbox: 'CheckboxInput',
};

const defaultComponents = {
  TableLayout,
  RowLayout,
  TextInput,
  CheckboxInput,
  DragHandle,
};

const fieldFromConfig = (config, components = {}) => {
  return (
    components[typeToComponent[config.get('type')]] || components['TextInput']
  );
};

export const TableInput = props => {
  const {
    components = {},
    options,
    rows,
    onChange,
    onBlur,
    onFocus,
    form,
  } = props;
  const appliedComponents = {
    ...defaultComponents,
    ...components,
  };

  const { RowLayout, TableLayout } = appliedComponents;
  const handleAddRow = e => {
    e.preventDefault();

    const newRow = options
      .filter(config => config.get('type') !== 'drag')
      .reduce(
        (row, config) =>
          row.set(
            config.get('name'),
            config.get('type') === 'checkbox' ? false : '',
          ),
        Map(),
      );

    onChange(rows.push(newRow));
  };

  const onDragEnd = e => {
    if (e.source && e.destination) {
      onChange(
        rows
          .delete(e.source.index)
          .insert(e.destination.index, rows.get(e.source.index)),
      );
    }
  };

  const isDragDisabled = !options.some(option => option.get('type') === 'drag');

  const fieldRows = props.rows.map((row, index) => {
    const handleDeleteRow = e => {
      e.preventDefault();

      onChange(rows.delete(index));
    };

    return (
      <Draggable
        draggableId={`draggable${index}`}
        index={index}
        key={index}
        isDragDisabled={isDragDisabled}
      >
        {(provided, snapshot) => {
          // For each of the options specified for the field, we render a table
          // cell with a field in it. The field type is determined by the type
          // of the option.
          const fields = options
            .toOrderedMap()
            .mapKeys((_, config) => config.get('name'))
            .map(config => {
              const Field = fieldFromConfig(config, appliedComponents);
              const { label, name, type } = config.toObject();
              const fieldOnChange = e =>
                onChange(
                  rows.setIn(
                    [index, name],
                    type === 'checkbox' ? e.target.checked : e.target.value,
                  ),
                );
              const value = row.get(name);
              const props =
                type === 'drag'
                  ? provided.dragHandleProps
                  : {
                      label,
                      onBlur,
                      onChange: fieldOnChange,
                      onFocus,
                      value,
                      form,
                    };
              return <Field {...props} />;
            });

          return (
            <RowLayout
              draggableRef={provided.innerRef}
              draggableProps={provided.draggableProps}
              dragging={snapshot.isDragging}
              fields={fields}
              options={options}
              onDelete={handleDeleteRow}
            />
          );
        }}
      </Draggable>
    );
  });

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable droppableId="droppable">
        {provided => (
          <TableLayout
            droppableRef={provided.innerRef}
            rows={fieldRows}
            onAdd={handleAddRow}
            options={options}
            placeholder={provided.placeholder}
          />
        )}
      </Droppable>
    </DragDropContext>
  );
};

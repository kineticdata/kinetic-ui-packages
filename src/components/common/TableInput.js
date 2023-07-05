import React, { Fragment } from 'react';
import { Map } from 'immutable';
import { DragDropContext, Draggable, Droppable } from 'react-beautiful-dnd';

const TextDisplay = props => <span id={props.id}>{props.value || ''}</span>;

const TextInput = props => (
  <input
    type="text"
    id={props.id}
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
    id={props.id}
    name={props.name}
    checked={props.value || false}
    onBlur={props.onBlur}
    onChange={props.onChange}
    onFocus={props.onFocus}
    form={props.form}
  />
);

const DragHandle = props => <span {...props}>&#8597;</span>;

export const TableLayout = ({ droppableRef, rows, onAdd, options }) => (
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
      <tbody ref={droppableRef}>{rows}</tbody>
    </table>
    {onAdd && (
      <button type="button" onClick={onAdd}>
        Add
      </button>
    )}
  </Fragment>
);

const RowLayout = ({
  dragging,
  draggableRef,
  draggableProps,
  fields,
  onDelete,
  onEdit,
}) => (
  <tr
    ref={draggableRef}
    {...draggableProps}
    className={dragging ? 'dragging' : ''}
  >
    {fields.map((field, name) => <td key={name}>{field}</td>).toList()}
    <td>
      {onEdit && (
        <button type="button" onClick={onEdit}>
          Edit
        </button>
      )}
      {onDelete && (
        <button type="button" onClick={onDelete}>
          Delete
        </button>
      )}
    </td>
  </tr>
);

const typeToComponent = {
  display: 'TextDisplay',
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
  TextDisplay,
};

const fieldFromConfig = (config, components = {}) => {
  return (
    config.get('component') ||
    components[typeToComponent[config.get('type')]] ||
    components['TextDisplay']
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
    onAdd,
    onEdit,
    onDelete,
    disabled,
    form,
  } = props;
  // Create a list of components, overriding any defualts by those provided
  const appliedComponents = {
    ...defaultComponents,
    ...components,
  };
  const { RowLayout, TableLayout } = appliedComponents;

  // Create add handler for adding new rows to the table
  const handleAddRow = e => {
    e.preventDefault();
    // If an onAdd function was provided, call it
    if (typeof onAdd === 'function') {
      return onAdd({ rows, options, onChange });
    }
    // Otherwise add an empty new row
    else {
      onChange(
        rows.push(
          options
            // Exclude drag columns from data object
            .filter(config => config.get('type') !== 'drag')
            .reduce(
              (row, config) =>
                row.set(
                  config.get('name'),
                  config.get('type') === 'checkbox' ? false : '',
                ),
              Map(),
            ),
        ),
      );
    }
  };

  // Handler for moving rows via dragging
  const onDragEnd = e => {
    if (e.source && e.destination) {
      onChange(
        rows
          .delete(e.source.index)
          .insert(e.destination.index, rows.get(e.source.index)),
      );
    }
  };

  // Disable drag if there are no columns of type drag
  const isDragDisabled = !options.some(option => option.get('type') === 'drag');

  const fieldRows = props.rows.map((row, index) => {
    const handleDeleteRow = e => {
      e.preventDefault();
      // If an onDelete function was provided, call it
      if (typeof onDelete === 'function') {
        return onDelete({ index, rows, options, onChange });
      }
      // Otherwise remove the row
      else {
        onChange(rows.delete(index));
      }
    };

    const handleEditRow =
      typeof onEdit === 'function'
        ? e => {
            e.preventDefault();
            return onEdit({ index, rows, options, onChange });
          }
        : undefined;

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
            .filter(config => config.get('visible') !== false)
            .map(config => {
              const Field = fieldFromConfig(config, appliedComponents);
              const {
                name,
                type,
                // Extract component because we don't want it as a field prop
                component,
                ...fieldProps
              } = config.toObject();
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
                      ...fieldProps,
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
              index={index}
              fields={fields}
              options={options}
              onDelete={!disabled ? handleDeleteRow : undefined}
              onEdit={!disabled ? handleEditRow : undefined}
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
            onAdd={!disabled ? handleAddRow : undefined}
            options={options}
            placeholder={provided.placeholder}
          />
        )}
      </Droppable>
    </DragDropContext>
  );
};

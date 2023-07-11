import React, { useState, Fragment } from 'react';
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

const SelectInput = props => (
  <select
    id={props.id}
    name={props.name}
    value={props.value || ''}
    onBlur={props.onBlur}
    onChange={props.onChange}
    onFocus={props.onFocus}
    form={props.form}
  >
    <option value="" />
    {props.options.map(option => (
      <option value={option.get('value')} key={option.get('value')}>
        {option.get('label')}
      </option>
    ))}
  </select>
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
            .filter(config => config.get('visible') !== false)
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
  drag: 'DragHandle',
  display: 'TextDisplay',
  checkbox: 'CheckboxInput',
  select: 'SelectInput',
  text: 'TextInput',
};

const defaultComponents = {
  TableLayout,
  RowLayout,
  DragHandle,
  TextDisplay,
  CheckboxInput,
  SelectInput,
  TextInput,
};

const fieldFromConfig = (config, components = {}) => {
  return (
    config.get('component') ||
    components[typeToComponent[config.get('type')]] ||
    components['TextDisplay']
  );
};

const getEmptyRowValues = options =>
  options
    // Exclude drag columns from data object
    .filter(config => config.get('type') !== 'drag')
    // Reduce list of options to a map ov values
    .reduce(
      (row, config) =>
        row.set(
          config.get('name'),
          typeof config.get('initialValue') !== 'undefined'
            ? config.get('initialValue')
            : config.get('type') === 'checkbox'
              ? false
              : '',
        ),
      Map(),
    );

export const TableInput = props => {
  const {
    components = {},
    options,
    rows,
    onChange,
    onAdd,
    omitAdd,
    autoAdd,
    onDelete,
    omitDelete,
    onEdit,
    disabled,
    form,
  } = props;
  // State for new order row
  const [newRow, setNewRow] = useState(getEmptyRowValues(options));
  // Change event for new row
  const newFieldChangeHandler =
    !disabled && autoAdd
      ? (name, type) => e => {
          // Update the new row value
          const updatedValues = newRow.set(
            name,
            e && e.target
              ? type === 'checkbox'
                ? e.target.checked
                : e.target.value
              : e,
          );
          // Check if all required values in the new row have data, and if they
          // do, add that row and reset the newRow to initial values
          if (
            options
              .filter(option => option.get('required'))
              .every(option => !!updatedValues.get(option.get('name')))
          ) {
            onChange(rows.push(updatedValues));
            setNewRow(getEmptyRowValues(options));
          } else {
            // Otherwise just update the current field in the new row
            setNewRow(updatedValues);
          }
        }
      : undefined;

  // Create a list of components, overriding any defualts by those provided
  const appliedComponents = {
    ...defaultComponents,
    ...components,
  };
  const { RowLayout, TableLayout } = appliedComponents;

  // Disable drag if there are no columns of type drag
  const isDragDisabled = !options.some(option => option.get('type') === 'drag');
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

  // Create add handler for adding new rows to the table
  const handleAddRow =
    !disabled && !omitAdd && !autoAdd
      ? typeof onAdd === 'function'
        ? // If onAdd is provided, us it as the handler, and pass the data it
          // may need and the onChange function
          event => onAdd(event, { rows, options, onChange })
        : // Otherwise, add a blank row
          () => onChange(rows.push(getEmptyRowValues(options)))
      : undefined;

  const rowCount = rows.size;
  const fieldRows = rows
    // Add new row if autoAdd is enabled
    .push(!disabled && autoAdd && newRow)
    .filter(Boolean)
    .map((row, index) => {
      // Create delete handler for a row
      const handleDeleteRow =
        !disabled && !omitDelete
          ? typeof onDelete === 'function'
            ? // If onDelete is provided, us it as the handler, and pass the data
              // it may need and the onChange function
              event => onDelete(event, { index, rows, options, onChange })
            : // Otherwise, delete the row
              () => onChange(rows.delete(index))
          : undefined;

      // Create edit handler for a row, but only if onEdit was provided
      const handleEditRow =
        !disabled && typeof onEdit === 'function'
          ? event => onEdit(event, { index, rows, options, onChange })
          : undefined;

      return (
        <Draggable
          draggableId={`draggable${index}`}
          index={index}
          key={index}
          isDragDisabled={isDragDisabled}
        >
          {(provided, snapshot) => {
            // Check if we're on a new row (not one that's saved in the table)
            const isNewRow = index >= rowCount;
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
                  options: optionsOrig,
                  // Extract component because we don't want it as a field prop
                  component,
                  ...fieldProps
                } = config.toObject();
                const fieldChangeHandler = e =>
                  onChange(
                    rows.setIn(
                      [index, name],
                      e && e.target
                        ? type === 'checkbox'
                          ? e.target.checked
                          : e.target.value
                        : e,
                    ),
                  );
                const props =
                  type === 'drag'
                    ? provided.dragHandleProps
                    : {
                        visible: true,
                        ...fieldProps,
                        name,
                        value: row.get(name),
                        onChange: !isNewRow
                          ? fieldChangeHandler
                          : newFieldChangeHandler(name, type),
                        // If options is a function, pass it the current value
                        // so we can do things like only allow each value to be
                        // selected once
                        options:
                          typeof optionsOrig === 'function'
                            ? optionsOrig({ value: row.get(name) })
                            : optionsOrig,
                        enabled: !disabled,
                        form,
                        row,
                      };
                return <Field {...props} />;
              });

            return (
              <RowLayout
                draggableRef={provided.innerRef}
                draggableProps={provided.draggableProps}
                dragging={snapshot.isDragging}
                index={index}
                rowCount={rowCount}
                fields={fields}
                options={options}
                onDelete={!isNewRow ? handleDeleteRow : undefined}
                onEdit={!isNewRow ? handleEditRow : undefined}
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

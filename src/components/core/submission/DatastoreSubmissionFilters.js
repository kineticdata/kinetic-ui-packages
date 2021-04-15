import { isImmutable, List, Range } from 'immutable';
import { fetchForm } from '../../../apis';
import { defineKqlQuery } from '../../../helpers';

export const filterDataSources = ({ formSlug }) => ({
  form: {
    fn: fetchForm,
    params: [{ datastore: true, formSlug, include: 'indexDefinitions' }],
    transform: result => result.form,
  },
  indexOptions: {
    fn: form =>
      form
        .get('indexDefinitions')
        .map(indexDefinition => ({
          label: indexDefinition.get('name'),
          value: indexDefinition.get('name'),
        }))
        .toArray(),
    params: ({ form }) => form && [form],
  },
  maxLength: {
    fn: form =>
      form
        .get('indexDefinitions')
        .map(indexDefinition => indexDefinition.get('parts').size)
        .max(),
    params: ({ form }) => form && [form],
  },
  selectedIndexDefinition: {
    fn: (form, index) =>
      form
        .get('indexDefinitions')
        .find(indexDefinition => indexDefinition.get('name') === index),
    params: ({ form, values }) => values && [form, values.get('index')],
  },
});

const getOperatorIndex = name => {
  const match = name.match(/op(\d+)-operator/);
  return match && parseInt(match[1]);
};

const indexChangeFn = ({ maxLength, values }, { setValue }) => {
  Range(0, maxLength)
    .map(i => `op${i}-operator`)
    .filter(name => !!values.get(name))
    .forEach(name => setValue(name, ''));
};

const operatorChangeFn = i => ({ values }, { setValue }) => {
  const value = values.get(`op${i}-operator`);
  // If the operator was set to something besides 'eq' or 'in' clear any
  // operators after this. Their change events will then fire and clear the
  // corresponding operands.
  if (!['equals', 'in'].includes(value)) {
    values
      .filter((value, name) => getOperatorIndex(name) > i)
      .forEach((_value, name) => setValue(name, ''));
  }
  // If the operator was set to '' and the first operand is set, clear it.
  if (!value && values.get(`op${i}-operand1`)) {
    setValue(`op${i}-operand1`, '');
  }
  // If the operator is not 'bt' and the second operand is set, clear it.
  if (value !== 'between' && values.get(`op${i}-operand2`)) {
    setValue(`op${i}-operand2`, '');
  }
  // If the operator is not 'in and the third operand is set, clear it.
  if (value !== 'in' && !values.get(`op${i}-operand3`).isEmpty()) {
    setValue(`op${i}-operand3`, List());
  }
};

const enabledFn = i => ({ values }) =>
  Range(0, i, -1)
    .map(i => values.get(`op${i}-operator`))
    .every(value => ['equals', 'in'].includes(value));

const visibleFn = (i, operatorType) => ({ selectedIndexDefinition, values }) =>
  selectedIndexDefinition &&
  i < selectedIndexDefinition.get('parts').size &&
  (!operatorType || values.get(`op${i}-operator`) === operatorType);

const serializeQuery = ({ selectedIndexDefinition, values }) => ({
  index: values.get('index'),
  parts: selectedIndexDefinition
    .get('parts')
    .reduce((reduction, part, i) => {
      const operator = values.get(`op${i}-operator`);
      const rValues =
        operator === 'between'
          ? [values.get(`op${i}-operand1`), values.get(`op${i}-operand2`)]
          : operator === 'in'
            ? [values.get(`op${i}-operand3`)]
            : [values.get(`op${i}-operand1`)];
      return reduction.push(List([part, operator, ...rValues]));
    }, List())
    .filter(
      part =>
        !part.some(
          term => (isImmutable(term) && term.isEmpty()) || term.length === 0,
        ),
    ),
  q: selectedIndexDefinition
    .get('parts')
    .reduce((query, part, i) => {
      const op = values.get(`op${i}-operator`);
      return op === 'between'
        ? query.between(part, `op${i}-operand1`, `op${i}-operand2`)
        : op === 'in'
          ? query.in(part, `op${i}-operand3`)
          : op
            ? query[op](part, `op${i}-operand1`)
            : query;
    }, defineKqlQuery())
    .end()(values.toJS()),
});

export const filters = () => ({ form, indexOptions, maxLength }) =>
  form &&
  indexOptions &&
  maxLength && [
    {
      label: 'Search By',
      initialValue: indexOptions.first().get('value'),
      name: 'index',
      onChange: indexChangeFn,
      options: indexOptions,
      transient: true,
      type: 'select',
    },
    ...Range(0, maxLength)
      .flatMap(i => [
        {
          enabled: enabledFn(i),
          name: `op${i}-operator`,
          type: 'select',
          visible: visibleFn(i),
          onChange: operatorChangeFn(i),
          options: [
            { label: '=', value: 'equals' },
            { label: 'in', value: 'in' },
            { label: '>', value: 'greaterThan' },
            { label: '>=', value: 'greaterThanOrEquals' },
            { label: '<', value: 'lessThan' },
            { label: '<=', value: 'lessThanOrEquals' },
            { label: 'between', value: 'between' },
            { label: 'startsWith', value: 'startsWith' },
          ],
          transient: true,
        },
        {
          enabled: enabledFn(i),
          name: `op${i}-operand1`,
          transient: true,
          type: 'text',
          visible: visibleFn(i),
        },
        {
          enabled: enabledFn(i),
          name: `op${i}-operand2`,
          transient: true,
          type: 'text',
          visible: visibleFn(i, 'between'),
        },
        {
          enabled: enabledFn(i),
          name: `op${i}-operand3`,
          transient: true,
          type: 'text-multi',
          visible: visibleFn(i, 'in'),
        },
      ])
      .toArray(),
    {
      name: 'query',
      type: null,
      serialize: serializeQuery,
    },
  ];

import { List, Map, Range } from 'immutable';
import moment from 'moment';
import { fetchForm, fetchKapp, fetchSpace } from '../../../apis';
import { defineKqlQuery, MAX_PART_LENGTH, TIMELINES } from '../../../helpers';
import { availableParts, getUsedFields } from './helpers';

export const filterDataSources = ({ formSlug, kappSlug }) => ({
  form: {
    fn:
      !formSlug && !kappSlug
        ? fetchSpace
        : kappSlug && !formSlug
          ? fetchKapp
          : fetchForm,
    params: [
      { kappSlug, formSlug, include: 'indexDefinitions,fields,fields.details' },
    ],
    transform: result =>
      !formSlug && !kappSlug
        ? result.space
        : kappSlug && !formSlug
          ? result.kapp
          : result.form,
  },
  fields: {
    fn: form =>
      form
        .get('fields')
        .filter(f => f.get('dataType') !== 'file')
        .map(f => `values[${f.get('name')}]`),
    params: ({ form }) => form && [form],
  },
  indexDefinitions: {
    fn: form => form.get('indexDefinitions'),
    params: ({ form }) => form && [form],
  },
});

const getPartIndex = name => {
  const match = name.match(/op(\d+)-part/);
  return match && parseInt(match[1]);
};

const getOrderPartIndex = name => {
  const match = name.match(/orderby(\d+)-part/);
  return match && parseInt(match[1]);
};

const operatorChangeFn = i => ({ values }, { setValue }) => {
  const value = values.get(`op${i}-operator`);

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

const partChangeFn = i => ({ values }, { setValue }) => {
  // If the operator was set to something besides 'eq' or 'in' clear any
  // operators after this. Their change events will then fire and clear the
  // corresponding operands.
  values
    .filter((value, name) => getPartIndex(name) > i)
    .forEach((_value, name) => setValue(name, '', false));
  setValue('range-part', '', false);
  Range(0, MAX_PART_LENGTH).forEach(i =>
    setValue(`orderby${i}-part`, '', false),
  );
};

const orderChangeFn = i => ({ values }, { setValue }) => {
  const value = values.get(`orderby${i}-part`);

  if (!value || TIMELINES.includes(value)) {
    values
      .filter((value, name) => getOrderPartIndex(name) > i)
      .forEach((_value, name) => setValue(name, '', false));
  }
};

const enabledFn = i => ({ values }) =>
  Range(0, i, -1)
    .map(i => values.get(`op${i}-part`))
    .every(value => value);

const rangeVisibleFn = (operatorType, timeline = false) => ({
  values,
  indexDefinitions,
}) => {
  const usedFields = getUsedFields(values, -1, 'range');
  const partsAvailable = availableParts(
    values,
    indexDefinitions,
    usedFields,
    'range',
  );

  const isOperandValid = operatorType
    ? !timeline
      ? operatorType === 'between'
        ? !TIMELINES.includes(values.get('range-part')) &&
          values.get('range-operator') === 'between'
        : !TIMELINES.includes(values.get('range-part'))
      : operatorType === 'between'
        ? TIMELINES.includes(values.get('range-part')) &&
          values.get('range-operator') === 'between'
        : TIMELINES.includes(values.get('range-part'))
    : true;

  return isOperandValid && partsAvailable.size > 0;
};
const visibleFn = (currentPart, i, operatorType) => ({
  values,
  indexDefinitions,
}) => {
  const hasRange = values.get('range-part') !== '';
  const hasOrderBy =
    Range(0, MAX_PART_LENGTH)
      .map(i => values.get(`orderby${i}-part`))
      .filter(v => v !== '')
      .toList().size > 0;
  const usedFields = getUsedFields(values, i, 'eq');
  const partsAvailable = availableParts(
    values,
    indexDefinitions,
    usedFields,
    'eq',
  );

  // If this equality has this operator type selected.
  if (operatorType) return values.get(`op${i}-operator`) === operatorType;

  // If there's a range value set and this equality is not.
  if ((hasRange || hasOrderBy) && !values.get(`op${i}-part`)) return false;

  // If it is the first equality or the previous equality has a value set and
  // this equality has available options.
  return (i === 0 || values.get(`op${i - 1}-part`)) && partsAvailable.size > 0;
};

const orderVisibleFn = partIndex => bindings => {
  const { values } = bindings;

  const prevPart = values.get(`orderby${partIndex - 1}-part`);
  return (
    partIndex === 0 ||
    (!values.get('range-part') && prevPart && !TIMELINES.includes(prevPart))
  );
};

export const availableOptions = (partType, partIndex) => bindings => {
  const { values, indexDefinitions } = bindings;

  const usedFields = getUsedFields(values, partIndex, partType);
  const partsAvailable = availableParts(
    values,
    indexDefinitions,
    usedFields,
    partType,
  ).flatten();
  const valueParts = partsAvailable.filter(f => f.startsWith('values[')).sort();
  const staticParts = partsAvailable
    .filterNot(f => f.startsWith('values['))
    .sort();
  return valueParts.concat(staticParts).map(f => Map({ label: f, value: f }));
};

const getRValues = (operator, values, opBase, isTimeline = false) => {
  const v1 = isTimeline
    ? values.get(`${opBase}-operand3`)
    : values.get(`${opBase}-operand1`);
  const v2 = isTimeline
    ? values.get(`${opBase}-operand4`)
    : values.get(`${opBase}-operand2`);

  return operator === 'between'
    ? [v1, v2]
    : operator === 'in'
      ? [values.get(`${opBase}-operand3`)]
      : [v1];
};

const getSerializedParts = values =>
  Range(0, MAX_PART_LENGTH)
    .filter(i => values.get(`op${i}-part`))
    .map(i => {
      // Handle the equality parts.
      const part = values.get(`op${i}-part`);
      const operator = values.get(`op${i}-operator`);
      const rValues = getRValues(operator, values, `op${i}`);

      return List([part, operator, `op${i}`, ...rValues]);
    })
    .toList()
    .update(ps => {
      const rangePart = values.get('range-part');
      const rangeOp = values.get('range-operator');
      const rangeValues = getRValues(
        rangeOp,
        values,
        'range',
        TIMELINES.includes(rangePart),
      );

      return rangePart
        ? ps.push(List([rangePart, rangeOp, 'range', ...rangeValues]))
        : ps;
    });

const serializeQuery = ({ values }) => {
  const parts = getSerializedParts(values);
  return {
    parts,
    q: parts
      .reduce((query, partEntry) => {
        const [part, operator, opBase] = partEntry;
        const op1 =
          opBase === 'range' && TIMELINES.includes(part)
            ? `${opBase}-operand3`
            : `${opBase}-operand1`;
        const op2 =
          opBase === 'range' && TIMELINES.includes(part)
            ? `${opBase}-operand4`
            : `${opBase}-operand2`;
        const op3 = `${opBase}-operand3`;

        return operator === 'between'
          ? query.between(part, op1, op2, true)
          : operator === 'in'
            ? query.in(part, op3, true)
            : operator
              ? query[operator](part, op1, true)
              : query;
      }, defineKqlQuery())
      .end()(
      values
        .map(
          (v, k) =>
            ['range-operand3', 'range-operand4'].includes(k) && v
              ? moment(v).toISOString()
              : v,
        )
        .toJS(),
    ),
    orderBy: Range(0, MAX_PART_LENGTH)
      .map(i => values.get(`orderby${i}-part`))
      .filter(v => v)
      .toArray()
      .join(','),
  };
};

export const filters = () => ({ form, indexDefinitions }) =>
  form &&
  indexDefinitions && [
    ...Range(0, MAX_PART_LENGTH)
      .flatMap(i => [
        {
          enabled: enabledFn(i),
          name: `op${i}-part`,
          type: 'select',
          visible: visibleFn(`op${i}-part`, i),
          onChange: partChangeFn(i),
          options: availableOptions('eq', i),
          transient: true,
        },
        {
          enabled: enabledFn(i),
          name: `op${i}-operator`,
          type: 'select',
          visible: visibleFn(`op${i}-part`, i),
          onChange: operatorChangeFn(i),
          options: [
            { label: '=', value: 'equals' },
            { label: 'in', value: 'in' },
          ],
          initialValue: 'equals',
          transient: true,
        },

        {
          enabled: enabledFn(i),
          name: `op${i}-operand1`,
          transient: true,
          type: 'text',
          visible: visibleFn(`op${i}-part`, i),
        },
        {
          enabled: enabledFn(i),
          name: `op${i}-operand2`,
          transient: true,
          type: 'text',
          visible: visibleFn(`op${i}-part`, i, 'between'),
        },
        {
          enabled: enabledFn(i),
          name: `op${i}-operand3`,
          transient: true,
          type: 'text-multi',
          visible: visibleFn(`op${i}-part`, i, 'in'),
        },
      ])
      .toArray(),
    {
      name: 'range-part',
      type: 'select',
      visible: rangeVisibleFn(),
      options: availableOptions('range'),
      onChange: ({ values }, { setValue }) => {
        // Recalculate order by.
        const value = values.get('range-part');

        // Clear out all of the order by values, range supersedes.
        setValue('orderby0-part', value);
        Range(1, MAX_PART_LENGTH).forEach(i =>
          setValue(`orderby${i}-part`, ''),
        );
      },
      transient: true,
    },
    {
      name: 'range-operator',
      type: 'select',
      visible: rangeVisibleFn(),
      options: [
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
      name: 'range-operand1',
      transient: true,
      type: 'text',
      visible: rangeVisibleFn('eq', false),
    },
    {
      name: 'range-operand2',
      transient: true,
      type: 'text',
      visible: rangeVisibleFn('between', false),
    },
    {
      name: 'range-operand3',
      transient: true,
      type: 'datetime',
      visible: rangeVisibleFn('eq', true),
    },
    {
      name: 'range-operand4',
      transient: true,
      type: 'datetime',
      visible: rangeVisibleFn('between', true),
    },
    {
      name: 'orderDirection',
      type: 'select',
      options: [
        { label: 'ASC', value: 'ASC' },
        { label: 'DESC', value: 'DESC' },
      ],
      initialValue: 'DESC',
      required: true,
    },
    ...Range(0, MAX_PART_LENGTH)
      .flatMap(i => [
        {
          name: `orderby${i}-part`,
          transient: true,
          type: 'select',
          onChange: orderChangeFn(i),
          enabled: ({ values }) => !values.get('range-part'),
          options: availableOptions('orderBy', i),
          visible: orderVisibleFn(i),
        },
      ])
      .toArray(),
    { name: 'query', type: null, serialize: serializeQuery },
  ];

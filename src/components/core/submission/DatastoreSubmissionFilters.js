import { List, Map, Range } from 'immutable';
import moment from 'moment';
import { fetchForm, fetchKapp, fetchSpace } from '../../../apis';
import {
  defineKqlQuery,
  INDEX_STATIC_PARTS,
  TIMELINES,
} from '../../../helpers';

export const MAX_PART_LENGTH = 10;

const TIMELINES_AND_STATICS = TIMELINES.concat(INDEX_STATIC_PARTS).sort();

export const filterDataSources = ({ formSlug, kappSlug }) => ({
  form: {
    fn:
      !formSlug && !kappSlug
        ? fetchSpace
        : kappSlug && !formSlug
          ? fetchKapp
          : fetchForm,
    params: [{ kappSlug, formSlug, include: 'indexDefinitions,fields' }],
    transform: result =>
      !formSlug && !kappSlug
        ? result.space
        : kappSlug && !formSlug
          ? result.kapp
          : result.form,
  },
  fields: {
    fn: form => form.get('fields').map(f => `values[${f.get('name')}]`),
    params: ({ form }) => form && [form],
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
  const value = values.get(`op${i}-part`);
  // If the operator was set to something besides 'eq' or 'in' clear any
  // operators after this. Their change events will then fire and clear the
  // corresponding operands.
  if (!value) {
    values
      .filter((value, name) => getPartIndex(name) > i)
      .forEach((_value, name) => setValue(name, '', false));
  }
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

const visibleFn = (i, operatorType) => ({ values }) =>
  operatorType
    ? values.get(`op${i}-operator`) === operatorType
    : i === 0 || values.get(`op${i - 1}-part`);

const availableOptions = currentPart => ({ values, fields }) => {
  const usedFields = Range(0, MAX_PART_LENGTH)
    .map(i => values.get(`op${i}-part`))
    .toList()
    .push(values.get('range-part'))
    .filter(f => f !== '');

  return fields
    .concat(
      currentPart.startsWith('range')
        ? TIMELINES_AND_STATICS
        : INDEX_STATIC_PARTS,
    )
    .filter(
      f =>
        (currentPart.startsWith('range') && TIMELINES.includes(f)) ||
        ((values.get(currentPart) === f || !usedFields.includes(f)) &&
          !TIMELINES.includes(f)),
    )
    .map(f => Map({ label: f, value: f }));
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
          ? query.between(part, op1, op2)
          : operator === 'in'
            ? query.in(part, op3)
            : operator
              ? query[operator](part, op1)
              : query;
      }, defineKqlQuery())
      .end()(
      values
        .map((v, k) => (TIMELINES.includes(k) ? moment(v).toISOString() : v))
        .toJS(),
    ),
    orderBy: Range(0, MAX_PART_LENGTH)
      .map(i => values.get(`orderby${i}-part`))
      .filter(v => v)
      .toArray()
      .join(','),
  };
};

export const filters = () => ({ form, fields, indexOptions }) =>
  form &&
  indexOptions && [
    ...Range(0, MAX_PART_LENGTH)
      .flatMap(i => [
        {
          enabled: enabledFn(i),
          name: `op${i}-part`,
          type: 'select',
          visible: visibleFn(i),
          onChange: partChangeFn(i),
          options: availableOptions(`op${i}-part`),
          transient: true,
        },
        {
          enabled: enabledFn(i),
          name: `op${i}-operator`,
          type: 'select',
          visible: visibleFn(i),
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
      name: 'range-part',
      type: 'select',
      options: availableOptions('range-part'),
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
      visible: ({ values }) => !TIMELINES.includes(values.get('range-part')),
    },
    {
      name: 'range-operand2',
      transient: true,
      type: 'text',
      visible: ({ values }) =>
        !TIMELINES.includes(values.get('range-part')) &&
        values.get('range-operator') === 'between',
    },
    {
      name: 'range-operand3',
      transient: true,
      type: 'datetime',
      visible: ({ values }) => TIMELINES.includes(values.get('range-part')),
    },
    {
      name: 'range-operand4',
      transient: true,
      type: 'datetime',
      visible: ({ values }) =>
        TIMELINES.includes(values.get('range-part')) &&
        values.get('range-operator') === 'between',
    },
    {
      name: 'orderDirection',
      type: 'select',
      options: [
        { label: 'ASC', value: 'ASC' },
        { label: 'DESC', value: 'DESC' },
      ],
      initialValue: 'ASC',
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
          options: ({ values }) => {
            const usedFields = Range(0, MAX_PART_LENGTH)
              .map(i => values.get(`orderby${i}-part`))
              .toList()
              .filter(f => f !== '');

            return (
              fields
                .concat(TIMELINES_AND_STATICS)
                // Filter out the fields that are already used in parts.
                .filter(
                  f =>
                    values.get(`orderby${i}-part`) === f ||
                    !usedFields.includes(f),
                )
                .map(f => Map({ label: f, value: f }))
            );
          },
          visible: ({ values }) => {
            const prevPart = values.get(`orderby${i - 1}-part`);
            return (
              i === 0 ||
              (!values.get('range-part') &&
                prevPart &&
                !TIMELINES.includes(prevPart))
            );
          },
        },
      ])
      .toArray(),
    // {
    //   name: 'timeline',
    //   transient: true,
    //   type: 'select',
    //   options: TIMELINES.map(t => Map({ label: t, value: t })),
    //   visible: ({ values }) => values.get('timeline') !== '',
    //   enabled: ({ values }) => !TIMELINES.includes(values.get('range-part')),
    // },
    {
      name: 'query',
      type: null,
      serialize: serializeQuery,
    },
  ];

import { Seq } from 'immutable';
import {
  isArray,
  isEmpty,
  isString,
  constant,
  every,
  last,
  map,
  some,
} from 'lodash-es';
import { get, isImmutable } from 'immutable';

const defineKqlQuery = () => new SearchBuilder('kql');
const defineFilter = (caseInsensitive, rootOperator) =>
  new SearchBuilder('filter', caseInsensitive, rootOperator);

class SearchBuilder {
  constructor(type, caseInsensitive = false, rootOperator = 'and') {
    this.caseInsensitive = caseInsensitive;
    this.type = type;
    this.rootExpression = { operator: rootOperator, operands: [] };
    this.expressionStack = [this.rootExpression];
  }

  and() {
    return pushExpression(this, {}, 'and');
  }

  between(field, minValue, maxValue, strict) {
    return pushExpression(this, { strict }, 'bt', field, minValue, maxValue);
  }

  equals(field, value, strict) {
    return pushExpression(this, { strict }, 'eq', field, value);
  }

  greaterThan(field, value, strict) {
    return pushExpression(this, { strict }, 'gt', field, value);
  }

  greaterThanOrEquals(field, value, strict) {
    return pushExpression(this, { strict }, 'gte', field, value);
  }

  in(field, values, strict) {
    return pushExpression(this, { strict }, 'in', field, values);
  }

  lessThan(field, value, strict) {
    return pushExpression(this, { strict }, 'lt', field, value);
  }

  lessThanOrEquals(field, value, strict) {
    return pushExpression(this, { strict }, 'lte', field, value);
  }

  or() {
    return pushExpression(this, {}, 'or');
  }

  startsWith(field, value) {
    return pushExpression(this, {}, 'sw', field, value);
  }

  matches(field, value) {
    return pushExpression(this, {}, 'mt', field, value);
  }

  end() {
    if (this.expressionStack.length === 1) {
      return this.type === 'kql'
        ? values =>
            compileKqlQuery(this.rootExpression, values)
              .replace(/^\s*\(\s*/, '')
              .replace(/\s*\)\s*$/, '')
        : compileExpression(this.rootExpression);
    } else {
      this.expressionStack.pop();
      return this;
    }
  }
}

// This could be a method of SearchBuilder but we don't have a way to make it
// private so its here...
// The last entry in expressionStack will always be an 'and' / 'or' operation,
// so we push the given expression to the end of that one. Then if the given
// expression is another 'and' / 'or' operation we push the new expression
// to the expression stack and subsequent expressions will be added to that one.
const pushExpression = (self, options, operator, ...operands) => {
  const currentExpression = last(self.expressionStack);
  currentExpression.operands.push({
    operator,
    operands,
    options: { caseInsensitive: self.caseInsensitive, ...options },
  });
  if (['and', 'or'].includes(operator)) {
    self.expressionStack.push(last(currentExpression.operands));
  }
  return self;
};

const nullFix = val =>
  val === null || typeof val === 'undefined' ? '""' : `"${val}"`;

const compileKqlQuery = ({ operator, operands, options }, values) => {
  switch (operator) {
    case 'or':
    case 'and':
      const andContents = operands
        .map(operand => compileKqlQuery(operand, values))
        .filter(op => op !== '');

      const combinator = operator === 'and' ? 'AND' : 'OR';
      return andContents.length > 0
        ? `( ${andContents.join(` ${combinator} `)} )`
        : '';
    case 'eq':
      return options.strict || values[operands[1]]
        ? `${operands[0]} = ${nullFix(values[operands[1]])}`
        : '';
    case 'sw':
      return options.strict || values[operands[1]]
        ? `${operands[0]} =* ${nullFix(values[operands[1]])}`
        : '';
    case 'mt':
      return values[operands[1]]
        ? `${operands[0]} *=* ${nullFix(values[operands[1]])}`
        : '';
    case 'in': {
      const rval = values[operands[1]];
      const inList = rval
        ? rval
            .filter(val => (options.strict ? true : val))
            .map(val => nullFix(val))
            .join(', ')
        : '';
      return inList ? `${operands[0]} IN (${inList})` : '';
    }
    case 'bt': {
      const lval = operands[0];
      const rval1 = values[operands[1]];
      const rval2 = values[operands[2]];
      return options.strict || (rval1 && rval2)
        ? `${lval} BETWEEN (${nullFix(rval1)}, ${nullFix(rval2)})`
        : '';
    }
    case 'gt':
      return options.strict || values[operands[1]]
        ? `${operands[0]} > ${nullFix(values[operands[1]])}`
        : '';
    case 'gte':
      return options.strict || values[operands[1]]
        ? `${operands[0]} >= ${nullFix(values[operands[1]])}`
        : '';
    case 'lt':
      return options.strict || values[operands[1]]
        ? `${operands[0]} < ${nullFix(values[operands[1]])}`
        : '';
    case 'lte':
      return options.strict || values[operands[1]]
        ? `${operands[0]} <= ${nullFix(values[operands[1]])}`
        : '';
    default:
      return '';
  }
};

const compileExpression = ({ operator, operands, options }) => {
  switch (operator) {
    case 'and':
      return andOperation(operands);
    case 'bt':
      return betweenOperation(options, ...operands);
    case 'eq':
      return equalsOperation(options, ...operands);
    case 'gt':
      return greaterThanOperation(options, ...operands);
    case 'gte':
      return greaterThanOrEqualsOperation(options, ...operands);
    case 'in':
      return inOperation(options, ...operands);
    case 'lt':
      return lessThanOperation(options, ...operands);
    case 'lte':
      return lessThanOrEqualsOperation(options, ...operands);
    case 'or':
      return orOperation(operands);
    case 'sw':
      return startsWithOperation(options, ...operands);
    case 'mt':
      return matchesOperation(options, ...operands);
    default:
      return constant(true);
  }
};

const andOperation = expressions => {
  const fns = map(expressions, compileExpression);
  return (object, filters) => every(fns, fn => fn(object, filters));
};

const orOperation = expressions => {
  const fns = map(expressions, compileExpression);
  return (object, filters) => some(fns, fn => fn(object, filters));
};

const betweenOperation = (options, lvalue, rvalueMin, rvalueMax) => (
  object,
  filters,
) => {
  const left = object[lvalue];
  const right1 = get(filters, rvalueMin);
  const right2 = get(filters, rvalueMax);
  // If the filter value is empty and strict is not enabled we skip the filter
  // by returning true.
  if ((isNullOrEmpty(right1) || isNullOrEmpty(right2)) && !options.strict) {
    return true;
  }
  if (compare(right1, right2, options, typeof left) <= 0) {
    throw new Error(
      `Invalid filter values for between operation of ${rvalueMin} and ` +
        `${rvalueMax}. Min ${JSON.stringify(right1)} not less than max ` +
        JSON.stringify(right2) +
        (options.caseInsensitive ? ' (caseInsensitive)' : ''),
    );
  }
  return (
    compare(left, right1, options) <= 0 && compare(left, right2, options) > 0
  );
};

const equalsOperation = (options, lvalue, rvalue) => (object, filters) =>
  skip(get(filters, rvalue), options) ||
  compare(object[lvalue], get(filters, rvalue), options) === 0;

const greaterThanOperation = (options, lvalue, rvalue) => (object, filters) =>
  skip(get(filters, rvalue), options) ||
  compare(object[lvalue], get(filters, rvalue), options) < 0;

const greaterThanOrEqualsOperation = (options, lvalue, rvalue) => (
  object,
  filters,
) =>
  skip(get(filters, rvalue), options) ||
  compare(object[lvalue], get(filters, rvalue), options) <= 0;

const inOperation = (options, lvalue, rvalue) => (object, filters) => {
  // If the filter value is [], null, undefined then we check for the strict
  // option, if strict always return false and if not strict always return
  // true (because we are effectively skipping this filter operation).
  if (isNullOrEmpty(get(filters, rvalue)) && !isString(get(filters, rvalue))) {
    return !options.strict;
  }
  // If we got a non-empty filter value that isn't an array (like a string)
  // we throw an error.
  if (!isArray(get(filters, rvalue)) && !isImmutable(get(filters, rvalue))) {
    throw new Error(
      `Invalid filter value for in operation of ${rvalue} filter. Got ${JSON.stringify(
        get(filters, rvalue),
      )}. Require an array.`,
    );
  }
  // Finally perform the operation by checking the filter value for membership
  // of the object value.
  return Seq(get(filters, rvalue)).some(
    v => compare(get(object, lvalue), v, options) === 0,
  );
};

const lessThanOperation = (options, lvalue, rvalue) => (object, filters) =>
  skip(get(filters, rvalue), options) ||
  compare(object[lvalue], get(filters, rvalue), options) > 0;

const lessThanOrEqualsOperation = (options, lvalue, rvalue) => (
  object,
  filters,
) =>
  skip(get(filters, rvalue), options) ||
  compare(object[lvalue], get(filters, rvalue), options) >= 0;

const startsWithOperation = (options, lvalue, rvalue) => {
  const normalize = normalization(options);
  return (object, filters) =>
    isNullOrEmpty(get(filters, rvalue)) ||
    (object[lvalue] &&
      normalize(object[lvalue]).startsWith(normalize(get(filters, rvalue))));
};

const matchesOperation = (options, lvalue, rvalue) => {
  const normalize = normalization(options);
  return (object, filters) =>
    isNullOrEmpty(get(filters, rvalue)) ||
    (object[lvalue] &&
      normalize(object[lvalue]).includes(normalize(get(filters, rvalue))));
};

const skip = (filterValue, options) =>
  isNullOrEmpty(filterValue) && !options.strict;

// Helper that normalizes comparing values when one or both of the values is
// falsy. Our convention is (any truthy) > '' > null > undefined.
const compare = (left, right, options, type = typeof left) => {
  const normalize = normalization(options);
  if (nonNull(left) && nonNull(right)) {
    return normalize(right, type) > normalize(left, type)
      ? 1
      : normalize(right, type) === normalize(left, type)
        ? 0
        : -1;
  } else {
    const falsyRanks = [undefined, null, ''];
    const leftRank = nonNull(left) ? 3 : falsyRanks.indexOf(left);
    const rightRank = nonNull(right) ? 3 : falsyRanks.indexOf(right);
    return rightRank > leftRank ? 1 : rightRank === leftRank ? 0 : -1;
  }
};

const nonNull = v => v || v === 0 || v === false;

const normalization = options => (value, coerceType) =>
  options.caseInsensitive
    ? toLower(coerce(value, coerceType))
    : coerce(value, coerceType);

const isNullOrEmpty = value =>
  (isString(value) && isEmpty(value)) ||
  (isArray(value) && isEmpty(value)) ||
  value === null ||
  value === undefined;

const coerce = (value, type) => {
  if (
    // no-op if a type is not specified
    !type ||
    // return value if it is already the correct type
    typeof value === type ||
    // do not attempt to coerce null / undefined
    value === null ||
    typeof value === 'undefined' ||
    // do not attempt to coerce to undefined or object (which type null returns)
    type === 'undefined' ||
    type === 'object'
  ) {
    return value;
  }
  const valueType = typeof value;
  // if-else conditions below perform the actual type coercion, if a value is
  // not returned
  if (type === 'number' && valueType === 'string') {
    return parseInt(value);
  } else if (type === 'boolean' && valueType === 'string') {
    if (value === 'true') {
      return true;
    } else if (value === 'false') {
      return false;
    }
  }
  throw new Error(`Cannot coerce value ${JSON.stringify(value)} to ${type}.`);
};

const toLower = value => (isString(value) ? value.toLocaleLowerCase() : value);

export { defineKqlQuery, defineFilter };

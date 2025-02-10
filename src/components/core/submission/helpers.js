import { fromJS, List, Range } from 'immutable';
import { TIMELINES, MAX_PART_LENGTH } from '../../../helpers';

export const getUsedFields = (values, partIndex, partType = 'eq') => {
  let equalities = List();

  if (partType === 'eq' && partIndex === 0) {
    equalities = List();
  } else if (partType === 'eq' && partIndex === 1) {
    equalities = List([values.get('op0-part')]);
  } else if (partType === 'eq') {
    equalities = Range(0, partIndex)
      .map(i => values.get(`op${i}-part`))
      .toList()
      .filter(f => f !== '');
  } else if (partType === 'range') {
    const orders = Range(0, MAX_PART_LENGTH)
      .map(i => values.get(`orderby${i}-part`))
      .toList()
      .filter(f => f !== '' && f !== values.get('range-part'));
    equalities = Range(0, MAX_PART_LENGTH)
      .map(i => values.get(`op${i}-part`))
      .toList()
      .concat(orders)
      .filter(f => f !== '');
  } else if (partType === 'orderBy') {
    let orders;
    if (partIndex === 0) {
      orders = List();
    } else if (partIndex === 1) {
      orders = List([values.get('orderby0-part')]);
    } else {
      orders = Range(0, partIndex)
        .map(i => values.get(`orderby${i}-part`))
        .toList()
        .filter(f => f !== '');
    }

    equalities = Range(0, MAX_PART_LENGTH)
      .map(i => values.get(`op${i}-part`))
      .toList()
      .concat(orders)
      .filter(f => f !== '');
  }

  return equalities;
};

export const availableParts = (
  values,
  indexes,
  equalityFields,
  partType = 'eq',
) => {
  const remainingParts = indexes.map(index =>
    getRemainingParts(index.get('parts', List()), equalityFields),
  );
  const containsTimeline = equalityFields.some(index =>
    TIMELINES.includes(index),
  );
  const anyAtLast = remainingParts.some(index => index && index.size === 0);
  const rangePart = values.get('range-part');
  const timelinesAvailable =
    anyAtLast && !containsTimeline
      ? TIMELINES
      : containsTimeline
        ? getRemainingParts(List([equalityFields.last()]), fromJS(TIMELINES))
        : List();

  if (partType === 'range') {
    const rangeRemaining = remainingParts.filter(
      index => index && index.size === 1,
    );

    return rangeRemaining.concat(
      rangePart &&
      rangeRemaining.size === 0 &&
      values.get('orderby0-part') &&
      values.get('orderby0-part') !== rangePart
        ? List([])
        : timelinesAvailable || List([]),
    );
  } else if (partType === 'orderBy') {
    return (rangePart
      ? List([rangePart])
      : remainingParts
          .filter(index => index && index.size > 0)
          .map(index => index.first())
    )
      .concat(
        TIMELINES.includes(rangePart)
          ? List([rangePart])
          : anyAtLast
            ? fromJS(TIMELINES)
            : equalityFields.size === 0
              ? fromJS(TIMELINES)
              : List(),
      )
      .toSet()
      .toList();
  } else {
    return remainingParts
      .filterNot(index => !index || index.size === 0)
      .map(index => index.first())
      .toSet()
      .toList()
      .filterNot(p => TIMELINES.includes(p));
  }
};

export const getRemainingParts = (src, dst) => {
  if (src.size === 0 && dst.size === 0) return List();
  // If we're matching so far, and the are no more to compare it's a match.
  if (src.size > 0 && dst.size === 0) return src;
  // If we're out of elements but there's more to match, it's not a match.
  if (src.size === 0 && dst.size > 0) return List();

  if (src.first() === dst.first())
    return getRemainingParts(src.shift(), dst.shift());
  return null;
};

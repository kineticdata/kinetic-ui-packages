import { List, Map, fromJS } from 'immutable';
import { availableParts, getRemainingParts } from './helpers';

const INDEX_A_B = fromJS({
  name: 'values[A],values[B]',
  parts: ['values[A]', 'values[B]'],
});
const INDEX_A_C = fromJS({
  name: 'values[A],values[C]',
  parts: ['values[A]', 'values[C]'],
});
const INDEX_A_B_C = fromJS({
  name: 'values[A],values[B],values[C]',
  parts: ['values[A]', 'values[B]', 'values[C]'],
});

describe('submission filter helpers', () => {
  let indexes;
  let values;

  beforeEach(() => {
    values = Map({});
    indexes = List([]);
  });

  describe('#getRemainingParts', () => {
    test('empty sets match', () => {
      const result = getRemainingParts(List(), List());
      expect(result).toBeImmutableList();
      expect(result.size).toBe(0);
    });
    test('when left is the same as right', () => {
      const result = getRemainingParts(List([1]), List([1]));
      expect(result).toBeImmutableList();
      expect(result.size).toBe(0);
    });
    test('when left is larger than right', () => {
      const result = getRemainingParts(List([1, 2]), List([1]));
      expect(result).toBeImmutableList();
      expect(result.size).toBe(1);
      expect(result.first()).toBe(2);
    });
    test('when left is larger than right with multiple values', () => {
      const result = getRemainingParts(List([1, 2, 3, 4]), List([1]));
      expect(result).toBeImmutableList();
      expect(result.size).toBe(3);
      expect(result.first()).toBe(2);
    });
    test('when left does not start with right', () => {
      const result = getRemainingParts(List([2, 1]), List([1]));
      expect(result).toBeNull();
    });
    test('when left does fully not start with right', () => {
      const result = getRemainingParts(List([1, 1, 1]), List([1, 2]));
      expect(result).toBeNull();
    });
    test('when left contains but does not start with right', () => {
      const result = getRemainingParts(List([1, 1, 2]), List([1, 2]));
      expect(result).toBeNull();
    });
  });

  describe('#avaialbleParts', () => {
    test('when there are no indexes', () => {
      const result = availableParts(
        values,
        indexes,
        List(['values[A]', 'values[B]']),
      );
      expect(result).toBeImmutableList();
      expect(result.size).toBe(0);
    });

    test('when there are no indexes with parts remaining', () => {
      const result = availableParts(
        values,
        indexes.push(INDEX_A_B),
        List(['values[A]', 'values[B]']),
      );
      expect(result).toBeImmutableList();
      expect(result.size).toBe(0);
    });

    test('when there are fewer parts', () => {
      // We're expecting parts from `values[A],values[B]`
      const result = availableParts(
        values,
        indexes.push(INDEX_A_B),
        List(['values[A]']),
      );
      expect(result).toBeImmutableList();
      expect(result.size).toBe(1);
      expect(result.first()).toBe('values[B]');
    });

    test('when there are fewer parts in multiple indexes', () => {
      const result = availableParts(
        values,
        indexes.push(INDEX_A_B).push(INDEX_A_C),
        List(['values[A]']),
      );
      expect(result).toBeImmutableList();
      expect(result.size).toBe(2);
      expect(result.first()).toBe('values[B]');
      expect(result.last()).toBe('values[C]');
    });

    test('when there are more parts in the index', () => {
      const result = availableParts(
        values,
        indexes.push(INDEX_A_B_C),
        List(['values[A]']),
      );
      expect(result).toBeImmutableList();
      expect(result.size).toBe(1);
      expect(result.first()).toBe('values[B]');
    });

    test('when multiple indexes start the same', () => {
      const result = availableParts(
        values,
        indexes.push(INDEX_A_B).push(INDEX_A_B_C),
        List(['values[A]']),
      );
      expect(result).toBeImmutableList();
      expect(result.size).toBe(1);
      expect(result.first()).toBe('values[B]');
    });
  });
});
import { List, Map } from 'immutable';
import { isEmpty, validateField } from '../Form';
import { Field } from '../Form.models';

describe('isEmpty', () => {
  test('returns true if null', () => {
    expect(isEmpty(null)).toBe(true);
  });
  test('returns true if empty string', () => {
    expect(isEmpty('')).toBe(true);
  });
  test('returns true if undefined', () => {
    expect(isEmpty(undefined)).toBe(true);
  });
  test('returns true if empty map', () => {
    expect(isEmpty(Map())).toBe(true);
  });
  test('returns false if populated string', () => {
    expect(isEmpty('foo')).toBe(false);
  });
  test('returns false if populated Map', () => {
    expect(isEmpty(Map({ foo: 'bar' }))).toBe(false);
  });
});

describe('validateFields', () => {
  describe('check required', () => {
    test('has error when required and value is empty string', () => {
      const field = Field({ name: 'First Name', required: true, value: '' });
      expect(validateField({})(field).errors).toEqual(
        List(['This field is required']),
      );
    });

    test('has custom error when required and value is empty string', () => {
      const field = Field({
        name: 'First Name',
        required: true,
        requiredMessage: 'HEY!',
        value: '',
      });
      expect(validateField({})(field).errors).toEqual(List(['HEY!']));
    });

    test('no error when required and value is populated string', () => {
      const field = Field({
        name: 'First Name',
        required: true,
        value: 'foo',
      });
      expect(validateField({})(field).errors).toEqual(List([]));
    });

    test('has error when required function evaluates to true and value is empty string', () => {
      const field = Field({
        name: 'First Name',
        required: true,
        value: '',
      });
      expect(validateField({})(field).errors).toEqual(
        List(['This field is required']),
      );
    });
  });

  describe('check pattern', () => {
    test('no error when pattern but value is empty string', () => {
      const field = Field({ name: 'First Name', pattern: /\d+/, value: '' });
      expect(validateField({})(field).errors).toEqual(List());
    });

    test('no error when pattern and string matches', () => {
      const field = Field({ name: 'First Name', pattern: /\d+/, value: '2' });
      expect(validateField({})(field).errors).toEqual(List());
    });

    test('error when pattern and string does not match', () => {
      const field = Field({
        name: 'Last Name',
        type: 'text',
        pattern: /^\d+$/,
        value: 'Blah1.2x',
      });
      expect(validateField({})(field).errors).toEqual(List(['Invalid format']));
    });

    test('pattern message used if defined', () => {});
  });

  describe('check custom constraint', () => {
    test('no error when constraint evaluates to true', () => {
      const field = Field({
        name: 'First Name',
        required: true,
        value: 'Hello',
        constraint: () => true,
      });
      expect(validateField({})(field).errors).toEqual(List());
    });

    test('error when constraint evaluates to false', () => {
      const field = Field({
        name: 'First Name',
        required: true,
        value: 'Hello',
        constraint: () => false,
      });
      expect(validateField({})(field).errors).toEqual(List(['Invalid']));
    });

    test('constraint message used if defined ', () => {
      const field = Field({
        name: 'First Name',
        required: true,
        value: 'Hello',
        constraint: () => false,
        constraintMessage: 'Invalid constraint',
      });
      expect(validateField({})(field).errors).toEqual(
        List(['Invalid constraint']),
      );
    });

    test('constraint returns string', () => {
      const field = Field({
        name: 'First Name',
        required: true,
        value: 'Hello',
        constraint: () => 'variable error message',
      });
      expect(validateField({})(field).errors).toEqual(
        List(['variable error message']),
      );
    });

    test('constraint returns empty string uses constraint message', () => {
      const field = Field({
        name: 'First Name',
        required: true,
        value: 'Hello',
        constraint: () => '',
        constraintMessage: 'Testing Invalid',
      });
      expect(validateField({})(field).errors).toEqual(
        List(['Testing Invalid']),
      );
    });
  });
});

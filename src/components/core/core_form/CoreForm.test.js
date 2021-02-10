import { queryString } from './CoreForm';

describe('queryString', () => {
  test('review passed true should not have a parameter value', () => {
    expect(queryString({ review: true }, {})).toBe('review');
  });

  test('review passed a string should have a parameter value', () => {
    expect(queryString({ review: 'Page One' }, {})).toBe('review=Page%20One');
  });

  test('review passed a truthy value and reviewPageIndex is a number should have a parameter value of the  corresponding reviewPage name', () => {
    expect(
      queryString(
        { review: true },
        { reviewPages: ['Page One', 'Page Two'], reviewPageIndex: 1 },
      ),
    ).toBe('review=Page%20Two');
  });

  test('review passed anything else should be omitted', () => {
    expect(queryString({ review: false }, {})).toBe('');
  });

  test('values should be wrapped with values[] and encoded', () => {
    expect(
      queryString(
        {
          values: { 'First Name': 'Shayne', 'Last Name': 'Koestler' },
        },
        {},
      ),
    ).toBe('values%5BFirst%20Name%5D=Shayne&values%5BLast%20Name%5D=Koestler');
  });

  test('values should be omitted when empty or non-object', () => {
    expect(queryString({ values: {} }, {})).toBe('');

    expect(queryString({ values: 'asdf' }, {})).toBe('');
  });

  test('combines review and values', () => {
    expect(
      queryString({ review: true, values: { 'Full Name': 'Don Demo' } }, {}),
    ).toMatch('review');
    expect(
      queryString({ review: true, values: { 'Full Name': 'Don Demo' } }, {}),
    ).toMatch('values%5BFull%20Name%5D=Don%20Demo');
  });
});

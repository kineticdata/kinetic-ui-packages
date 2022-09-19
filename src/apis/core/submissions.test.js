import axios from 'axios';

import {
  SubmissionSearch,
  fetchSubmission,
  deleteSubmission,
  createSubmission,
  searchSubmissions,
} from './submissions';
import {
  rejectPromiseWith,
  resolvePromiseWith,
} from '../../../tests/utils/promises';

// Mock out the bundle object from a dependency.
jest.mock('../../helpers', () => ({
  bundle: {
    spaceLocation: () => 'mock-space',
    apiLocation: () => 'mock-space/app/api/v1',
    kappSlug: () => 'mock-kapp',
  },
}));

describe('SubmissionSearch', () => {
  let search;

  beforeEach(() => {
    search = new SubmissionSearch();
  });

  test('empty searchers have no query', () => {
    expect(search.build().query).toEqual('');
  });

  describe('#eq', () => {
    test('eq adds an equality comparison', () => {
      expect(search.eq('attr', 'val').build().query).toEqual('attr = "val"');
    });

    test('eq assumes null for empty rvalue', () => {
      expect(search.eq('attr', '').build().query).toEqual('attr = null');
    });

    test('multiple eq implies an and', () => {
      expect(
        search
          .eq('val1', '1')
          .eq('val2', '2')
          .build().query,
      ).toEqual('val1 = "1" AND val2 = "2"');
    });
  });

  describe('#gt', () => {
    beforeEach(() => {
      search.setDatastore(true);
    });

    test('cannot be used with kapps', () => {
      search.setDatastore(false);

      expect(() => {
        search.gt('foo', 'bar');
      }).toThrow();
    });

    test('adds a greater-than comparison', () => {
      expect(search.gt('attr', 'val').build().query).toEqual('attr > "val"');
    });
  });

  describe('#lt', () => {
    beforeEach(() => {
      search.setDatastore(true);
    });

    test('cannot be used with kapps', () => {
      search.setDatastore(false);

      expect(() => {
        search.lt('foo', 'bar');
      }).toThrow();
    });

    test('adds a less-than comparison', () => {
      expect(search.lt('attr', 'val').build().query).toEqual('attr < "val"');
    });
  });

  describe('#gteq', () => {
    beforeEach(() => {
      search.setDatastore(true);
    });

    test('cannot be used with kapps', () => {
      search.setDatastore(false);

      expect(() => {
        search.gteq('foo', 'bar');
      }).toThrow();
    });

    test('adds a greater-than-or-equal comparison', () => {
      expect(search.gteq('attr', 'val').build().query).toEqual('attr >= "val"');
    });
  });

  describe('#lteq', () => {
    beforeEach(() => {
      search.setDatastore(true);
    });

    test('cannot be used with kapps', () => {
      search.setDatastore(false);

      expect(() => {
        search.lteq('foo', 'bar');
      }).toThrow();
    });

    test('adds a less-than-or-equal comparison', () => {
      expect(search.lteq('attr', 'val').build().query).toEqual('attr <= "val"');
    });
  });

  describe('#between', () => {
    beforeEach(() => {
      search.setDatastore(true);
    });

    test('cannot be used with kapps', () => {
      search.setDatastore(false);

      expect(() => {
        search.between('foo', 'bar');
      }).toThrow();
    });

    test('adds a between comparison', () => {
      expect(search.between('attr', 'val1', 'val2').build().query).toEqual(
        'attr BETWEEN ("val1", "val2")',
      );
    });
  });

  describe('#in', () => {
    test('in generates an in-list', () => {
      expect(search.in('attr', ['val1', 'val2']).build().query).toEqual(
        'attr IN ("val1", "val2")',
      );
    });

    test('in assumes null for empty rvalue', () => {
      expect(search.in('attr', ['val1', '']).build().query).toEqual(
        'attr IN ("val1", null)',
      );
    });

    test('in handles null for rvalue', () => {
      expect(search.in('attr', ['val1', null]).build().query).toEqual(
        'attr IN ("val1", null)',
      );
    });
  });

  describe('groupings', () => {
    test('#or cannot be used with datastore', () => {
      search.setDatastore(true);
      expect(() => {
        search.or();
      }).toThrow();
    });

    test('or separates equalities in its context with OR', () => {
      expect(
        search
          .or()
          .eq('a', '1')
          .eq('b', '2')
          .end()
          .build().query,
      ).toEqual('( a = "1" OR b = "2")');
    });

    test('or following other equalities implies an and', () => {
      expect(
        search
          .eq('out', 'outer')
          .or()
          .eq('a', '1')
          .eq('b', '2')
          .end()
          .build().query,
      ).toEqual('out = "outer" AND ( a = "1" OR b = "2")');
    });

    test('complex query', () => {
      expect(
        search
          .eq('always', 'needed')
          .or()
          .eq('a', 'toBeA')
          .and()
          .eq('b', 'toBeB')
          .eq('c', 'toBeC')
          .end()
          .end()
          .build().query,
      ).toEqual(
        'always = "needed" AND ( a = "toBeA" OR ( b = "toBeB" AND c = "toBeC"))',
      );
    });
  });

  describe('search metadata', () => {
    describe('#type', () => {
      test('sets the type', () => {
        expect(search.type('foo').build().type).toBe('foo');
      });

      test('cannot be used with datastore', () => {
        search.setDatastore(true);

        expect(() => {
          search.type('foo');
        }).toThrow();
      });
    });

    describe('#coreState', () => {
      test('sets coreState', () => {
        expect(search.coreState('Closed').build().coreState).toBe('Closed');
      });

      test('setting an invalid coreState throws an error', () => {
        expect(() => {
          search.coreState('InvalidCoreState');
        }).toThrow();
      });

      test('datastore cannot be closed', () => {
        search.setDatastore(true);
        expect(() => {
          search.coreState('Closed');
        }).toThrow();
      });
    });

    describe('#startDate', () => {
      test('cannot be used with datastore', () => {
        search.setDatastore(true);
        expect(() => {
          search.startDate(new Date());
        }).toThrow();
      });

      test('throws an error if it is not a valid date', () => {
        expect(() => {
          search.startDate(1);
        }).toThrow();
      });

      test('sets the date as an ISO string', () => {
        expect(search.startDate(new Date()).build().start).toEqual(
          expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/),
        );
      });

      test('throws an error if used inside a query scope', () => {
        expect(() => {
          search.or().startDate(new Date());
        }).toThrow();
      });
    });

    describe('#endDate', () => {
      test('cannot be used with datastore', () => {
        search.setDatastore(true);
        expect(() => {
          search.endDate(new Date());
        }).toThrow();
      });

      test('throws an error if it is not a valid date', () => {
        expect(() => {
          search.endDate(1);
        }).toThrow();
      });

      test('sets the date as an ISO string', () => {
        expect(search.startDate(new Date()).build().start).toEqual(
          expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/),
        );
      });

      test('throws an error if used inside a query scope', () => {
        expect(() => {
          search.or().endDate(new Date());
        }).toThrow();
      });
    });

    describe('build-time validations', () => {
      test('defaults end date to now if start is set and end is omitted', () => {});
      test('validates start date is before end', () => {});
    });
  });
});

describe('#searchSubmissions', () => {
  describe('when successful', () => {
    let response;
    let search;

    beforeEach(() => {
      response = {
        status: 200,
        data: {
          submissions: [],
          messages: [],
          nextPageToken: 'page-token',
        },
      };

      search = new SubmissionSearch().build();

      axios.post = resolvePromiseWith(response);
    });

    test('does not return errors', () => {
      expect.assertions(1);
      return searchSubmissions({ search }).then(({ serverError }) => {
        expect(serverError).toBeUndefined();
      });
    });

    test('does return messages', () => {
      expect.assertions(2);
      return searchSubmissions({ search }).then(({ messages }) => {
        expect(messages).toBeDefined();
        expect(messages).toBeInstanceOf(Array);
      });
    });

    test('does return nextPageToken', () => {
      expect.assertions(1);
      return searchSubmissions({ search }).then(({ nextPageToken }) => {
        expect(nextPageToken).toBeDefined();
      });
    });

    test('does return submissions', () => {
      expect.assertions(2);
      return searchSubmissions({ search }).then(({ submissions }) => {
        expect(submissions).toBeDefined();
        expect(submissions).toBeInstanceOf(Array);
      });
    });
  });

  describe('when successful - get', () => {
    let response;
    let search;

    beforeEach(() => {
      response = {
        status: 200,
        data: {
          submissions: [],
          messages: [],
          nextPageToken: 'page-token',
        },
      };

      search = new SubmissionSearch().build();

      axios.get = resolvePromiseWith(response);
    });

    test('does return submissions', () => {
      expect.assertions(2);
      return searchSubmissions({ search, get: true }).then(({ submissions }) => {
        expect(submissions).toBeDefined();
        expect(submissions).toBeInstanceOf(Array);
      });
    });
  });
});

describe('#fetchSubmission', () => {
  describe('when successful', () => {
    const id = 'abc123';
    const values = { foo: 'bar' };

    beforeEach(() => {
      axios.get = resolvePromiseWith({
        status: 200,
        data: { submission: { id, values } },
      });
    });

    test('does not return errors', () => {
      expect.assertions(1);
      return fetchSubmission({ id }).then(({ errors }) => {
        expect(errors).toBeUndefined();
      });
    });

    test('returns a submission', () => {
      expect.assertions(1);
      return fetchSubmission({ id }).then(({ submission }) => {
        expect(submission).toMatchObject({ id, values });
      });
    });
  });

  describe('when unsuccessful', () => {
    beforeEach(() => {
      axios.get = rejectPromiseWith({
        response: { status: 500, statusText: 'Server Error' },
      });
    });

    test('throws an exception when no submission id is provided', () => {
      expect(() => {
        fetchSubmission({});
      }).toThrow();
    });

    test('does return errors', () => {
      expect.assertions(1);
      return fetchSubmission({ id: 'fake' }).then(({ error }) => {
        expect(error).toEqual({
          statusCode: 500,
          key: null,
          message: 'Server Error',
        });
      });
    });
  });
});

describe('#createSubmission', () => {
  const id = 'abc123';
  const kappSlug = 'catalog';
  const formSlug = 'ipad-request';
  const values = { foo: 'bar' };

  describe('when successful', () => {
    beforeEach(() => {
      axios.post = resolvePromiseWith({
        status: 200,
        data: { submission: { id, values } },
      });
    });

    test('does not return errors', () => {
      expect.assertions(1);
      return createSubmission({ kappSlug, formSlug, values }).then(
        ({ errors }) => {
          expect(errors).toBeUndefined();
        },
      );
    });

    test('returns a submission', () => {
      expect.assertions(1);
      return createSubmission({ kappSlug, formSlug, values }).then(
        ({ submission }) => {
          expect(submission).toMatchObject({ id, values });
        },
      );
    });

    test('test defaults (kapp = bundle.kappSlug(), complete = true)', () => {
      expect.assertions(1);
      return createSubmission({ formSlug, values }).then(() => {
        expect(axios.post).toHaveBeenCalledWith(
          'mock-space/app/api/v1/kapps/mock-kapp/forms/ipad-request/submissions',
          { values },
          {
            params: { completed: true },
            headers: { 'X-Kinetic-AuthAssumed': 'true' },
          },
        );
      });
    });

    test('test draft submission', () => {
      expect.assertions(1);
      return createSubmission({
        kappSlug,
        formSlug,
        values,
        completed: false,
      }).then(() => {
        expect(axios.post).toHaveBeenCalledWith(
          'mock-space/app/api/v1/kapps/catalog/forms/ipad-request/submissions',
          { values },
          {
            params: { completed: false },
            headers: { 'X-Kinetic-AuthAssumed': 'true' },
          },
        );
      });
    });
  });

  describe('when unsuccessful', () => {
    beforeEach(() => {
      axios.post = rejectPromiseWith({
        response: { status: 500, statusText: 'Server Error' },
      });
    });

    test('throws an exception when no formSlug is provided', () => {
      expect(() => {
        createSubmission({});
      }).toThrow('createSubmission failed! The option "formSlug" is required.');
    });

    test('throws an exception when no values object is provided', () => {
      expect(() => {
        createSubmission({ formSlug });
      }).toThrow('createSubmission failed! The option "values" is required.');
    });

    test('does return errors', () => {
      expect.assertions(1);
      return createSubmission({ formSlug, values }).then(({ error }) => {
        expect(error).toEqual({
          statusCode: 500,
          key: null,
          message: 'Server Error',
        });
      });
    });
  });
});

describe('#deleteSubmission', () => {
  describe('when successful', () => {
    const id = 'abc123';
    const values = { foo: 'bar' };

    beforeEach(() => {
      axios.delete = resolvePromiseWith({
        status: 200,
        data: { submission: { id, values } },
      });
    });

    test('does not return errors', () => {
      expect.assertions(1);
      return deleteSubmission({ id }).then(({ errors }) => {
        expect(errors).toBeUndefined();
      });
    });

    test('returns a submission', () => {
      expect.assertions(1);
      return deleteSubmission({ id }).then(({ submission }) => {
        expect(submission).toMatchObject({ id, values });
      });
    });
  });

  describe('when unsuccessful', () => {
    beforeEach(() => {
      axios.delete = rejectPromiseWith({
        response: { status: 500, statusText: 'Server Error' },
      });
    });

    test('throws an exception when no submission id is provided', () => {
      expect(() => {
        deleteSubmission({});
      }).toThrow();
    });

    test('does return errors', () => {
      expect.assertions(1);
      return deleteSubmission({ id: 'fake' }).then(({ error }) => {
        expect(error).toEqual({
          statusCode: 500,
          key: null,
          message: 'Server Error',
        });
      });
    });
  });
});

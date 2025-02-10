import { List } from 'immutable';
import { parseNodeResultDependencies } from './helpers';
import { NodeResultDependency } from './models';

describe('parseNodeResultDependencies', () => {
  test('supports erb', () => {
    expect(
      parseNodeResultDependencies(
        ['node', '2', 'parameter', '4'],
        'Hello <%= @results ["Person"]["First Name"] %> from <%= @results["Requester"]["Name"] %>',
        true,
      ),
    ).toEqual(
      List([
        NodeResultDependency({
          context: List(['node', '2', 'parameter', '4']),
          name: 'Person',
          index: 21,
        }),
        NodeResultDependency({
          context: List(['node', '2', 'parameter', '4']),
          name: 'Requester',
          index: 66,
        }),
      ]),
    );
  });

  test('supports ruby', () => {
    expect(
      parseNodeResultDependencies(
        ['connector', '1'],
        '"Hello " + @results["Person"]["First Name"]',
      ),
    ).toEqual(
      List.of(
        NodeResultDependency({
          context: List(['connector', '1']),
          name: 'Person',
          index: 21,
        }),
      ),
    );
  });

  test('supports %^...^ strings', () => {
    expect(
      parseNodeResultDependencies(
        ['connector', '1'],
        '"Hello " + @results[%^Person^]["First Name"]',
      ),
    ).toEqual(
      List.of(
        NodeResultDependency({
          context: List(['connector', '1']),
          name: 'Person',
          index: 22,
        }),
      ),
    );
  });

  test('supports %q^...^ strings', () => {
    expect(
      parseNodeResultDependencies(
        ['connector', '1'],
        '"Hello " + @results[%q^Person^]["First Name"]',
      ),
    ).toEqual(
      List.of(
        NodeResultDependency({
          context: List(['connector', '1']),
          name: 'Person',
          index: 23,
        }),
      ),
    );
  });

  test('supports %(...) strings', () => {
    expect(
      parseNodeResultDependencies(
        ['connector', '1'],
        '"Hello " + @results[%(Person)]["First Name"]',
      ),
    ).toEqual(
      List.of(
        NodeResultDependency({
          context: List(['connector', '1']),
          name: 'Person',
          index: 22,
        }),
      ),
    );
  });

  test('allows whitespace between @results and [ and string', () => {
    expect(
      parseNodeResultDependencies(
        ['connector', '1'],
        '"Hello " + @results [ "Person" ]["First Name"]',
      ),
    ).toEqual(
      List.of(
        NodeResultDependency({
          context: List(['connector', '1']),
          name: 'Person',
          index: 23,
        }),
      ),
    );
  });

  test('returns empty is no node dependencies', () => {
    expect(
      parseNodeResultDependencies(
        ['connector', '1'],
        '"Hello " + @other["Person"]["First Name"]',
      ),
    ).toEqual(List());
  });
});

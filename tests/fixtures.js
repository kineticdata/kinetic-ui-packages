import Faker from 'faker';
import { Repeat } from 'immutable';

const generateUser = () => ({
  username: Faker.internet.email(),
  displayName: Faker.name.findName(),
  spaceAdmin: Faker.random.boolean(),
});

export const users = (count = 1) =>
  Repeat(generateUser, count)
    .map(g => g())
    .toJS();

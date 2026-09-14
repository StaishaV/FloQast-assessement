import { faker } from '@faker-js/faker';


export type User = {
  name: string;
  email: string;
  accountType: 'basic' | 'premium';
};

export function buildUser(overrides: Partial<User> = {}): User {
    const defaults: User = {
        name: faker.person.fullName(),
        email: faker.internet.email(),
        accountType: 'basic',
  };

  return { ...defaults, ...overrides };
}
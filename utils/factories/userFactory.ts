import { faker } from '@faker-js/faker';

// Creates filler data (avoid dupe error when parallel run + reduce noice and remove in line data)


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
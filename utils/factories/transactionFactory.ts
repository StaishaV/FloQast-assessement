import { faker } from '@faker-js/faker';

// Creates filler data (avoid dupe error when parallel run + reduce noice and remove in line data)

export type Transaction = {
    userId: string;
    recipientId: string;
    amount: number;
    type: 'transfer'| 'payment' | 'deposit' | 'withdrawal'
}

type TransactionOverrides = Partial<Omit<Transaction, 'userId' | 'recipientId'>> &
  Pick<Transaction, 'userId' | 'recipientId'>;

export function buildTransaction(overrides: TransactionOverrides): Transaction {
  const defaults = {
    amount: faker.number.float({ min: 1, max: 500, fractionDigits: 2 }),
    type: 'transfer' as const,
  };

  return { ...defaults, ...overrides };
}
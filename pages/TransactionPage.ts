import { Page } from '@playwright/test';
import { Transaction } from '../utils/factories/transactionFactory';

export class TransactionPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/');
  }

  async sendTransaction({ recipientId, amount, type }: Omit<Transaction, 'userId'>) {
    await this.page.getByTestId('recipient-id-input').fill(recipientId);
    await this.page.getByTestId('amount-input').fill(amount.toString());
    await this.page.getByTestId('type-select').selectOption(type);
    await this.page.getByTestId('transaction-submit').click();
  }

  get successMessage() {
    return this.page.getByTestId('transaction-success');
  }

  get errorMessage() {
    return this.page.getByTestId('transaction-error');
  }

  get transactionList() {
    return this.page.getByTestId('transaction-list');
  }
}
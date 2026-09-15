import { Page } from '@playwright/test';
import { User } from '../utils/factories/userFactory';

export class RegistrationPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/');
  }

  async register(user: User) {
    await this.page.getByTestId('name-input').fill(user.name);
    await this.page.getByTestId('email-input').fill(user.email);
    await this.page.getByTestId('account-type-select').selectOption(user.accountType);
    await this.page.getByTestId('register-submit').click();
  }

  get errorMessage() {
    return this.page.getByTestId('register-error');
  }

  get currentUserId() {
    return this.page.getByTestId('current-user-id');
  }
}
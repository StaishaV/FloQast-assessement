import { test, expect } from '@playwright/test';
import { RegistrationPage } from '../../pages/RegistrationPage';
import { buildUser } from '../../utils/factories/userFactory';

test.describe('User registration flow', () => {
  test('registers a new user successfully', async ({ page }) => {
    const registrationPage = new RegistrationPage(page);
    await registrationPage.goto();
    await registrationPage.register(buildUser());

    await expect(registrationPage.currentUserId).toBeVisible();
  });

  test('shows an error for invalid email', async ({ page }) => {
    const registrationPage = new RegistrationPage(page);
    await registrationPage.goto();
    await registrationPage.register(buildUser({ email: 'not-an-email' }));

    await expect(registrationPage.errorMessage).toBeVisible();
    await expect(registrationPage.errorMessage).toContainText('email');
  });
});
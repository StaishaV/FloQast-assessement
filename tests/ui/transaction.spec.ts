import { test, expect } from '@playwright/test';
import { TransactionPage } from '../../pages/TransactionPage';
import { ApiClient } from '../../utils/helpers/apiClient';
import { buildUser } from '../../utils/factories/userFactory';
import { RegistrationPage } from '../../pages/RegistrationPage';



test.describe('Transaction creation flow', () => {
    test('sends a transaction and sees it in history', async ({ page, request, baseURL }) => {
        const api = new ApiClient(request, baseURL!);
        const recipientRes = await api.createUser(buildUser());
        const recipient = await recipientRes.json();

        const registrationPage = new RegistrationPage(page);
        await registrationPage.goto();
        await registrationPage.register(buildUser());

        const transactionPage = new TransactionPage(page);
        await transactionPage.sendTransaction({ recipientId: recipient.id, amount: 42.5, type: 'transfer' });

        await expect(transactionPage.successMessage).toBeVisible();
    });

    test('shows an error when sending to a nonexistent recipient', async ({ page }) => {
        const registrationPage = new RegistrationPage(page);
        await registrationPage.goto();
        await registrationPage.register(buildUser());

        const transactionPage = new TransactionPage(page);
        await transactionPage.sendTransaction({ recipientId: 'fake-id-123', amount: 42.5, type: 'transfer' });

        await expect(transactionPage.errorMessage).toBeVisible();
        await expect(transactionPage.errorMessage).toContainText('recipientId');
    });
});
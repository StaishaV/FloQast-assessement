import { test, expect } from '../../utils/helpers/apiFixtures';
import { buildUser } from '../../utils/factories/userFactory';

test.describe('POST /api/users', () => {
    test('creates a user with valid data', async ({ api }) => {
        const response = await api.createUser(buildUser({ accountType: 'premium'}));
        expect(response.status()).toBe(201);

        const body = await response.json();
        expect (body).toHaveProperty('id');
        expect (body.accountType).toBe('premium');
    });

    test('rejects an invalid email', async ({ api }) => {
        const response = await api.createUser(buildUser({email: 'not-an-email'}));
        await expect(response).toBeValidationError('email');
    });
});
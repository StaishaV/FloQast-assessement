import { test, expect } from '../../utils/helpers/apiFixtures';
import { buildUser } from '../../utils/factories/userFactory';

// API tests for user

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

    test('rejects missing name', async ({ api }) => {
        const response = await api.createUser(buildUser({ name: '' }));
        await expect(response).toBeValidationError('name');
    });

    test('rejects missing accountType', async ({ api }) => {
        const response = await api.createUser(buildUser({ accountType: undefined as any }));
        await expect(response).toBeValidationError('accountType');
    });

    test('rejects an invalid accountType value', async ({ api }) => {
        const response = await api.createUser(buildUser({ accountType: 'gold' as any }));
        await expect(response).toBeValidationError('accountType');
    });

    test('rejects a duplicate email', async ({ api }) => {
        const user = buildUser();
        const first = await api.createUser(user);
        expect(first.status()).toBe(201);

        const second = await api.createUser(user); // same email, second time
        expect(second.status()).toBe(409);
    });
});

test.describe('GET /api/users/:id', () => {

    let userId: string;
    let fakeUserId = "f4567788";

    test.beforeEach(async ({ api }) => {
        const userRes = await api.createUser(buildUser());
        userId = (await userRes.json()).id;
    });

    test('get existing user data', async ({ api }) => {
        const response = await api.getUser(userId);
        expect(response.status()).toBe(200);

        const body = await response.json();
        expect (body).toHaveProperty('id');
        expect (body.id).toBe(userId);
    });

    test('get user with fake id -> error', async ({ api }) => {
        const response = await api.getUser(fakeUserId);
        expect(response.status()).toBe(404);
    });
});
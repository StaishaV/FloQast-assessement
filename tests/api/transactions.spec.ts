import { test, expect } from '../../utils/helpers/apiFixtures';
import { buildUser } from '../../utils/factories/userFactory';
import { buildTransaction } from '../../utils/factories/transactionFactory';

// API tests for transaction workflow

test.describe('POST /api/transactions', () => {
    let userId: string;
    let recipientId: string;

    test.beforeEach(async ({ api }) => {
        const userRes = await api.createUser(buildUser());
        userId = (await userRes.json()).id;

        const recipientRes = await api.createUser(buildUser());
        recipientId = (await recipientRes.json()).id;
    });

    test('creates a valid transaction', async ({ api }) => {
        const response = await api.createTransaction(
        buildTransaction({ userId, recipientId }),
        userId
        );
        expect(response.status()).toBe(201);

        const body = await response.json();
        expect(body).toHaveProperty('id');
    });

    test('rejects transaction with negative amount', async ({ api }) => {
        const response = await api.createTransaction(
        buildTransaction({ userId, recipientId, amount: -5 }),
        userId
        );
        await expect(response).toBeValidationError('amount');
    });

    test('rejects transaction with invalid type', async ({ api }) => {
        const response = await api.createTransaction(
        buildTransaction({ userId, recipientId, type: 'bogus' as any }),
        userId
        );
        await expect(response).toBeValidationError('type');
    });
    
    test('rejects transaction with unknown recipient', async ({ api }) => {
        const response = await api.createTransaction(
        buildTransaction({ userId, recipientId: 'fake-id-123' }),
        userId
        );
        await expect(response).toBeValidationError('recipientId');
    });

    test('rejects transaction with self-transfer', async ({ api }) => {
        const response = await api.createTransaction(
            buildTransaction({ userId, recipientId: userId }), 
            userId
        );
        await expect(response).toBeValidationError('recipientId');
    });

    test('rejects transaction with no auth', async ({ api }) => {
        const response = await api.createTransaction(
            buildTransaction({ userId, recipientId }), '');
        expect(response.status()).toBe(401);
    });

    test('rejects transaction with wrong user`s token', async ({ api }) => {
        const response = await api.createTransaction(
            buildTransaction({ userId, recipientId }), 
            recipientId
        );
        expect(response.status()).toBe(403);
    });

    test('replays the same transaction for a repeated idempotency key', async ({ api }) => {
        const payload = buildTransaction({ userId, recipientId });
        const idempotencyKey = crypto.randomUUID();
        const first = await api.createTransaction(payload, userId, idempotencyKey);
        expect(first.status()).toBe(201);
        const firstBody = await first.json();

        const second = await api.createTransaction(payload, userId, idempotencyKey);
        expect(second.status()).toBe(200); // not 201 — this is a replay, not a new transaction
        const secondBody = await second.json();

        expect(secondBody.id).toBe(firstBody.id);
    });

    test('handles concurrent transactions without corrupting data', async ({ api }) => {
        const requests = Array.from({ length: 5 }, () =>
            api.createTransaction(buildTransaction({ userId, recipientId }), userId)
        );
        const responses = await Promise.all(requests);

        responses.forEach((response) => expect(response.status()).toBe(201));

        const historyRes = await api.getTransactions(userId, userId);
        const history = await historyRes.json();
        expect(history.length).toBe(5); // all 5 recorded, none lost or duplicated
    });
});

test.describe('GET /api/transactions/:userId', () => {
    let userId: string;
    let recipientId: string;

    test.beforeEach(async ({ api }) => {
        const userRes = await api.createUser(buildUser());
        userId = (await userRes.json()).id;

        const recipientRes = await api.createUser(buildUser());
        recipientId = (await recipientRes.json()).id;

        const response = await api.createTransaction(
        buildTransaction({ userId, recipientId }),
        userId
        );
        expect(response.status()).toBe(201);
    });


  test('sender sees the transaction as sent', async ({ api }) => {
        const response = await api.getTransactions(userId, userId);
        expect(response.status()).toBe(200);

        const body = await response.json();
        expect(body[0]).toHaveProperty('direction');
        expect(body[0].direction).toBe('sent'); 
    });

  test('recipient sees the transaction as received', async ({ api }) => {
        const response = await api.getTransactions(recipientId, recipientId);
        expect(response.status()).toBe(200);

        const body = await response.json();
        expect(body[0]).toHaveProperty('direction');
        expect(body[0].direction).toBe('received');
    });
});

test.describe('GET /api/transactions/:userId - edge cases', () => {
    test('returns an empty array for a user with no transactions', async ({ api }) => {
        const userRes = await api.createUser(buildUser());
        const user = await userRes.json();

        const response = await api.getTransactions(user.id, user.id);
        expect(response.status()).toBe(200);

        const body = await response.json();
        expect(body).toEqual([]);
    });

    test('returns 404 for a userId that does not exist', async ({ api }) => {
        const response = await api.getTransactions('fake-id-123', 'fake-id-123');
        expect(response.status()).toBe(404);
    });
});
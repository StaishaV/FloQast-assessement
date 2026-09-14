import { APIRequestContext } from '@playwright/test';

// API Client wrapper - dedup for API calls

export class ApiClient {
  constructor(private request: APIRequestContext, private baseURL: string) {}

  createUser(payload: unknown) {
    return this.request.post(`${this.baseURL}/api/users`, { data: payload });
  }

  getUser(id: string) {
    return this.request.get(`${this.baseURL}/api/users/${id}`);
  }

  createTransaction(payload: unknown, authUserId: string, idempotencyKey?: string) {
    const headers: Record<string, string> = { Authorization: `Bearer ${authUserId}` };
    if (idempotencyKey) headers['Idempotency-Key'] = idempotencyKey;
    return this.request.post(`${this.baseURL}/api/transactions`, { data: payload, headers });
  }

  getTransactions(userId: string, authUserId: string) {
    return this.request.get(`${this.baseURL}/api/transactions/${userId}`, {
      headers: { Authorization: `Bearer ${authUserId}` },
    });
  }

  resetTestData() {
    return this.request.post(`${this.baseURL}/test/reset`);
  }
}
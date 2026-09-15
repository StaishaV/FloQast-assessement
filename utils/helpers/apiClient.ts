import { APIRequestContext, APIResponse } from '@playwright/test';

// API Client wrapper - dedup for API calls

export class ApiClient {
  constructor(private request: APIRequestContext, private baseURL: string) {}

  private async logged(method: string, url: string, fn: () => Promise<APIResponse>): Promise<APIResponse> {
    const response = await fn();
    console.log(`[API] ${method} ${url} -> ${response.status()}`);
    return response;
  }

  createUser(payload: unknown) {
    return this.logged('POST', '/api/users', () =>
      this.request.post(`${this.baseURL}/api/users`, { data: payload })
    );
  }

  getUser(id: string) {
    return this.logged('GET', `/api/users/${id}`, () =>
      this.request.get(`${this.baseURL}/api/users/${id}`)
    );
  }

  createTransaction(payload: unknown, authUserId: string, idempotencyKey?: string) {
    const headers: Record<string, string> = { Authorization: `Bearer ${authUserId}` };
    if (idempotencyKey) headers['Idempotency-Key'] = idempotencyKey;
    return this.logged('POST', '/api/transactions', () =>
      this.request.post(`${this.baseURL}/api/transactions`, { data: payload, headers })
    );
  }

  getTransactions(userId: string, authUserId: string) {
    return this.logged('GET', `/api/transactions/${userId}`, () =>
      this.request.get(`${this.baseURL}/api/transactions/${userId}`, {
        headers: { Authorization: `Bearer ${authUserId}` },
      })
    );
  }

  resetTestData() {
    return this.logged('POST', '/test/reset', () =>
      this.request.post(`${this.baseURL}/test/reset`)
    );
  }
}

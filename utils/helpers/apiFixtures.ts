import { test as base } from '@playwright/test';
import { ApiClient } from './apiClient';

// custom fixture for API tests => gives every API test file a ready to use api object, 
// instead of consttructing one manually every time

export const test = base.extend<{ api: ApiClient }>({
  api: async ({ request, baseURL }, use) => {
    const api = new ApiClient(request, baseURL!);
    await api.resetTestData();
    await use(api);
  },
});

export { expect } from '../assertions/customAssertions';
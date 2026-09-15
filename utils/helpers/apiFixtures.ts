import { test as base } from '@playwright/test';
import { ApiClient } from './apiClient';

// custom fixture for API tests => gives every API test file a ready to use api object, 
// instead of consttructing one manually every time

export const test = base.extend<{ api: ApiClient }>({
  api: async ({ request, baseURL }, use) => {
    // Deliberately NOT calling resetTestData() here: tests run in parallel
    // workers against one shared mock server, and a per-test global reset
    // would wipe out data other tests are using at the same moment. Each
    // test creates its own uniquely-generated data instead and only asserts
    // on that, so no reset is needed for correctness.
    const api = new ApiClient(request, baseURL!);
    await use(api);
  },
});

export { expect } from '../assertions/customAssertions';
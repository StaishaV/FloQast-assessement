import { expect as baseExpect } from '@playwright/test';

// Creates a custom assertion for error validation

export const expect = baseExpect.extend({
    async toBeValidationError(response, expectedFieldHint: string) {
        const body = await response.json();
        const pass = response.status() ===  400 && typeof body.error === 'string' && body.error.includes(expectedFieldHint);

        return {
            pass,
            message: () =>
                pass
                    ? `expected response not to be a 400 validation error mentioning "${expectedFieldHint}"`
                    : `expected a 400 with error message mentioning "${expectedFieldHint}", got ${response.status()}: ${JSON.stringify(body)}`,
        }
    }
})
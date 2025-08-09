import { describe, expect, it } from 'vitest';
import { NewRelicMCPServer } from '../../../src/server';

describe('Server Edge Cases: Environment validation', () => {
  it('does not throw during construction when API key is missing (tool discovery)', () => {
    const originalApiKey = process.env.NEW_RELIC_API_KEY;
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete process.env.NEW_RELIC_API_KEY;
    expect(() => new NewRelicMCPServer()).not.toThrow();
    process.env.NEW_RELIC_API_KEY = originalApiKey;
  });
});

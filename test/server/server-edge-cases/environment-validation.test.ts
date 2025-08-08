import { describe, expect, it } from 'vitest';
import { NewRelicMCPServer } from '../../../src/server';

describe('Server Edge Cases: Environment validation', () => {
  it('throws error when API key is missing', () => {
    const originalApiKey = process.env.NEW_RELIC_API_KEY;
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete process.env.NEW_RELIC_API_KEY;
    expect(() => new NewRelicMCPServer()).toThrow('NEW_RELIC_API_KEY is required');
    process.env.NEW_RELIC_API_KEY = originalApiKey;
  });
});

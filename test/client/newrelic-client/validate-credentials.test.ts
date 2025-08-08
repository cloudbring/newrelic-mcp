import type { Mock } from 'vitest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NewRelicClient } from '../../../src/client/newrelic-client';

global.fetch = vi.fn();

describe('NewRelicClient.validateCredentials', () => {
  let client: NewRelicClient;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEW_RELIC_API_KEY = 'test-api-key';
    process.env.NEW_RELIC_ACCOUNT_ID = '123456';
    client = new NewRelicClient();
  });

  it('returns true for valid credentials', async () => {
    (global.fetch as unknown as Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: { actor: { user: { id: 'user-123', email: 'test@example.com' } } },
      }),
    });

    const result = await client.validateCredentials();
    expect(result).toBe(true);
  });

  it('returns false for invalid credentials', async () => {
    (global.fetch as unknown as Mock).mockResolvedValueOnce({ ok: false, status: 401 });
    const result = await client.validateCredentials();
    expect(result).toBe(false);
  });
});

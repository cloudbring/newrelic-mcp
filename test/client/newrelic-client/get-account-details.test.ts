import type { Mock } from 'vitest';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { NewRelicClient } from '../../../src/client/newrelic-client';

const originalFetch = global.fetch;

beforeAll(() => {
  // @ts-expect-error override in tests
  global.fetch = vi.fn();
});

afterEach(() => {
  vi.clearAllMocks();
});

afterAll(() => {
  global.fetch = originalFetch;
});

describe('NewRelicClient.getAccountDetails', () => {
  let client: NewRelicClient;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEW_RELIC_API_KEY = 'test-api-key';
    process.env.NEW_RELIC_ACCOUNT_ID = '123456';
    client = new NewRelicClient();
  });

  it('returns account details', async () => {
    (global.fetch as unknown as Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: { actor: { account: { id: '123456', name: 'Test Account' } } },
      }),
    });
    const result = await client.getAccountDetails('123456');
    expect(result.accountId).toBe('123456');
    expect(result.name).toBe('Test Account');
  });

  it('throws when account not found', async () => {
    (global.fetch as unknown as Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { actor: {} } }),
    });
    await expect(client.getAccountDetails('999999')).rejects.toThrow('Account 999999 not found');
  });

  it('uses default account ID when not provided', async () => {
    (global.fetch as unknown as Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: { actor: { account: { id: '123456', name: 'Default Account' } } },
      }),
    });
    const result = await client.getAccountDetails();
    expect(result.accountId).toBe('123456');
  });
});

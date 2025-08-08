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

describe('NewRelicClient.executeNerdGraphQuery', () => {
  let client: NewRelicClient;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEW_RELIC_API_KEY = 'test-api-key';
    process.env.NEW_RELIC_ACCOUNT_ID = '123456';
    client = new NewRelicClient();
  });

  it('executes query with variables', async () => {
    (global.fetch as unknown as Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { result: 'success' } }),
    });
    const result = await client.executeNerdGraphQuery(
      'query ($id: ID!) { entity(id: $id) { name } }',
      { id: '123' }
    );
    const res = result as { data?: { result?: string } };
    expect(res.data?.result).toBe('success');
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.newrelic.com/graphql',
      expect.objectContaining({ body: expect.stringContaining('variables') })
    );
  });

  it('handles unauthorized and other API errors', async () => {
    (global.fetch as unknown as Mock).mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
    });
    await expect(client.executeNerdGraphQuery('{ actor { user { id } } }')).rejects.toThrow(
      'Unauthorized: Invalid API key'
    );

    (global.fetch as unknown as Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });
    await expect(client.executeNerdGraphQuery('{ actor { user { id } } }')).rejects.toThrow(
      'NerdGraph API error: 500 Internal Server Error'
    );
  });
});

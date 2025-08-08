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

describe('NewRelicClient.runNrqlQuery', () => {
  let client: NewRelicClient;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEW_RELIC_API_KEY = 'test-api-key';
    process.env.NEW_RELIC_ACCOUNT_ID = '123456';
    client = new NewRelicClient();
  });

  it('executes NRQL successfully', async () => {
    (global.fetch as unknown as Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          actor: {
            account: {
              nrql: {
                results: [{ count: 100 }],
                metadata: { eventTypes: ['Transaction'], facets: [], timeSeries: false },
              },
            },
          },
        },
      }),
    });
    const result = await client.runNrqlQuery({
      nrql: 'SELECT count(*) FROM Transaction',
      accountId: '123456',
    });
    expect(result.results).toEqual([{ count: 100 }]);
    expect(result.metadata.eventTypes).toContain('Transaction');
  });

  it('validates input', async () => {
    await expect(client.runNrqlQuery({ nrql: '', accountId: '123456' })).rejects.toThrow(
      'Invalid or empty NRQL query provided'
    );
    await expect(
      client.runNrqlQuery({ nrql: 'SELECT * FROM Transaction', accountId: 'invalid' })
    ).rejects.toThrow('Invalid account ID format');
  });

  it('handles NRQL syntax errors', async () => {
    (global.fetch as unknown as Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ errors: [{ message: 'NRQL Syntax error: invalid query' }] }),
    });
    await expect(
      client.runNrqlQuery({ nrql: 'INVALID QUERY', accountId: '123456' })
    ).rejects.toThrow('NRQL Syntax error: invalid query');
  });
});

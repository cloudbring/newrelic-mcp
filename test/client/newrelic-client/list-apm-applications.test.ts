import type { Mock } from 'vitest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NewRelicClient } from '../../../src/client/newrelic-client';

global.fetch = vi.fn();

describe('NewRelicClient.listApmApplications', () => {
  let client: NewRelicClient;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEW_RELIC_API_KEY = 'test-api-key';
    process.env.NEW_RELIC_ACCOUNT_ID = '123456';
    client = new NewRelicClient();
  });

  it('lists applications', async () => {
    (global.fetch as unknown as Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          actor: {
            entitySearch: {
              results: {
                entities: [
                  {
                    guid: 'app-1',
                    name: 'App 1',
                    language: 'Node.js',
                    reporting: true,
                    alertSeverity: 'NOT_ALERTING',
                    tags: [{ key: 'env', values: ['prod'] }],
                  },
                ],
              },
            },
          },
        },
      }),
    });
    const result = await client.listApmApplications('123456');
    expect(result).toHaveLength(1);
    expect(result[0]!.name).toBe('App 1');
    expect(result[0]!.language).toBe('Node.js');
    expect(result[0]!.tags.env).toBe('prod');
  });

  it('handles empty results', async () => {
    (global.fetch as unknown as Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: { actor: { entitySearch: { results: { entities: [] } } } },
      }),
    });
    const result = await client.listApmApplications('123456');
    expect(result).toEqual([]);
  });
});

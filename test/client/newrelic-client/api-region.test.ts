import type { Mock } from 'vitest';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { NewRelicClient } from '../../../src/client/newrelic-client';

const originalFetch = global.fetch;
const originalEnv = process.env;

beforeAll(() => {
  // @ts-expect-error override in tests
  global.fetch = vi.fn();
});

afterEach(() => {
  vi.clearAllMocks();
  process.env = { ...originalEnv };
});

afterAll(() => {
  global.fetch = originalFetch;
  process.env = originalEnv;
});

describe('NewRelicClient.API Region Configuration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEW_RELIC_API_KEY = 'test-api-key';
  });

  describe('getNerdGraphUrl behavior', () => {
    it('uses US endpoint by default when no region is specified', async () => {
      delete process.env.NEW_RELIC_API_REGION;
      const client = new NewRelicClient();

      (global.fetch as unknown as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { actor: { user: { id: 'test' } } } }),
      });

      await client.executeNerdGraphQuery('{ actor { user { id } } }');

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.newrelic.com/graphql',
        expect.any(Object)
      );
    });

    it('uses US endpoint when NEW_RELIC_API_REGION is set to "us"', async () => {
      process.env.NEW_RELIC_API_REGION = 'us';
      const client = new NewRelicClient();

      (global.fetch as unknown as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { actor: { user: { id: 'test' } } } }),
      });

      await client.executeNerdGraphQuery('{ actor { user { id } } }');

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.newrelic.com/graphql',
        expect.any(Object)
      );
    });

    it('uses EU endpoint when NEW_RELIC_API_REGION is set to "eu"', async () => {
      process.env.NEW_RELIC_API_REGION = 'eu';
      const client = new NewRelicClient();

      (global.fetch as unknown as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { actor: { user: { id: 'test' } } } }),
      });

      await client.executeNerdGraphQuery('{ actor { user { id } } }');

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.eu.newrelic.com/graphql',
        expect.any(Object)
      );
    });

    it('handles case-insensitive region values', async () => {
      process.env.NEW_RELIC_API_REGION = 'EU';
      const client = new NewRelicClient();

      (global.fetch as unknown as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { actor: { user: { id: 'test' } } } }),
      });

      await client.executeNerdGraphQuery('{ actor { user { id } } }');

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.eu.newrelic.com/graphql',
        expect.any(Object)
      );
    });

    it('defaults to US endpoint for unknown region values', async () => {
      process.env.NEW_RELIC_API_REGION = 'invalid-region';
      const client = new NewRelicClient();

      (global.fetch as unknown as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { actor: { user: { id: 'test' } } } }),
      });

      await client.executeNerdGraphQuery('{ actor { user { id } } }');

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.newrelic.com/graphql',
        expect.any(Object)
      );
    });
  });

  describe('region-specific API behavior', () => {
    it('successfully queries NRQL data using EU endpoint', async () => {
      process.env.NEW_RELIC_API_REGION = 'eu';
      process.env.NEW_RELIC_ACCOUNT_ID = '123456';
      const client = new NewRelicClient();

      const mockResponse = {
        data: {
          actor: {
            account: {
              nrql: {
                results: [{ count: 100 }],
                metadata: {
                  eventTypes: ['Transaction'],
                },
              },
            },
          },
        },
      };

      (global.fetch as unknown as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await client.runNrqlQuery({
        nrql: 'SELECT count(*) FROM Transaction',
        accountId: '123456',
      });

      expect(result.results).toHaveLength(1);
      expect(result.results[0]).toEqual({ count: 100 });
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.eu.newrelic.com/graphql',
        expect.any(Object)
      );
    });

    it('successfully lists APM applications using US endpoint', async () => {
      process.env.NEW_RELIC_API_REGION = 'us';
      process.env.NEW_RELIC_ACCOUNT_ID = '123456';
      const client = new NewRelicClient();

      const mockResponse = {
        data: {
          actor: {
            entitySearch: {
              results: {
                entities: [
                  {
                    guid: 'test-guid',
                    name: 'Test App',
                    language: 'nodejs',
                    reporting: true,
                  },
                ],
              },
            },
          },
        },
      };

      (global.fetch as unknown as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const apps = await client.listApmApplications('123456');

      expect(apps).toHaveLength(1);
      expect(apps[0].name).toBe('Test App');
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.newrelic.com/graphql',
        expect.any(Object)
      );
    });
  });

  describe('region persists across multiple calls', () => {
    it('uses the same endpoint for multiple consecutive API calls', async () => {
      process.env.NEW_RELIC_API_REGION = 'eu';
      process.env.NEW_RELIC_ACCOUNT_ID = '123456';
      const client = new NewRelicClient();

      (global.fetch as unknown as Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ data: { actor: { user: { id: 'test' } } } }),
      });

      await client.executeNerdGraphQuery('{ actor { user { id } } }');
      await client.executeNerdGraphQuery('{ actor { user { id } } }');
      await client.executeNerdGraphQuery('{ actor { user { id } } }');

      const calls = (global.fetch as unknown as Mock).mock.calls;
      expect(calls).toHaveLength(3);
      calls.forEach((call) => {
        expect(call[0]).toBe('https://api.eu.newrelic.com/graphql');
      });
    });
  });
});

import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { NewRelicClient } from '../../../src/client/newrelic-client';
import { NewRelicMCPServer } from '../../../src/server';

describe('Server Edge Cases: Complex tool scenarios', () => {
  let server: NewRelicMCPServer;
  let mockClient: NewRelicClient;

  beforeEach(() => {
    mockClient = {
      validateCredentials: vi.fn().mockResolvedValue(true),
      getAccountDetails: vi.fn().mockResolvedValue({ accountId: '123456', name: 'Test Account' }),
      runNrqlQuery: vi.fn(),
      listApmApplications: vi.fn(),
      executeNerdGraphQuery: vi.fn(),
    } as unknown as NewRelicClient;

    process.env.NEW_RELIC_API_KEY = 'test-api-key';
    process.env.NEW_RELIC_ACCOUNT_ID = '123456';

    server = new NewRelicMCPServer(mockClient);
  });

  const handleToolCall = async (params: { name: string; arguments: any }) => {
    const result = await server.executeTool(params.name, params.arguments);
    return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
  };

  it('handles concurrent tool calls', async () => {
    mockClient.runNrqlQuery = vi.fn().mockImplementation(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
      return { results: [{ count: 100 }], metadata: {} };
    }) as any;

    const promises = [
      handleToolCall({
        name: 'run_nrql_query',
        arguments: { nrql: 'SELECT 1', account_id: '123456' },
      }),
      handleToolCall({
        name: 'run_nrql_query',
        arguments: { nrql: 'SELECT 2', account_id: '123456' },
      }),
      handleToolCall({
        name: 'run_nrql_query',
        arguments: { nrql: 'SELECT 3', account_id: '123456' },
      }),
    ];

    const results = await Promise.all(promises);
    expect(results).toHaveLength(3);
    expect(mockClient.runNrqlQuery).toHaveBeenCalledTimes(3);
  });

  it('handles large result sets', async () => {
    const largeResults = Array(1000).fill({ id: 'entity', name: 'Test' });
    mockClient.executeNerdGraphQuery = vi.fn().mockResolvedValue({
      data: { actor: { entitySearch: { results: { entities: largeResults } } } },
    }) as any;

    const result = await handleToolCall({
      name: 'search_entities',
      arguments: { query: 'large', target_account_id: '123456' },
    });

    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.entities).toHaveLength(1000);
  });
});

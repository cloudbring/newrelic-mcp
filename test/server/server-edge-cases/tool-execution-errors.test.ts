import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { NewRelicClient } from '../../../src/client/newrelic-client';
import { NewRelicMCPServer } from '../../../src/server';

describe('Server Edge Cases: Tool execution error handling', () => {
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
    try {
      const result = await server.executeTool(params.name, params.arguments);
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: 'text' as const,
            text: `Error executing tool: ${error.message}`,
          },
        ],
      };
    }
  };

  it('handles tool not found', async () => {
    const result = await handleToolCall({ name: 'nonexistent_tool', arguments: {} });
    expect(result.content[0].text).toContain('Error executing tool');
    expect(result.content[0].text).toContain('not found');
  });

  it('handles tool execution errors gracefully', async () => {
    mockClient.runNrqlQuery = vi.fn().mockRejectedValue(new Error('Network error')) as any;

    const result = await handleToolCall({
      name: 'run_nrql_query',
      arguments: { nrql: 'SELECT * FROM Transaction', account_id: '123456' },
    });

    expect(result.content[0].text).toContain('Error executing tool');
    expect(result.content[0].text).toContain('Network error');
  });

  it('handles malformed tool arguments', async () => {
    const result = await handleToolCall({ name: 'run_nrql_query', arguments: null as any });
    expect(result.content[0].text).toContain('Error');
  });
});

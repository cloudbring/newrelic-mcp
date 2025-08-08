import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { NewRelicClient } from '../../../src/client/newrelic-client';
import { NewRelicMCPServer } from '../../../src/server';

describe('Server Edge Cases: Synthetics tool scenarios', () => {
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

  it('handles invalid monitor frequency', async () => {
    await expect(
      server.executeTool('create_browser_monitor', {
        name: 'Test Monitor',
        url: 'https://example.com',
        frequency: 999,
        locations: ['US_EAST_1'],
        target_account_id: '123456',
      })
    ).rejects.toThrow();
  });

  it('handles empty monitor list', async () => {
    mockClient.executeNerdGraphQuery = vi.fn().mockResolvedValue({
      data: { actor: { entitySearch: { results: { entities: [] } } } },
    }) as any;

    const result = await handleToolCall({
      name: 'list_synthetics_monitors',
      arguments: { target_account_id: '123456' },
    });
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed).toEqual([]);
  });
});

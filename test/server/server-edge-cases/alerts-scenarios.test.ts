import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { NewRelicClient } from '../../../src/client/newrelic-client';
import { NewRelicMCPServer } from '../../../src/server';

describe('Server Edge Cases: Alert tool scenarios', () => {
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

  it('handles empty alert policies', async () => {
    mockClient.executeNerdGraphQuery = vi.fn().mockResolvedValue({
      data: { actor: { account: { alerts: { policiesSearch: { policies: [] } } } } },
    }) as any;

    const result = await handleToolCall({
      name: 'list_alert_policies',
      arguments: { target_account_id: '123456' },
    });

    const parsed = JSON.parse(result.content[0].text);
    expect(parsed).toEqual([]);
  });

  it('handles malformed incident data', async () => {
    mockClient.executeNerdGraphQuery = vi.fn().mockResolvedValue({
      data: { actor: { entitySearch: { results: { entities: [{ guid: 'entity-1' }] } } } },
    }) as any;

    const result = await handleToolCall({
      name: 'list_open_incidents',
      arguments: { target_account_id: '123456' },
    });

    const parsed = JSON.parse(result.content[0].text);
    expect(parsed).toEqual([]);
  });
});

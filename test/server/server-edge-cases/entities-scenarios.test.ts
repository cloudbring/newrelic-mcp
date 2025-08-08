import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { NewRelicClient } from '../../../src/client/newrelic-client';
import { NewRelicMCPServer } from '../../../src/server';

describe('Server Edge Cases: Entity tool scenarios', () => {
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

  it('handles complex entity search queries', async () => {
    mockClient.executeNerdGraphQuery = vi.fn().mockResolvedValue({
      data: {
        actor: {
          entitySearch: {
            results: {
              entities: [
                {
                  guid: 'entity-1',
                  name: 'Complex Entity',
                  type: 'APPLICATION',
                  domain: 'APM',
                  tags: [
                    { key: 'environment', values: ['prod', 'staging'] },
                    { key: 'team', values: ['backend', 'frontend', 'devops'] },
                  ],
                },
              ],
              nextCursor: 'next-page',
            },
          },
        },
      },
    }) as any;

    const result = await handleToolCall({
      name: 'search_entities',
      arguments: {
        query: 'environment:prod AND team:backend',
        entity_types: ['APPLICATION', 'HOST'],
        target_account_id: '123456',
      },
    });

    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.entities[0].tags).toHaveLength(2);
    expect(parsed.nextCursor).toBe('next-page');
  });

  it('handles entity not found gracefully', async () => {
    mockClient.executeNerdGraphQuery = vi.fn().mockResolvedValue({
      data: { actor: { entity: null } },
    }) as any;

    await expect(
      server.executeTool('get_entity_details', { entity_guid: 'nonexistent-guid' })
    ).rejects.toThrow('Entity not found');
  });
});

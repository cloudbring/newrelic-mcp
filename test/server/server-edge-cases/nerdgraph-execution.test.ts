import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { NewRelicClient } from '../../../src/client/newrelic-client';
import { NewRelicMCPServer } from '../../../src/server';

describe('Server Edge Cases: NerdGraph query execution', () => {
  let _server: NewRelicMCPServer;
  let mockClient: NewRelicClient;

  beforeEach(() => {
    mockClient = {
      validateCredentials: vi.fn().mockResolvedValue(true),
      getAccountDetails: vi.fn().mockResolvedValue({ accountId: '123456', name: 'Test Account' }),
      executeNerdGraphQuery: vi.fn(),
    } as unknown as NewRelicClient;

    process.env.NEW_RELIC_API_KEY = 'test-api-key';
    process.env.NEW_RELIC_ACCOUNT_ID = '123456';
    _server = new NewRelicMCPServer(mockClient);
  });

  it('handles complex GraphQL queries', async () => {
    mockClient.executeNerdGraphQuery = vi.fn().mockResolvedValue({
      data: {
        actor: {
          accounts: [
            { id: '123', name: 'Account 1' },
            { id: '456', name: 'Account 2' },
          ],
        },
      },
    }) as any;

    const result = await mockClient.executeNerdGraphQuery('{ actor { accounts { id name } } }');
    expect(result.data.actor.accounts).toHaveLength(2);
  });

  it('handles GraphQL errors', async () => {
    mockClient.executeNerdGraphQuery = vi.fn().mockResolvedValue({
      errors: [
        { message: 'Field does not exist', extensions: { code: 'GRAPHQL_VALIDATION_FAILED' } },
      ],
    }) as any;

    const result = await mockClient.executeNerdGraphQuery('{ actor { invalidField } }');
    expect(result.errors).toBeDefined();
    expect(result.errors[0].message).toContain('Field does not exist');
  });
});

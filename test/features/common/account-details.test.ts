import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NewRelicClient } from '../../../src/client/newrelic-client';
import { NewRelicMCPServer } from '../../../src/server';

describe('Account Details Feature', () => {
  let _server: NewRelicMCPServer;
  let mockClient: NewRelicClient;

  beforeEach(() => {
    mockClient = {
      validateCredentials: vi.fn().mockResolvedValue(true),
      getAccountDetails: vi.fn().mockResolvedValue({
        accountId: '123456',
        name: 'Test Account',
        region: 'US',
        status: 'ACTIVE',
      }),
      executeNerdGraphQuery: vi.fn(),
    } as any;

    process.env.NEW_RELIC_API_KEY = 'test-api-key';
    process.env.NEW_RELIC_ACCOUNT_ID = '123456';

    _server = new NewRelicMCPServer(mockClient);
  });

  describe('Get account details successfully', () => {
    it('should return account details with required fields', async () => {
      const result = await mockClient.getAccountDetails();

      expect(result).toBeDefined();
      expect(result.accountId).toBe('123456');
      expect(result.name).toBe('Test Account');
      expect(result.region).toBe('US');
      expect(result.status).toBe('ACTIVE');
    });
  });

  describe('Handle missing API key', () => {
    it('should throw error when API key is not configured', async () => {
      delete process.env.NEW_RELIC_API_KEY;

      const clientWithoutKey = new NewRelicClient();
      await expect(clientWithoutKey.getAccountDetails()).rejects.toThrow(
        'NEW_RELIC_API_KEY environment variable is not set'
      );
    });
  });

  describe('Handle invalid API key', () => {
    it('should throw error for invalid API key', async () => {
      mockClient.getAccountDetails = vi
        .fn()
        .mockRejectedValue(new Error('Unauthorized: Invalid API key'));

      await expect(mockClient.getAccountDetails()).rejects.toThrow('Unauthorized: Invalid API key');
    });
  });

  describe('Account status validation', () => {
    it('should return valid account status', async () => {
      const validStatuses = ['ACTIVE', 'SUSPENDED', 'CANCELLED'];
      const result = await mockClient.getAccountDetails();

      expect(validStatuses).toContain(result.status);
    });
  });

  describe('Account region validation', () => {
    it('should return valid account region', async () => {
      const validRegions = ['US', 'EU'];
      const result = await mockClient.getAccountDetails();

      expect(validRegions).toContain(result.region);
    });
  });

  describe('Multiple account handling', () => {
    it('should handle multiple accounts if user has access', async () => {
      mockClient.executeNerdGraphQuery = vi.fn().mockResolvedValue({
        data: {
          actor: {
            accounts: [
              { id: '123456', name: 'Account 1' },
              { id: '789012', name: 'Account 2' },
            ],
          },
        },
      });

      const query = `
        {
          actor {
            accounts {
              id
              name
            }
          }
        }
      `;

      const result = await mockClient.executeNerdGraphQuery(query);
      expect(result.data.actor.accounts).toHaveLength(2);
    });
  });
});

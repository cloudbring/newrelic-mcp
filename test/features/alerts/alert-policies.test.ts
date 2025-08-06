import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { NewRelicClient } from '../../../src/client/newrelic-client';
import { NewRelicMCPServer } from '../../../src/server';

describe('Alert Policies Feature', () => {
  let _server: NewRelicMCPServer;
  let mockClient: NewRelicClient;

  beforeEach(() => {
    mockClient = {
      validateCredentials: vi.fn().mockResolvedValue(true),
      getAccountDetails: vi.fn().mockResolvedValue({ accountId: '123456', name: 'Test Account' }),
      executeNerdGraphQuery: vi.fn().mockResolvedValue({
        data: {
          actor: {
            account: {
              alerts: {
                policiesSearch: {
                  policies: [
                    {
                      id: 'policy-1',
                      name: 'Production Alert Policy',
                      incidentPreference: 'PER_POLICY',
                      conditions: [{ id: 'cond-1', name: 'High CPU', enabled: true }],
                    },
                    {
                      id: 'policy-2',
                      name: 'Staging Alert Policy',
                      incidentPreference: 'PER_CONDITION',
                      conditions: [],
                    },
                  ],
                },
              },
            },
          },
        },
      }),
    } as any;

    process.env.NEW_RELIC_API_KEY = 'test-api-key';
    process.env.NEW_RELIC_ACCOUNT_ID = '123456';

    _server = new NewRelicMCPServer(mockClient);
  });

  describe('List alert policies successfully', () => {
    it('should return a list of alert policies with required fields', async () => {
      const alertTool = new (await import('../../../src/tools/alert')).AlertTool(mockClient);
      const result = await alertTool.listAlertPolicies({ target_account_id: '123456' });

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(2);

      result.forEach((policy: any) => {
        expect(policy).toHaveProperty('id');
        expect(policy).toHaveProperty('name');
        expect(policy).toHaveProperty('incidentPreference');
      });
    });
  });

  describe('Handle no alert policies', () => {
    it('should return empty array when no policies exist', async () => {
      mockClient.executeNerdGraphQuery = vi.fn().mockResolvedValue({
        data: {
          actor: {
            account: {
              alerts: {
                policiesSearch: {
                  policies: [],
                },
              },
            },
          },
        },
      });

      const alertTool = new (await import('../../../src/tools/alert')).AlertTool(mockClient);
      const result = await alertTool.listAlertPolicies({ target_account_id: '123456' });

      expect(result).toEqual([]);
    });
  });

  describe('Handle missing account ID', () => {
    it('should throw error when account ID is not provided', async () => {
      const alertTool = new (await import('../../../src/tools/alert')).AlertTool(mockClient);

      await expect(alertTool.listAlertPolicies({})).rejects.toThrow('Account ID must be provided');
    });
  });

  describe('Alert policy conditions', () => {
    it('should include conditions for each policy', async () => {
      const alertTool = new (await import('../../../src/tools/alert')).AlertTool(mockClient);
      const result = await alertTool.listAlertPolicies({ target_account_id: '123456' });

      expect(result[0].conditions).toBeDefined();
      expect(result[0].conditions).toHaveLength(1);
      expect(result[0].conditions[0]).toHaveProperty('id');
      expect(result[0].conditions[0]).toHaveProperty('name');
      expect(result[0].conditions[0]).toHaveProperty('enabled');
    });
  });
});

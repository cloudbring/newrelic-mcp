import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { NewRelicClient } from '../../../src/client/newrelic-client';
import { NewRelicMCPServer } from '../../../src/server';

describe('Acknowledge Incidents Feature', () => {
  let _server: NewRelicMCPServer;
  let mockClient: NewRelicClient;

  beforeEach(() => {
    mockClient = {
      validateCredentials: vi.fn().mockResolvedValue(true),
      getAccountDetails: vi.fn().mockResolvedValue({ accountId: '123456', name: 'Test Account' }),
      executeNerdGraphQuery: vi.fn().mockResolvedValue({
        data: {
          aiIssuesAcknowledge: {
            issues: [
              {
                issueId: 'incident-1',
                state: 'ACKNOWLEDGED',
                acknowledgedAt: '2024-01-01T10:00:00Z',
                acknowledgedBy: 'user@example.com',
              },
            ],
            errors: [],
          },
        },
      }),
    } as unknown as NewRelicClient;

    process.env.NEW_RELIC_API_KEY = 'test-api-key';
    process.env.NEW_RELIC_ACCOUNT_ID = '123456';

    _server = new NewRelicMCPServer(mockClient);
  });

  describe('Acknowledge incident successfully', () => {
    it('should acknowledge an open incident', async () => {
      const alertTool = new (await import('../../../src/tools/alert')).AlertTool(mockClient);
      const result = await alertTool.acknowledgeIncident({
        incident_id: 'incident-1',
        target_account_id: '123456',
      });

      expect(result).toBeDefined();
      expect(result.issueId).toBe('incident-1');
      expect(result.state).toBe('ACKNOWLEDGED');
      expect(result.acknowledgedAt).toBeDefined();
    });
  });

  describe('Acknowledge multiple incidents', () => {
    it('should acknowledge multiple incidents at once', async () => {
      mockClient.executeNerdGraphQuery = vi.fn().mockResolvedValue({
        data: {
          aiIssuesAcknowledge: {
            issues: [
              { issueId: 'incident-1', state: 'ACKNOWLEDGED' },
              { issueId: 'incident-2', state: 'ACKNOWLEDGED' },
            ],
            errors: [],
          },
        },
      });

      const alertTool = new (await import('../../../src/tools/alert')).AlertTool(mockClient);
      const result = await alertTool.acknowledgeIncidents({
        incident_ids: ['incident-1', 'incident-2'],
        target_account_id: '123456',
      });

      expect(result).toHaveLength(2);
      expect(result[0].state).toBe('ACKNOWLEDGED');
      expect(result[1].state).toBe('ACKNOWLEDGED');
    });
  });

  describe('Handle already acknowledged incident', () => {
    it('should handle incident already acknowledged', async () => {
      mockClient.executeNerdGraphQuery = vi.fn().mockResolvedValue({
        data: {
          aiIssuesAcknowledge: {
            issues: [],
            errors: [
              {
                type: 'INVALID_STATE',
                description: 'Incident is already acknowledged',
              },
            ],
          },
        },
      });

      const alertTool = new (await import('../../../src/tools/alert')).AlertTool(mockClient);

      await expect(
        alertTool.acknowledgeIncident({
          incident_id: 'incident-1',
          target_account_id: '123456',
        })
      ).rejects.toThrow('Incident is already acknowledged');
    });
  });

  describe('Handle closed incident', () => {
    it('should not acknowledge a closed incident', async () => {
      mockClient.executeNerdGraphQuery = vi.fn().mockResolvedValue({
        data: {
          aiIssuesAcknowledge: {
            issues: [],
            errors: [
              {
                type: 'INVALID_STATE',
                description: 'Cannot acknowledge closed incident',
              },
            ],
          },
        },
      });

      const alertTool = new (await import('../../../src/tools/alert')).AlertTool(mockClient);

      await expect(
        alertTool.acknowledgeIncident({
          incident_id: 'closed-incident',
          target_account_id: '123456',
        })
      ).rejects.toThrow('Cannot acknowledge closed incident');
    });
  });

  describe('Handle invalid incident ID', () => {
    it('should handle invalid incident ID', async () => {
      mockClient.executeNerdGraphQuery = vi.fn().mockResolvedValue({
        data: {
          aiIssuesAcknowledge: {
            issues: [],
            errors: [
              {
                type: 'NOT_FOUND',
                description: 'Incident not found',
              },
            ],
          },
        },
      });

      const alertTool = new (await import('../../../src/tools/alert')).AlertTool(mockClient);

      await expect(
        alertTool.acknowledgeIncident({
          incident_id: 'invalid-id',
          target_account_id: '123456',
        })
      ).rejects.toThrow('Incident not found');
    });
  });

  describe('Acknowledge with comment', () => {
    it('should acknowledge incident with a comment', async () => {
      mockClient.executeNerdGraphQuery = vi.fn().mockResolvedValue({
        data: {
          aiIssuesAcknowledge: {
            issues: [
              {
                issueId: 'incident-1',
                state: 'ACKNOWLEDGED',
                acknowledgedAt: '2024-01-01T10:00:00Z',
                comment: 'Investigating the issue',
              },
            ],
            errors: [],
          },
        },
      });

      const alertTool = new (await import('../../../src/tools/alert')).AlertTool(mockClient);
      const result = await alertTool.acknowledgeIncident({
        incident_id: 'incident-1',
        comment: 'Investigating the issue',
        target_account_id: '123456',
      });

      expect(result.comment).toBe('Investigating the issue');
    });
  });

  describe('Permission handling', () => {
    it('should handle insufficient permissions', async () => {
      mockClient.executeNerdGraphQuery = vi.fn().mockResolvedValue({
        data: {
          aiIssuesAcknowledge: {
            issues: [],
            errors: [
              {
                type: 'FORBIDDEN',
                description: 'Insufficient permissions to acknowledge incidents',
              },
            ],
          },
        },
      });

      const alertTool = new (await import('../../../src/tools/alert')).AlertTool(mockClient);

      await expect(
        alertTool.acknowledgeIncident({
          incident_id: 'incident-1',
          target_account_id: '123456',
        })
      ).rejects.toThrow('Insufficient permissions');
    });
  });
});

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NewRelicMCPServer } from '../../../src/server';
import { NewRelicClient } from '../../../src/client/newrelic-client';

describe('Open Incidents Feature', () => {
  let server: NewRelicMCPServer;
  let mockClient: NewRelicClient;

  beforeEach(() => {
    mockClient = {
      validateCredentials: vi.fn().mockResolvedValue(true),
      getAccountDetails: vi.fn().mockResolvedValue({ accountId: '123456', name: 'Test Account' }),
      executeNerdGraphQuery: vi.fn().mockResolvedValue({
        data: {
          actor: {
            entitySearch: {
              results: {
                entities: [
                  {
                    issues: {
                      issues: [
                        {
                          issueId: 'incident-1',
                          title: 'High CPU Usage',
                          priority: 'CRITICAL',
                          state: 'OPEN',
                          createdAt: '2024-01-01T00:00:00Z',
                          sources: ['APM']
                        },
                        {
                          issueId: 'incident-2',
                          title: 'Memory Warning',
                          priority: 'HIGH',
                          state: 'OPEN',
                          createdAt: '2024-01-01T01:00:00Z',
                          sources: ['Infrastructure']
                        }
                      ]
                    }
                  }
                ]
              }
            }
          }
        }
      })
    } as any;

    process.env.NEW_RELIC_API_KEY = 'test-api-key';
    process.env.NEW_RELIC_ACCOUNT_ID = '123456';
    
    server = new NewRelicMCPServer(mockClient);
  });

  describe('List open incidents successfully', () => {
    it('should return a list of open incidents with required fields', async () => {
      const alertTool = new (await import('../../../src/tools/alert')).AlertTool(mockClient);
      const result = await alertTool.listOpenIncidents({ target_account_id: '123456' });

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(2);
      
      result.forEach((incident: any) => {
        expect(incident).toHaveProperty('issueId');
        expect(incident).toHaveProperty('title');
        expect(incident).toHaveProperty('priority');
        expect(incident).toHaveProperty('state');
        expect(incident).toHaveProperty('createdAt');
        expect(incident).toHaveProperty('sources');
        expect(incident.state).toBe('OPEN');
      });
    });
  });

  describe('Filter incidents by priority', () => {
    it('should filter incidents by priority level', async () => {
      const alertTool = new (await import('../../../src/tools/alert')).AlertTool(mockClient);
      
      // Mock should be called with priority filter
      const result = await alertTool.listOpenIncidents({ 
        target_account_id: '123456',
        priority: 'CRITICAL'
      });

      expect(mockClient.executeNerdGraphQuery).toHaveBeenCalled();
      const query = mockClient.executeNerdGraphQuery.mock.calls[0][0];
      expect(query).toContain('CRITICAL');
    });
  });

  describe('Handle no open incidents', () => {
    it('should return empty array when no incidents exist', async () => {
      mockClient.executeNerdGraphQuery = vi.fn().mockResolvedValue({
        data: {
          actor: {
            entitySearch: {
              results: {
                entities: []
              }
            }
          }
        }
      });
      
      const alertTool = new (await import('../../../src/tools/alert')).AlertTool(mockClient);
      const result = await alertTool.listOpenIncidents({ target_account_id: '123456' });

      expect(result).toEqual([]);
    });
  });

  describe('Incident priority levels', () => {
    it('should validate priority levels', async () => {
      const alertTool = new (await import('../../../src/tools/alert')).AlertTool(mockClient);
      const result = await alertTool.listOpenIncidents({ target_account_id: '123456' });

      const validPriorities = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
      result.forEach((incident: any) => {
        expect(validPriorities).toContain(incident.priority);
      });
    });
  });

  describe('Incident timestamps', () => {
    it('should include valid timestamps', async () => {
      const alertTool = new (await import('../../../src/tools/alert')).AlertTool(mockClient);
      const result = await alertTool.listOpenIncidents({ target_account_id: '123456' });

      result.forEach((incident: any) => {
        expect(incident.createdAt).toBeDefined();
        expect(() => new Date(incident.createdAt)).not.toThrow();
      });
    });
  });
});
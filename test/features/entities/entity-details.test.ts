import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NewRelicMCPServer } from '../../../src/server';
import { NewRelicClient } from '../../../src/client/newrelic-client';

describe('Entity Details Feature', () => {
  let server: NewRelicMCPServer;
  let mockClient: NewRelicClient;

  beforeEach(() => {
    mockClient = {
      validateCredentials: vi.fn().mockResolvedValue(true),
      getAccountDetails: vi.fn().mockResolvedValue({ accountId: '123456', name: 'Test Account' }),
      executeNerdGraphQuery: vi.fn().mockResolvedValue({
        data: {
          actor: {
            entity: {
              guid: 'entity-123',
              name: 'Production API',
              type: 'APPLICATION',
              domain: 'APM',
              reporting: true,
              entityType: 'APM_APPLICATION_ENTITY',
              tags: [
                { key: 'environment', values: ['production'] },
                { key: 'team', values: ['backend'] }
              ],
              alertSeverity: 'NOT_ALERTING',
              recentAlertViolations: [],
              relationships: [
                {
                  type: 'HOSTS',
                  target: {
                    entities: [
                      { guid: 'host-1', name: 'app-server-01' }
                    ]
                  }
                }
              ],
              goldenMetrics: {
                metrics: [
                  { name: 'responseTime', value: 250, unit: 'ms' },
                  { name: 'throughput', value: 1000, unit: 'rpm' },
                  { name: 'errorRate', value: 0.1, unit: 'percent' }
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

  describe('Get entity details successfully', () => {
    it('should return entity details with all fields', async () => {
      const entityTool = new (await import('../../../src/tools/entity')).EntityTool(mockClient);
      const result = await entityTool.getEntityDetails({ 
        entity_guid: 'entity-123'
      });

      expect(result).toBeDefined();
      expect(result.guid).toBe('entity-123');
      expect(result.name).toBe('Production API');
      expect(result.type).toBe('APPLICATION');
      expect(result.domain).toBe('APM');
      expect(result.reporting).toBe(true);
      expect(result.tags).toHaveLength(2);
      expect(result.alertSeverity).toBe('NOT_ALERTING');
    });
  });

  describe('Entity tags handling', () => {
    it('should include all tags with values', async () => {
      const entityTool = new (await import('../../../src/tools/entity')).EntityTool(mockClient);
      const result = await entityTool.getEntityDetails({ 
        entity_guid: 'entity-123'
      });

      expect(result.tags).toBeDefined();
      expect(Array.isArray(result.tags)).toBe(true);
      
      const envTag = result.tags.find((t: any) => t.key === 'environment');
      expect(envTag).toBeDefined();
      expect(envTag.values).toContain('production');
    });
  });

  describe('Entity relationships', () => {
    it('should include related entities', async () => {
      const entityTool = new (await import('../../../src/tools/entity')).EntityTool(mockClient);
      const result = await entityTool.getEntityDetails({ 
        entity_guid: 'entity-123'
      });

      expect(result.relationships).toBeDefined();
      expect(result.relationships[0].type).toBe('HOSTS');
      expect(result.relationships[0].target.entities).toHaveLength(1);
      expect(result.relationships[0].target.entities[0].name).toBe('app-server-01');
    });
  });

  describe('Golden metrics', () => {
    it('should include golden metrics when available', async () => {
      const entityTool = new (await import('../../../src/tools/entity')).EntityTool(mockClient);
      const result = await entityTool.getEntityDetails({ 
        entity_guid: 'entity-123'
      });

      expect(result.goldenMetrics).toBeDefined();
      expect(result.goldenMetrics.metrics).toHaveLength(3);
      
      const responseTime = result.goldenMetrics.metrics.find((m: any) => m.name === 'responseTime');
      expect(responseTime).toBeDefined();
      expect(responseTime.value).toBe(250);
      expect(responseTime.unit).toBe('ms');
    });
  });

  describe('Alert severity levels', () => {
    it('should return valid alert severity', async () => {
      const entityTool = new (await import('../../../src/tools/entity')).EntityTool(mockClient);
      const result = await entityTool.getEntityDetails({ 
        entity_guid: 'entity-123'
      });

      const validSeverities = ['NOT_ALERTING', 'WARNING', 'CRITICAL'];
      expect(validSeverities).toContain(result.alertSeverity);
    });
  });

  describe('Entity not found', () => {
    it('should handle entity not found error', async () => {
      mockClient.executeNerdGraphQuery = vi.fn().mockResolvedValue({
        data: {
          actor: {
            entity: null
          }
        }
      });

      const entityTool = new (await import('../../../src/tools/entity')).EntityTool(mockClient);
      
      await expect(entityTool.getEntityDetails({ 
        entity_guid: 'nonexistent-guid'
      })).rejects.toThrow('Entity not found');
    });
  });

  describe('Recent alert violations', () => {
    it('should include recent alert violations when present', async () => {
      mockClient.executeNerdGraphQuery = vi.fn().mockResolvedValue({
        data: {
          actor: {
            entity: {
              guid: 'entity-123',
              name: 'Production API',
              type: 'APPLICATION',
              domain: 'APM',
              recentAlertViolations: [
                {
                  alertSeverity: 'CRITICAL',
                  violationId: 'violation-1',
                  openedAt: '2024-01-01T10:00:00Z',
                  closedAt: '2024-01-01T10:30:00Z',
                  violationUrl: 'https://one.newrelic.com/violations/1'
                }
              ]
            }
          }
        }
      });

      const entityTool = new (await import('../../../src/tools/entity')).EntityTool(mockClient);
      const result = await entityTool.getEntityDetails({ 
        entity_guid: 'entity-123'
      });

      expect(result.recentAlertViolations).toHaveLength(1);
      expect(result.recentAlertViolations[0].alertSeverity).toBe('CRITICAL');
    });
  });
});
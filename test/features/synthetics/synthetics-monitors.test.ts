import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { NewRelicClient } from '../../../src/client/newrelic-client';
import { NewRelicMCPServer } from '../../../src/server';

describe('Synthetics Monitors Feature', () => {
  let _server: NewRelicMCPServer;
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
                    guid: 'monitor-1',
                    name: 'Homepage Monitor',
                    monitorType: 'SIMPLE',
                    period: 'EVERY_5_MINUTES',
                    monitoredUrl: 'https://example.com',
                    tags: [{ key: 'team', values: ['frontend'] }],
                  },
                  {
                    guid: 'monitor-2',
                    name: 'API Monitor',
                    monitorType: 'SCRIPT_API',
                    period: 'EVERY_10_MINUTES',
                    monitoredUrl: null,
                    tags: [{ key: 'team', values: ['backend'] }],
                  },
                ],
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

  describe('List synthetics monitors successfully', () => {
    it('should return a list of monitors with required fields', async () => {
      const syntheticsTool = new (await import('../../../src/tools/synthetics')).SyntheticsTool(
        mockClient
      );
      const result = await syntheticsTool.listSyntheticsMonitors({
        target_account_id: '123456',
      });

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(2);

      result.forEach((monitor: any) => {
        expect(monitor).toHaveProperty('guid');
        expect(monitor).toHaveProperty('name');
        expect(monitor).toHaveProperty('monitorType');
        expect(monitor).toHaveProperty('period');
        expect(monitor).toHaveProperty('tags');
      });
    });
  });

  describe('Filter monitors by type', () => {
    it('should filter monitors by monitor type', async () => {
      const syntheticsTool = new (await import('../../../src/tools/synthetics')).SyntheticsTool(
        mockClient
      );

      await syntheticsTool.listSyntheticsMonitors({
        target_account_id: '123456',
        monitor_type: 'SIMPLE',
      });

      expect(mockClient.executeNerdGraphQuery).toHaveBeenCalled();
      const query = mockClient.executeNerdGraphQuery.mock.calls[0][0];
      expect(query).toContain('SIMPLE');
    });
  });

  describe('Monitor types validation', () => {
    it('should return valid monitor types', async () => {
      const syntheticsTool = new (await import('../../../src/tools/synthetics')).SyntheticsTool(
        mockClient
      );
      const result = await syntheticsTool.listSyntheticsMonitors({
        target_account_id: '123456',
      });

      const validTypes = ['SIMPLE', 'BROWSER', 'SCRIPT_API', 'SCRIPT_BROWSER'];
      result.forEach((monitor: any) => {
        expect(validTypes).toContain(monitor.monitorType);
      });
    });
  });

  describe('Monitor frequency periods', () => {
    it('should return valid frequency periods', async () => {
      const syntheticsTool = new (await import('../../../src/tools/synthetics')).SyntheticsTool(
        mockClient
      );
      const result = await syntheticsTool.listSyntheticsMonitors({
        target_account_id: '123456',
      });

      const validPeriods = [
        'EVERY_MINUTE',
        'EVERY_5_MINUTES',
        'EVERY_10_MINUTES',
        'EVERY_15_MINUTES',
        'EVERY_30_MINUTES',
        'EVERY_HOUR',
        'EVERY_6_HOURS',
        'EVERY_12_HOURS',
        'EVERY_DAY',
      ];

      result.forEach((monitor: any) => {
        expect(validPeriods).toContain(monitor.period);
      });
    });
  });

  describe('Create browser monitor', () => {
    it('should create a new browser monitor', async () => {
      mockClient.executeNerdGraphQuery = vi.fn().mockResolvedValue({
        data: {
          syntheticsCreateSimpleBrowserMonitor: {
            monitor: {
              id: 'new-monitor-id',
              name: 'New Monitor',
              uri: 'https://newsite.com',
              period: 'EVERY_5_MINUTES',
              status: 'ENABLED',
            },
            errors: [],
          },
        },
      });

      const syntheticsTool = new (await import('../../../src/tools/synthetics')).SyntheticsTool(
        mockClient
      );
      const result = await syntheticsTool.createBrowserMonitor({
        name: 'New Monitor',
        url: 'https://newsite.com',
        frequency: 5,
        locations: ['US_EAST_1', 'EU_WEST_1'],
        target_account_id: '123456',
      });

      expect(result).toBeDefined();
      expect(result.id).toBe('new-monitor-id');
      expect(result.name).toBe('New Monitor');
      expect(result.uri).toBe('https://newsite.com');
      expect(result.status).toBe('ENABLED');
    });
  });

  describe('Handle monitor creation errors', () => {
    it('should handle creation errors properly', async () => {
      mockClient.executeNerdGraphQuery = vi.fn().mockResolvedValue({
        data: {
          syntheticsCreateSimpleBrowserMonitor: {
            monitor: null,
            errors: [{ type: 'VALIDATION_ERROR', description: 'Invalid URL format' }],
          },
        },
      });

      const syntheticsTool = new (await import('../../../src/tools/synthetics')).SyntheticsTool(
        mockClient
      );

      await expect(
        syntheticsTool.createBrowserMonitor({
          name: 'Bad Monitor',
          url: 'invalid-url',
          frequency: 5,
          locations: ['US_EAST_1'],
          target_account_id: '123456',
        })
      ).rejects.toThrow('Failed to create monitor: Invalid URL format');
    });
  });

  describe('Monitor locations validation', () => {
    it('should validate monitor locations', async () => {
      const syntheticsTool = new (await import('../../../src/tools/synthetics')).SyntheticsTool(
        mockClient
      );

      const validLocations = [
        'US_EAST_1',
        'US_WEST_1',
        'EU_WEST_1',
        'EU_CENTRAL_1',
        'AP_SOUTHEAST_1',
        'AP_NORTHEAST_1',
      ];

      // The tool should accept valid location codes
      await syntheticsTool.createBrowserMonitor({
        name: 'Monitor with Locations',
        url: 'https://example.com',
        frequency: 5,
        locations: validLocations.slice(0, 2),
        target_account_id: '123456',
      });

      expect(mockClient.executeNerdGraphQuery).toHaveBeenCalled();
    });
  });
});

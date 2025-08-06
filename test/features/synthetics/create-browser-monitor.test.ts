import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { NewRelicClient } from '../../../src/client/newrelic-client';
import { NewRelicMCPServer } from '../../../src/server';

describe('Create Browser Monitor Feature', () => {
  let _server: NewRelicMCPServer;
  let mockClient: NewRelicClient;

  beforeEach(() => {
    mockClient = {
      validateCredentials: vi.fn().mockResolvedValue(true),
      getAccountDetails: vi.fn().mockResolvedValue({ accountId: '123456', name: 'Test Account' }),
      executeNerdGraphQuery: vi.fn().mockResolvedValue({
        data: {
          syntheticsCreateSimpleBrowserMonitor: {
            monitor: {
              id: 'new-monitor-id',
              guid: 'monitor-guid-123',
              name: 'Homepage Monitor',
              uri: 'https://example.com',
              period: 'EVERY_5_MINUTES',
              status: 'ENABLED',
              locations: {
                public: ['US_EAST_1', 'EU_WEST_1'],
              },
              createdAt: '2024-01-01T10:00:00Z',
            },
            errors: [],
          },
        },
      }),
    } as any;

    process.env.NEW_RELIC_API_KEY = 'test-api-key';
    process.env.NEW_RELIC_ACCOUNT_ID = '123456';

    _server = new NewRelicMCPServer(mockClient);
  });

  describe('Create simple browser monitor', () => {
    it('should create a browser monitor successfully', async () => {
      const syntheticsTool = new (await import('../../../src/tools/synthetics')).SyntheticsTool(
        mockClient
      );
      const result = await syntheticsTool.createBrowserMonitor({
        name: 'Homepage Monitor',
        url: 'https://example.com',
        frequency: 5,
        locations: ['US_EAST_1', 'EU_WEST_1'],
        target_account_id: '123456',
      });

      expect(result).toBeDefined();
      expect(result.id).toBe('new-monitor-id');
      expect(result.name).toBe('Homepage Monitor');
      expect(result.uri).toBe('https://example.com');
      expect(result.period).toBe('EVERY_5_MINUTES');
      expect(result.status).toBe('ENABLED');
    });
  });

  describe('Frequency mapping', () => {
    it('should map frequency values correctly', async () => {
      const syntheticsTool = new (await import('../../../src/tools/synthetics')).SyntheticsTool(
        mockClient
      );

      const frequencyMap = [
        { input: 1, expected: 'EVERY_MINUTE' },
        { input: 5, expected: 'EVERY_5_MINUTES' },
        { input: 10, expected: 'EVERY_10_MINUTES' },
        { input: 15, expected: 'EVERY_15_MINUTES' },
        { input: 30, expected: 'EVERY_30_MINUTES' },
        { input: 60, expected: 'EVERY_HOUR' },
        { input: 360, expected: 'EVERY_6_HOURS' },
        { input: 720, expected: 'EVERY_12_HOURS' },
        { input: 1440, expected: 'EVERY_DAY' },
      ];

      for (const { input, expected } of frequencyMap) {
        mockClient.executeNerdGraphQuery = vi.fn().mockResolvedValue({
          data: {
            syntheticsCreateSimpleBrowserMonitor: {
              monitor: {
                id: 'monitor-id',
                period: expected,
              },
              errors: [],
            },
          },
        });

        const result = await syntheticsTool.createBrowserMonitor({
          name: 'Test Monitor',
          url: 'https://example.com',
          frequency: input,
          locations: ['US_EAST_1'],
          target_account_id: '123456',
        });

        expect(result.period).toBe(expected);
      }
    });
  });

  describe('Location validation', () => {
    it('should validate location codes', async () => {
      const syntheticsTool = new (await import('../../../src/tools/synthetics')).SyntheticsTool(
        mockClient
      );

      const validLocations = [
        'US_EAST_1',
        'US_EAST_2',
        'US_WEST_1',
        'US_WEST_2',
        'EU_WEST_1',
        'EU_WEST_2',
        'EU_WEST_3',
        'EU_CENTRAL_1',
        'EU_NORTH_1',
        'EU_SOUTH_1',
        'AP_EAST_1',
        'AP_SOUTHEAST_1',
        'AP_SOUTHEAST_2',
        'AP_NORTHEAST_1',
        'AP_NORTHEAST_2',
        'AP_SOUTH_1',
        'CA_CENTRAL_1',
        'SA_EAST_1',
        'ME_SOUTH_1',
        'AF_SOUTH_1',
      ];

      const _result = await syntheticsTool.createBrowserMonitor({
        name: 'Global Monitor',
        url: 'https://example.com',
        frequency: 5,
        locations: validLocations.slice(0, 3),
        target_account_id: '123456',
      });

      expect(mockClient.executeNerdGraphQuery).toHaveBeenCalled();
    });
  });

  describe('URL validation', () => {
    it('should reject invalid URLs', async () => {
      mockClient.executeNerdGraphQuery = vi.fn().mockResolvedValue({
        data: {
          syntheticsCreateSimpleBrowserMonitor: {
            monitor: null,
            errors: [
              {
                type: 'VALIDATION_ERROR',
                description: 'Invalid URL format',
              },
            ],
          },
        },
      });

      const syntheticsTool = new (await import('../../../src/tools/synthetics')).SyntheticsTool(
        mockClient
      );

      await expect(
        syntheticsTool.createBrowserMonitor({
          name: 'Bad URL Monitor',
          url: 'not-a-valid-url',
          frequency: 5,
          locations: ['US_EAST_1'],
          target_account_id: '123456',
        })
      ).rejects.toThrow('Invalid URL format');
    });
  });

  describe('Advanced settings', () => {
    it('should create monitor with advanced settings', async () => {
      mockClient.executeNerdGraphQuery = vi.fn().mockResolvedValue({
        data: {
          syntheticsCreateSimpleBrowserMonitor: {
            monitor: {
              id: 'advanced-monitor',
              name: 'Advanced Monitor',
              uri: 'https://example.com',
              advancedOptions: {
                enableScreenshotOnFailureAndScript: true,
                verifySsl: true,
                treatRedirectAsFailure: false,
                responseValidationText: 'Success',
                bypassHeadRequest: false,
                useTlsValidation: true,
              },
            },
            errors: [],
          },
        },
      });

      const syntheticsTool = new (await import('../../../src/tools/synthetics')).SyntheticsTool(
        mockClient
      );
      const result = await syntheticsTool.createBrowserMonitor({
        name: 'Advanced Monitor',
        url: 'https://example.com',
        frequency: 5,
        locations: ['US_EAST_1'],
        verify_ssl: true,
        validation_text: 'Success',
        target_account_id: '123456',
      });

      expect(result.id).toBe('advanced-monitor');
      expect(result.advancedOptions).toBeDefined();
    });
  });

  describe('Handle creation errors', () => {
    it('should handle duplicate name error', async () => {
      mockClient.executeNerdGraphQuery = vi.fn().mockResolvedValue({
        data: {
          syntheticsCreateSimpleBrowserMonitor: {
            monitor: null,
            errors: [
              {
                type: 'DUPLICATE_NAME',
                description: 'A monitor with this name already exists',
              },
            ],
          },
        },
      });

      const syntheticsTool = new (await import('../../../src/tools/synthetics')).SyntheticsTool(
        mockClient
      );

      await expect(
        syntheticsTool.createBrowserMonitor({
          name: 'Existing Monitor',
          url: 'https://example.com',
          frequency: 5,
          locations: ['US_EAST_1'],
          target_account_id: '123456',
        })
      ).rejects.toThrow('A monitor with this name already exists');
    });
  });

  describe('Private locations', () => {
    it('should support private locations', async () => {
      mockClient.executeNerdGraphQuery = vi.fn().mockResolvedValue({
        data: {
          syntheticsCreateSimpleBrowserMonitor: {
            monitor: {
              id: 'private-monitor',
              name: 'Private Location Monitor',
              uri: 'https://internal.example.com',
              locations: {
                private: ['PRIVATE_LOCATION_GUID'],
              },
            },
            errors: [],
          },
        },
      });

      const syntheticsTool = new (await import('../../../src/tools/synthetics')).SyntheticsTool(
        mockClient
      );
      const result = await syntheticsTool.createBrowserMonitor({
        name: 'Private Location Monitor',
        url: 'https://internal.example.com',
        frequency: 5,
        private_locations: ['PRIVATE_LOCATION_GUID'],
        target_account_id: '123456',
      });

      expect(result.locations.private).toContain('PRIVATE_LOCATION_GUID');
    });
  });
});

import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { NewRelicClient } from '../../../src/client/newrelic-client';
import { NewRelicMCPServer } from '../../../src/server';

describe('NRQL Query Feature', () => {
  let server: NewRelicMCPServer;
  let mockClient: NewRelicClient;

  beforeEach(() => {
    mockClient = {
      validateCredentials: vi.fn().mockResolvedValue(true),
      runNrqlQuery: vi.fn().mockResolvedValue({
        results: [{ count: 100 }],
        metadata: {
          eventTypes: ['Transaction'],
          timeWindow: { begin: 1234567890, end: 1234567900 },
        },
      }),
      executeNerdGraphQuery: vi.fn().mockResolvedValue({ data: {} }),
    } as any;

    process.env.NEW_RELIC_API_KEY = 'test-api-key';
    process.env.NEW_RELIC_ACCOUNT_ID = '123456';

    server = new NewRelicMCPServer(mockClient);
  });

  describe('Execute a simple NRQL query', () => {
    it('should return query results with metadata', async () => {
      const result = await server.executeTool('run_nrql_query', {
        nrql: 'SELECT count(*) FROM Transaction TIMESERIES',
        target_account_id: '123456',
      });

      expect(result).toBeDefined();
      expect(result.results).toBeDefined();
      expect(result.metadata).toBeDefined();
      expect(mockClient.runNrqlQuery).toHaveBeenCalledWith({
        nrql: 'SELECT count(*) FROM Transaction TIMESERIES',
        accountId: '123456',
      });
    });
  });

  describe('Handle missing account ID', () => {
    it('should throw error when no account ID is provided', async () => {
      delete process.env.NEW_RELIC_ACCOUNT_ID;
      const serverNoAccount = new NewRelicMCPServer(mockClient);

      await expect(
        serverNoAccount.executeTool('run_nrql_query', {
          nrql: 'SELECT count(*) FROM Transaction',
        })
      ).rejects.toThrow('Account ID must be provided');
    });
  });

  describe('Handle invalid NRQL query', () => {
    it('should throw error for empty NRQL query', async () => {
      await expect(
        server.executeTool('run_nrql_query', {
          nrql: '',
          target_account_id: '123456',
        })
      ).rejects.toThrow('Invalid or empty NRQL query provided');
    });
  });

  describe('Handle NRQL syntax errors', () => {
    it('should throw error for syntax errors', async () => {
      mockClient.runNrqlQuery = vi
        .fn()
        .mockRejectedValue(new Error('NRQL Syntax error: invalid query'));

      await expect(
        server.executeTool('run_nrql_query', {
          nrql: 'SELEKT count(*) FROM Transaction',
          target_account_id: '123456',
        })
      ).rejects.toThrow('Syntax error');
    });
  });

  describe('Handle time-series queries', () => {
    it('should include timeSeries metadata for TIMESERIES queries', async () => {
      mockClient.runNrqlQuery = vi.fn().mockResolvedValue({
        results: [
          { timestamp: 1234567890, count: 100 },
          { timestamp: 1234567900, count: 110 },
        ],
        metadata: {
          eventTypes: ['Transaction'],
          timeWindow: { begin: 1234567890, end: 1234567900 },
          timeSeries: true,
        },
      });

      const result = await server.executeTool('run_nrql_query', {
        nrql: 'SELECT count(*) FROM Transaction TIMESERIES',
        target_account_id: '123456',
      });

      expect(result.metadata.timeSeries).toBe(true);
      expect(result.results).toHaveLength(2);
    });
  });

  describe('Handle facet queries', () => {
    it('should include facets metadata for FACET queries', async () => {
      mockClient.runNrqlQuery = vi.fn().mockResolvedValue({
        results: [
          { facet: 'web', count: 100 },
          { facet: 'mobile', count: 50 },
        ],
        metadata: {
          facets: ['appName'],
          eventTypes: ['Transaction'],
        },
      });

      const result = await server.executeTool('run_nrql_query', {
        nrql: 'SELECT count(*) FROM Transaction FACET appName',
        target_account_id: '123456',
      });

      expect(result.metadata.facets).toContain('appName');
      expect(result.results).toHaveLength(2);
      expect(result.results[0]).toHaveProperty('facet');
    });
  });

  describe('Cross-account query support', () => {
    it('should execute query against specified account', async () => {
      await server.executeTool('run_nrql_query', {
        nrql: 'SELECT count(*) FROM Transaction',
        target_account_id: '789012',
      });

      expect(mockClient.runNrqlQuery).toHaveBeenCalledWith({
        nrql: 'SELECT count(*) FROM Transaction',
        accountId: '789012',
      });
    });
  });
});

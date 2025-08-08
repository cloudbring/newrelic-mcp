import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { NewRelicClient } from '../../src/client/newrelic-client';
import { NrqlTool } from '../../src/tools/nrql';

describe('NRQL Query Tool', () => {
  let tool: NrqlTool;
  let mockClient: NewRelicClient;

  beforeEach(() => {
    mockClient = {
      runNrqlQuery: vi.fn(),
    } as unknown as NewRelicClient;

    tool = new NrqlTool(mockClient);
  });

  describe('Tool Definition', () => {
    it('should have correct metadata', () => {
      expect(tool.name).toBe('run_nrql_query');
      expect(tool.description).toContain('Execute NRQL queries');
    });

    it('should have valid input schema', () => {
      const schema = tool.getInputSchema();
      expect(schema.type).toBe('object');
      expect(schema.properties).toHaveProperty('nrql');
      expect(schema.properties).toHaveProperty('target_account_id');
      expect(schema.required).toEqual(['nrql']);
    });
  });

  describe('Query Execution', () => {
    it('should execute valid NRQL query successfully', async () => {
      const mockResults = {
        results: [{ count: 100 }],
        metadata: {
          eventTypes: ['Transaction'],
          timeWindow: { begin: 1234567890, end: 1234567900 },
        },
      };

      (mockClient.runNrqlQuery as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockResults
      );

      const result = await tool.execute({
        nrql: 'SELECT count(*) FROM Transaction',
        target_account_id: '123456',
      });

      expect(result).toEqual(mockResults);
      expect(mockClient.runNrqlQuery).toHaveBeenCalledWith({
        nrql: 'SELECT count(*) FROM Transaction',
        accountId: '123456',
      });
    });

    it('should reject empty NRQL query', async () => {
      await expect(
        tool.execute({
          nrql: '',
          target_account_id: '123456',
        })
      ).rejects.toThrow('Invalid or empty NRQL query provided');
    });

    it('should reject null NRQL query', async () => {
      await expect(
        tool.execute({
          nrql: null as unknown as string,
          target_account_id: '123456',
        })
      ).rejects.toThrow('Invalid or empty NRQL query provided');
    });

    it('should require account ID', async () => {
      await expect(
        tool.execute({
          nrql: 'SELECT count(*) FROM Transaction',
        })
      ).rejects.toThrow('Account ID must be provided');
    });

    it('should handle NRQL syntax errors', async () => {
      (mockClient.runNrqlQuery as unknown as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('NRQL Syntax error: invalid query')
      );

      await expect(
        tool.execute({
          nrql: 'SELEKT count(*) FROM Transaction',
          target_account_id: '123456',
        })
      ).rejects.toThrow('Syntax error');
    });

    it('should handle time series queries', async () => {
      const mockResults = {
        results: [
          { timestamp: 1234567890, count: 100 },
          { timestamp: 1234567900, count: 110 },
        ],
        metadata: {
          eventTypes: ['Transaction'],
          timeWindow: { begin: 1234567890, end: 1234567900 },
          timeSeries: true,
        },
      };

      (mockClient.runNrqlQuery as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockResults
      );

      const result = await tool.execute({
        nrql: 'SELECT count(*) FROM Transaction TIMESERIES',
        target_account_id: '123456',
      });

      expect(result.metadata.timeSeries).toBe(true);
      expect(result.results).toHaveLength(2);
    });

    it('should handle faceted queries', async () => {
      const mockResults = {
        results: [
          { facet: 'web', count: 100 },
          { facet: 'mobile', count: 50 },
        ],
        metadata: {
          facets: ['appName'],
          eventTypes: ['Transaction'],
        },
      };

      (mockClient.runNrqlQuery as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockResults
      );

      const result = await tool.execute({
        nrql: 'SELECT count(*) FROM Transaction FACET appName',
        target_account_id: '123456',
      });

      expect(result.metadata.facets).toContain('appName');
      expect(result.results).toHaveLength(2);
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      (mockClient.runNrqlQuery as unknown as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('API Error: Rate limit exceeded')
      );

      await expect(
        tool.execute({
          nrql: 'SELECT count(*) FROM Transaction',
          target_account_id: '123456',
        })
      ).rejects.toThrow('API Error: Rate limit exceeded');
    });

    it('should validate account ID format', async () => {
      await expect(
        tool.execute({
          nrql: 'SELECT count(*) FROM Transaction',
          target_account_id: 'invalid-id',
        })
      ).rejects.toThrow('Invalid account ID format');
    });
  });
});

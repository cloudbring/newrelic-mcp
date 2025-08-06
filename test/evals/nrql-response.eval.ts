import { Levenshtein } from 'autoevals';
import { evalite } from 'evalite';
import { vi } from 'vitest';
import { NewRelicMCPServer } from '../../src/server';

// Mock client for testing
const createMockClient = () => ({
  validateCredentials: vi.fn().mockResolvedValue(true),
  getAccountDetails: vi.fn().mockResolvedValue({ accountId: '123456', name: 'Test Account' }),
  runNrqlQuery: vi.fn().mockImplementation(async ({ nrql }) => {
    // Simulate different responses based on query
    if (nrql.includes('TIMESERIES')) {
      return {
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
    } else if (nrql.includes('FACET')) {
      return {
        results: [
          { facet: 'web', count: 100 },
          { facet: 'mobile', count: 50 },
        ],
        metadata: {
          facets: ['appName'],
          eventTypes: ['Transaction'],
        },
      };
    } else {
      return {
        results: [{ count: 100 }],
        metadata: {
          eventTypes: ['Transaction'],
          timeWindow: { begin: 1234567890, end: 1234567900 },
        },
      };
    }
  }),
  executeNerdGraphQuery: vi.fn().mockResolvedValue({ data: {} }),
});

evalite('NRQL Query Tool Response Validation', {
  data: async () => [
    {
      input: {
        tool: 'run_nrql_query',
        params: {
          nrql: 'SELECT count(*) FROM Transaction',
          target_account_id: '123456',
        },
      },
      expected: JSON.stringify({
        results: [{ count: 100 }],
        metadata: {
          eventTypes: ['Transaction'],
          timeWindow: { begin: 1234567890, end: 1234567900 },
        },
      }),
    },
    {
      input: {
        tool: 'run_nrql_query',
        params: {
          nrql: 'SELECT count(*) FROM Transaction TIMESERIES 5 minutes',
          target_account_id: '123456',
        },
      },
      expected: JSON.stringify({
        results: [
          { timestamp: 1234567890, count: 100 },
          { timestamp: 1234567900, count: 110 },
        ],
        metadata: {
          eventTypes: ['Transaction'],
          timeWindow: { begin: 1234567890, end: 1234567900 },
          timeSeries: true,
        },
      }),
    },
    {
      input: {
        tool: 'run_nrql_query',
        params: {
          nrql: 'SELECT count(*) FROM Transaction FACET appName',
          target_account_id: '123456',
        },
      },
      expected: JSON.stringify({
        results: [
          { facet: 'web', count: 100 },
          { facet: 'mobile', count: 50 },
        ],
        metadata: {
          facets: ['appName'],
          eventTypes: ['Transaction'],
        },
      }),
    },
  ],
  task: async (input) => {
    const mockClient = createMockClient() as any;
    const server = new NewRelicMCPServer(mockClient);

    try {
      const result = await server.executeTool(input.tool, input.params);
      return JSON.stringify(result);
    } catch (error: any) {
      return JSON.stringify({ error: error.message });
    }
  },
  scorers: [
    Levenshtein,
    {
      name: 'Schema Validation',
      description: 'Validates that the response matches the expected schema',
      scorer: ({ output }) => {
        try {
          const parsed = JSON.parse(output);

          // Check for required fields
          if (parsed.error) {
            return parsed.error.includes('Account ID') ? 0.5 : 0;
          }

          const hasResults = Array.isArray(parsed.results);
          const hasMetadata = typeof parsed.metadata === 'object';
          const hasEventTypes = Array.isArray(parsed.metadata?.eventTypes);

          const score =
            (hasResults ? 0.4 : 0) + (hasMetadata ? 0.3 : 0) + (hasEventTypes ? 0.3 : 0);

          return score;
        } catch {
          return 0;
        }
      },
    },
    {
      name: 'Metadata Completeness',
      description: 'Checks if metadata contains expected fields',
      scorer: ({ output, input }) => {
        try {
          const parsed = JSON.parse(output);
          if (!parsed.metadata) return 0;

          let score = 0;

          // Check for timeseries metadata
          if (input.params.nrql.includes('TIMESERIES')) {
            score += parsed.metadata.timeSeries === true ? 0.5 : 0;
          }

          // Check for facet metadata
          if (input.params.nrql.includes('FACET')) {
            score += Array.isArray(parsed.metadata.facets) ? 0.5 : 0;
          }

          // Check for time window
          if (parsed.metadata.timeWindow) {
            score += 0.25;
            if (parsed.metadata.timeWindow.begin && parsed.metadata.timeWindow.end) {
              score += 0.25;
            }
          }

          return Math.min(score, 1);
        } catch {
          return 0;
        }
      },
    },
  ],
});

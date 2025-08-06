import { describe, it, expect } from '../fixtures/logging.fixture';
import { test } from '../fixtures/logging.fixture';
import { NrqlTool } from '../../src/tools/nrql';
import { ApmTool } from '../../src/tools/apm';
import { NewRelicClient } from '../../src/client/newrelic-client';
import { 
  verifyLogEntry, 
  verifyLogSequence, 
  verifyNoErrors,
  verifyTraceContext,
  verifyPerformanceMetrics 
} from '../helpers/log-verification';

describe('Logging and Telemetry Integration', () => {
  describe('Tool Execution Logging', () => {
    test('should log NRQL query execution with trace context', async ({ logger, logCapture, withSpan }) => {
      // Create mock client
      const mockClient = {
        runNrqlQuery: vi.fn().mockResolvedValue({
          results: [{ count: 100 }],
          metadata: { executionTime: 125 }
        })
      } as any;

      // Create tool with injected logger
      const tool = new NrqlTool(mockClient);

      // Execute within a span
      await withSpan('test.nrql_execution', async () => {
        await tool.execute({
          nrql: 'SELECT count(*) FROM Transaction',
          target_account_id: '12345'
        });
      });

      // Verify logs were captured
      expect(logCapture.hasLog('info', 'Executing NRQL query')).toBe(true);
      expect(logCapture.hasLog('info', 'NRQL query completed')).toBe(true);

      // Verify log sequence
      verifyLogSequence(logCapture.logs, [
        { message: 'Executing NRQL query' },
        { message: 'NRQL query completed' }
      ]);

      // Verify no errors
      verifyNoErrors(logCapture.logs);

      // Verify performance metrics
      const completionLog = logCapture.findByMessage('NRQL query completed')[0];
      expect(completionLog.metadata?.duration).toBeDefined();
      expect(completionLog.metadata?.resultCount).toBe(1);
    });

    test('should log APM tool execution with proper attributes', async ({ logger, logCapture, withSpan }) => {
      // Create mock client
      const mockClient = {
        listApmApplications: vi.fn().mockResolvedValue([
          { id: '1', name: 'App1', language: 'nodejs' },
          { id: '2', name: 'App2', language: 'python' }
        ])
      } as any;

      // Create tool
      const tool = new ApmTool(mockClient);

      // Execute within a span
      await withSpan('test.apm_list', async () => {
        await tool.execute({ target_account_id: '12345' });
      });

      // Verify logs
      expect(logCapture.hasLog('info', 'Listing APM applications')).toBe(true);
      expect(logCapture.hasLog('info', 'APM applications retrieved')).toBe(true);

      // Verify attributes
      const completionLog = logCapture.findByMessage('APM applications retrieved')[0];
      expect(completionLog.metadata?.applicationCount).toBe(2);
      expect(completionLog.metadata?.accountId).toBe('12345');
    });

    test('should log errors with proper context', async ({ logger, logCapture, withSpan }) => {
      // Create mock client that throws error
      const mockClient = {
        runNrqlQuery: vi.fn().mockRejectedValue(new Error('API Error: Invalid query'))
      } as any;

      // Create tool
      const tool = new NrqlTool(mockClient);

      // Execute and expect error
      await expect(
        withSpan('test.nrql_error', async () => {
          await tool.execute({
            nrql: 'INVALID QUERY',
            target_account_id: '12345'
          });
        })
      ).rejects.toThrow('API Error: Invalid query');

      // Verify error was logged
      const errorLogs = logCapture.findByLevel('error');
      expect(errorLogs.length).toBeGreaterThan(0);
    });
  });

  describe('Span Capture and Verification', () => {
    test('should capture span attributes for tool execution', async ({ spanCapture, withSpan }) => {
      const mockClient = {
        runNrqlQuery: vi.fn().mockResolvedValue({
          results: [{ count: 100 }],
          metadata: { executionTime: 125 }
        })
      } as any;

      const tool = new NrqlTool(mockClient);

      await withSpan('test.span_attributes', async () => {
        await tool.execute({
          nrql: 'SELECT count(*) FROM Transaction',
          target_account_id: '12345'
        });
      });

      // Verify span was captured with correct attributes
      const toolSpans = spanCapture.findByName('tool.nrql');
      expect(toolSpans.length).toBeGreaterThan(0);

      const span = toolSpans[0];
      expect(span.attributes['tool.name']).toBe('nrql');
      expect(span.attributes['tool.operation']).toBe('execute_query');
      expect(span.attributes['nrql.account_id']).toBe('12345');
    });

    test('should capture span events and timing', async ({ spanCapture, withSpan }) => {
      const mockClient = {
        listApmApplications: vi.fn().mockImplementation(() => {
          return new Promise(resolve => {
            setTimeout(() => {
              resolve([
                { id: '1', name: 'App1' },
                { id: '2', name: 'App2' }
              ]);
            }, 50);
          });
        })
      } as any;

      const tool = new ApmTool(mockClient);

      const startTime = Date.now();
      await withSpan('test.timing', async () => {
        await tool.execute({ target_account_id: '12345' });
      });
      const endTime = Date.now();

      // Verify timing
      const duration = endTime - startTime;
      expect(duration).toBeGreaterThanOrEqual(50);

      // Verify span captured duration
      const spans = spanCapture.findByName('tool.apm');
      expect(spans.length).toBeGreaterThan(0);
      
      const span = spans[0];
      expect(span.attributes['apm.duration_ms']).toBeGreaterThanOrEqual(50);
    });
  });

  describe('Log and Span Correlation', () => {
    test('should correlate logs with spans using trace context', async ({ logger, logCapture, spanCapture, withSpan }) => {
      const mockClient = {
        runNrqlQuery: vi.fn().mockResolvedValue({
          results: [{ data: 'test' }]
        })
      } as any;

      const tool = new NrqlTool(mockClient);

      await withSpan('test.correlation', async () => {
        await tool.execute({
          nrql: 'SELECT * FROM Transaction LIMIT 1',
          target_account_id: '12345'
        });
      });

      // Verify trace context in logs
      const logs = logCapture.logs;
      verifyTraceContext(logs);

      // Verify spans have matching context
      const spans = spanCapture.spans;
      expect(spans.length).toBeGreaterThan(0);

      // All logs and spans should share trace ID
      const logTraceIds = logs
        .map(log => log['trace.id'] || log.metadata?.['trace.id'])
        .filter(Boolean);
      
      if (logTraceIds.length > 0) {
        const uniqueTraceIds = new Set(logTraceIds);
        expect(uniqueTraceIds.size).toBe(1);
      }
    });
  });

  describe('Performance Monitoring', () => {
    test('should track performance metrics in logs', async ({ logger, logCapture, withSpan }) => {
      const mockClient = {
        runNrqlQuery: vi.fn().mockImplementation(() => {
          return new Promise(resolve => {
            setTimeout(() => {
              resolve({ results: [{ count: 100 }] });
            }, 10);
          });
        })
      } as any;

      const tool = new NrqlTool(mockClient);

      await withSpan('test.performance', async () => {
        await tool.execute({
          nrql: 'SELECT count(*) FROM Transaction',
          target_account_id: '12345'
        });
      });

      // Verify performance metrics
      verifyPerformanceMetrics(logCapture.logs, 1000);

      // Check specific duration log
      const completionLog = logCapture.findByMessage('NRQL query completed')[0];
      expect(completionLog.metadata?.duration).toBeGreaterThanOrEqual(10);
      expect(completionLog.metadata?.duration).toBeLessThan(1000);
    });
  });
});
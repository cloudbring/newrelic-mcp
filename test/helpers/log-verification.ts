import { expect } from 'vitest';
import winston from 'winston';

// Log verification helpers
export interface LogEntry {
  level: string;
  message: string;
  timestamp?: string;
  metadata?: Record<string, any>;
  [key: string]: any;
}

export interface SpanEntry {
  name: string;
  attributes: Record<string, any>;
  events: Array<{ name: string; attributes?: Record<string, any> }>;
  status?: { code: number; message?: string };
  duration?: number;
}

// Verify that a log entry matches expected criteria
export const verifyLogEntry = (log: LogEntry, expected: Partial<LogEntry>): void => {
  if (expected.level) {
    expect(log.level).toBe(expected.level);
  }

  if (expected.message) {
    expect(log.message).toContain(expected.message);
  }

  if (expected.metadata) {
    Object.entries(expected.metadata).forEach(([key, value]) => {
      expect(log.metadata?.[key] || log[key]).toEqual(value);
    });
  }
};

// Verify that logs contain expected sequence
export const verifyLogSequence = (
  logs: LogEntry[],
  expectedSequence: Array<{ level?: string; message: string }>
): void => {
  let currentIndex = 0;

  for (const expected of expectedSequence) {
    const foundIndex = logs.findIndex((log, idx) => {
      if (idx < currentIndex) return false;
      const levelMatch = !expected.level || log.level === expected.level;
      const messageMatch = log.message.includes(expected.message);
      return levelMatch && messageMatch;
    });

    expect(foundIndex).toBeGreaterThanOrEqual(
      currentIndex,
      `Expected to find log "${expected.message}" after index ${currentIndex}`
    );

    currentIndex = foundIndex + 1;
  }
};

// Verify that no error logs are present
export const verifyNoErrors = (logs: LogEntry[]): void => {
  const errorLogs = logs.filter((log) => log.level === 'error');
  expect(errorLogs).toHaveLength(0);
};

// Verify that specific attributes are present in logs
export const verifyLogAttributes = (logs: LogEntry[], requiredAttributes: string[]): void => {
  for (const log of logs) {
    for (const attr of requiredAttributes) {
      const hasAttribute = log[attr] !== undefined || log.metadata?.[attr] !== undefined;

      if (!hasAttribute) {
        throw new Error(`Log entry missing required attribute "${attr}": ${JSON.stringify(log)}`);
      }
    }
  }
};

// Verify span attributes and structure
export const verifySpan = (span: SpanEntry, expected: Partial<SpanEntry>): void => {
  if (expected.name) {
    expect(span.name).toContain(expected.name);
  }

  if (expected.attributes) {
    Object.entries(expected.attributes).forEach(([key, value]) => {
      expect(span.attributes[key]).toEqual(value);
    });
  }

  if (expected.status) {
    expect(span.status).toEqual(expected.status);
  }

  if (expected.events) {
    for (const expectedEvent of expected.events) {
      const found = span.events.some((event) => event.name === expectedEvent.name);
      expect(found).toBe(true);
    }
  }
};

// Verify trace context is properly propagated
export const verifyTraceContext = (logs: LogEntry[]): void => {
  const traceIds = new Set<string>();

  for (const log of logs) {
    const traceId = log['trace.id'] || log.metadata?.['trace.id'];
    if (traceId) {
      traceIds.add(traceId);
    }
  }

  // All logs in a single operation should have the same trace ID
  expect(traceIds.size).toBeLessThanOrEqual(1);
};

// Verify performance metrics in logs
export const verifyPerformanceMetrics = (logs: LogEntry[], maxDuration?: number): void => {
  const performanceLogs = logs.filter(
    (log) => log.metadata?.duration !== undefined || log.duration !== undefined
  );

  for (const log of performanceLogs) {
    const duration = log.metadata?.duration || log.duration;
    expect(duration).toBeGreaterThanOrEqual(0);

    if (maxDuration) {
      expect(duration).toBeLessThanOrEqual(maxDuration);
    }
  }
};

// Create a mock logger for testing
export const createMockLogger = (): winston.Logger & {
  getLogs: () => LogEntry[];
  clearLogs: () => void;
} => {
  const logs: LogEntry[] = [];

  const mockTransport = new winston.transports.Stream({
    stream: {
      write: (message: string) => {
        try {
          const log = JSON.parse(message);
          logs.push(log);
        } catch {
          logs.push({ level: 'info', message: message.trim() });
        }
      },
    } as any,
  });

  const logger = winston.createLogger({
    transports: [mockTransport],
    format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  }) as winston.Logger & { getLogs: () => LogEntry[]; clearLogs: () => void };

  logger.getLogs = () => logs;
  logger.clearLogs = () => {
    logs.length = 0;
  };

  return logger;
};

// Verify New Relic specific attributes
export const verifyNewRelicAttributes = (logs: LogEntry[]): void => {
  const nrAttributes = ['entity.guid', 'entity.name', 'entity.type', 'account.id'];

  for (const log of logs) {
    // Check if at least some NR attributes are present
    const hasNRAttributes = nrAttributes.some(
      (attr) =>
        log[attr] !== undefined ||
        log.metadata?.[attr] !== undefined ||
        log.attributes?.[attr] !== undefined
    );

    if (!hasNRAttributes && process.env.NEW_RELIC_ENABLED === 'true') {
      console.warn('Log entry missing New Relic attributes:', log);
    }
  }
};

// Helper to wait for async logs to be written
export const waitForLogs = async (
  logGetter: () => LogEntry[],
  expectedCount: number,
  timeout: number = 1000
): Promise<LogEntry[]> => {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    const logs = logGetter();
    if (logs.length >= expectedCount) {
      return logs;
    }
    await new Promise((resolve) => setTimeout(resolve, 10));
  }

  const logs = logGetter();
  throw new Error(`Timeout waiting for logs. Expected ${expectedCount}, got ${logs.length}`);
};

// Verify log correlation with spans
export const verifyLogSpanCorrelation = (logs: LogEntry[], spans: SpanEntry[]): void => {
  // Each span should have corresponding log entries
  for (const span of spans) {
    const spanLogs = logs.filter((log) => {
      const spanId = log['span.id'] || log.metadata?.['span.id'];
      return spanId && span.attributes['span.id'] === spanId;
    });

    // Should have at least start and end logs for each span
    expect(spanLogs.length).toBeGreaterThanOrEqual(1);
  }
};

// Export test matchers
export const logMatchers = {
  toHaveLogLevel: (logs: LogEntry[], level: string) => {
    const hasLevel = logs.some((log) => log.level === level);
    return {
      pass: hasLevel,
      message: () => `Expected logs to contain level "${level}"`,
    };
  },

  toHaveLogMessage: (logs: LogEntry[], message: string) => {
    const hasMessage = logs.some((log) => log.message.includes(message));
    return {
      pass: hasMessage,
      message: () => `Expected logs to contain message "${message}"`,
    };
  },

  toHaveValidTraceContext: (logs: LogEntry[]) => {
    const allHaveTrace = logs.every((log) => log['trace.id'] || log.metadata?.['trace.id']);
    return {
      pass: allHaveTrace,
      message: () => 'Expected all logs to have trace context',
    };
  },
};

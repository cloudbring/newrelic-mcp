import { test as base, expect, vi } from 'vitest';
import winston from 'winston';
import { getTestTracer } from '../utils/instrumentation/otel-setup';

// Define fixture types
export interface LogCapture {
  logs: Array<{
    level: string;
    message: string;
    metadata?: any;
    timestamp?: string;
  }>;
  clear: () => void;
  findByMessage: (message: string) => any[];
  findByLevel: (level: string) => any[];
  hasLog: (level: string, message: string) => boolean;
}

export interface SpanCapture {
  spans: Array<{
    name: string;
    attributes: Record<string, any>;
    events: Array<{ name: string; attributes?: Record<string, any> }>;
    status?: { code: number; message?: string };
    duration?: number;
  }>;
  clear: () => void;
  findByName: (name: string) => any[];
  findByAttribute: (key: string, value: any) => any[];
}

export interface LoggingFixtures {
  logger: winston.Logger;
  logCapture: LogCapture;
  spanCapture: SpanCapture;
  withSpan: <T>(name: string, fn: () => Promise<T>) => Promise<T>;
}

// Create custom Winston transport for capturing logs
class CaptureTransport extends winston.transports.Stream {
  private captures: LogCapture['logs'] = [];

  constructor() {
    const stream = {
      write: (message: string) => {
        try {
          const log = JSON.parse(message);
          this.captures.push({
            level: log.level,
            message: log.message,
            metadata: log.metadata || log,
            timestamp: log.timestamp,
          });
        } catch {
          // Handle non-JSON logs
          this.captures.push({
            level: 'info',
            message: message.trim(),
          });
        }
      },
    };

    super({ stream });
    this.stream = stream;
  }

  getCaptures(): LogCapture['logs'] {
    return this.captures;
  }

  clear(): void {
    this.captures = [];
  }
}

// Create custom span processor for capturing spans
class CaptureSpanProcessor {
  private captures: SpanCapture['spans'] = [];

  onStart(_span: any): void {
    // Capture span start
  }

  onEnd(span: any): void {
    const spanData = {
      name: span.name,
      attributes: span.attributes || {},
      events: span.events || [],
      status: span.status,
      duration: span.duration,
    };
    this.captures.push(spanData);
  }

  getCaptures(): SpanCapture['spans'] {
    return this.captures;
  }

  clear(): void {
    this.captures = [];
  }

  shutdown(): Promise<void> {
    return Promise.resolve();
  }

  forceFlush(): Promise<void> {
    return Promise.resolve();
  }
}

// Extended test with logging fixtures
export const test = base.extend<LoggingFixtures>({
  logger: async ({}, use) => {
    const captureTransport = new CaptureTransport();
    const logger = winston.createLogger({
      level: 'debug',
      format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
      transports: [captureTransport],
    });

    await use(logger);
  },

  logCapture: async ({ logger }, use) => {
    const transport = logger.transports[0] as CaptureTransport;

    const capture: LogCapture = {
      get logs() {
        return transport.getCaptures();
      },
      clear: () => transport.clear(),
      findByMessage: (message: string) => {
        return transport.getCaptures().filter((log) => log.message.includes(message));
      },
      findByLevel: (level: string) => {
        return transport.getCaptures().filter((log) => log.level === level);
      },
      hasLog: (level: string, message: string) => {
        return transport
          .getCaptures()
          .some((log) => log.level === level && log.message.includes(message));
      },
    };

    await use(capture);

    // Clear logs after each test
    transport.clear();
  },

  spanCapture: async ({}, use) => {
    const processor = new CaptureSpanProcessor();

    const capture: SpanCapture = {
      get spans() {
        return processor.getCaptures();
      },
      clear: () => processor.clear(),
      findByName: (name: string) => {
        return processor.getCaptures().filter((span) => span.name.includes(name));
      },
      findByAttribute: (key: string, value: any) => {
        return processor.getCaptures().filter((span) => span.attributes[key] === value);
      },
    };

    await use(capture);

    // Clear spans after each test
    processor.clear();
  },

  withSpan: async ({}, use) => {
    const tracer = getTestTracer();

    const withSpan = async <T>(name: string, fn: () => Promise<T>): Promise<T> => {
      return tracer.startActiveSpan(name, async (span) => {
        try {
          const result = await fn();
          span.setStatus({ code: 1 }); // OK
          return result;
        } catch (error) {
          span.setStatus({
            code: 2, // ERROR
            message: error instanceof Error ? error.message : 'Unknown error',
          });
          span.recordException(error as Error);
          throw error;
        } finally {
          span.end();
        }
      });
    };

    await use(withSpan);
  },
});

// Export utilities for use in tests
export { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';

// Helper to create a test logger with specific configuration
export const createConfiguredTestLogger = (config?: Partial<winston.LoggerOptions>) => {
  return winston.createLogger({
    level: 'debug',
    format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
    transports: [new winston.transports.Console({ silent: true })],
    ...config,
  });
};

// Helper to mock logger methods
export const mockLogger = () => {
  return {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
    verbose: vi.fn(),
    silly: vi.fn(),
    child: vi.fn(() => mockLogger()),
  };
};

// Helper to verify span attributes
export const expectSpanAttributes = (span: any, expected: Record<string, any>) => {
  Object.entries(expected).forEach(([key, value]) => {
    expect(span.attributes[key]).toBe(value);
  });
};

// Helper to verify log structure
export const expectLogStructure = (
  log: any,
  expected: {
    level?: string;
    message?: string;
    [key: string]: any;
  }
) => {
  if (expected.level) {
    expect(log.level).toBe(expected.level);
  }
  if (expected.message) {
    expect(log.message).toContain(expected.message);
  }
  Object.entries(expected).forEach(([key, value]) => {
    if (key !== 'level' && key !== 'message') {
      expect(log.metadata?.[key] || log[key]).toEqual(value);
    }
  });
};

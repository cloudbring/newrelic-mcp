import { performance } from 'node:perf_hooks';
import { afterAll, afterEach, beforeAll, beforeEach } from 'vitest';

// Conditionally import OpenTelemetry and logging modules
let logger: any;
let createChildLogger: any;
let initializeOpenTelemetry: any;
let shutdownOpenTelemetry: any;
let getTracer: any;
let trace: any;
let _context: any;

try {
  const loggerModule = await import('../utils/logging/winston-logger');
  logger = loggerModule.logger;
  createChildLogger = loggerModule.createChildLogger;
} catch (_error) {
  console.debug('Logger module not available, using console');
  logger = console;
  createChildLogger = () => console;
}

try {
  const otelModule = await import('../utils/instrumentation/otel-setup');
  initializeOpenTelemetry = otelModule.initializeOpenTelemetry;
  shutdownOpenTelemetry = otelModule.shutdownOpenTelemetry;
  getTracer = otelModule.getTracer;

  const apiModule = await import('@opentelemetry/api');
  trace = apiModule.trace;
  _context = apiModule.context;
} catch (_error) {
  console.debug('OpenTelemetry modules not available');
}

// Test execution context
interface TestContext {
  testName: string;
  suiteName: string;
  startTime: number;
  logger: typeof logger;
  span?: any;
}

const testContexts = new Map<string, TestContext>();

// Initialize OpenTelemetry and logging for test suite
export const setupTestInstrumentation = () => {
  let otelSDK: any;
  let suiteLogger: typeof logger;

  beforeAll(async () => {
    // Initialize OpenTelemetry for test environment
    if (process.env.OTEL_ENABLED === 'true' && initializeOpenTelemetry) {
      try {
        otelSDK = initializeOpenTelemetry();
        console.log('OpenTelemetry initialized for test suite');
      } catch (error) {
        console.debug('Failed to initialize OpenTelemetry:', error);
      }
    }

    // Create suite-level logger
    if (createChildLogger && logger) {
      suiteLogger = createChildLogger(logger, 'test-suite');
      suiteLogger.info?.('Test suite started', {
        nodeVersion: process.version,
        testRunner: 'vitest',
        environment: process.env.NODE_ENV,
      });
    }
  });

  afterAll(async () => {
    // Log suite completion
    if (suiteLogger) {
      suiteLogger.info('Test suite completed');
    }

    // Shutdown OpenTelemetry
    if (otelSDK) {
      await shutdownOpenTelemetry();
      console.log('OpenTelemetry shut down for test suite');
    }
  });

  beforeEach(async (context) => {
    const testName = context.task.name;
    const suiteName = context.task.suite?.name || 'default';
    const testKey = `${suiteName}:${testName}`;

    // Create test-specific logger
    const testLogger = createChildLogger(logger, `test:${testName}`);

    // Start performance timing
    const startTime = performance.now();

    // Create test context
    const testContext: TestContext = {
      testName,
      suiteName,
      startTime,
      logger: testLogger,
    };

    // Start OpenTelemetry span for test
    if (process.env.OTEL_ENABLED === 'true') {
      const tracer = getTracer('test-runner');
      const span = tracer.startSpan(`test.${suiteName}.${testName}`, {
        attributes: {
          'test.name': testName,
          'test.suite': suiteName,
          'test.framework': 'vitest',
        },
      });
      testContext.span = span;

      // Set span as active for this test
      const ctx = trace.setSpan(context.active(), span);
      context.setGlobalContextManager({ active: () => ctx } as any);
    }

    // Log test start
    testLogger.info('Test started', {
      test: testName,
      suite: suiteName,
    });

    // Store context
    testContexts.set(testKey, testContext);
  });

  afterEach(async (context) => {
    const testName = context.task.name;
    const suiteName = context.task.suite?.name || 'default';
    const testKey = `${suiteName}:${testName}`;

    const testContext = testContexts.get(testKey);
    if (!testContext) return;

    // Calculate test duration
    const duration = performance.now() - testContext.startTime;

    // Determine test result
    const testResult = context.task.result?.state || 'unknown';
    const error = context.task.result?.errors?.[0];

    // Log test completion
    testContext.logger.info('Test completed', {
      test: testName,
      suite: suiteName,
      result: testResult,
      duration: `${duration.toFixed(2)}ms`,
      error: error
        ? {
            message: error.message,
            stack: error.stack,
          }
        : undefined,
    });

    // Complete OpenTelemetry span
    if (testContext.span) {
      testContext.span.setAttribute('test.result', testResult);
      testContext.span.setAttribute('test.duration_ms', duration);

      if (error) {
        testContext.span.recordException(error);
        testContext.span.setStatus({
          code: 2, // ERROR
          message: error.message,
        });
      } else {
        testContext.span.setStatus({ code: 1 }); // OK
      }

      testContext.span.end();
    }

    // Clean up context
    testContexts.delete(testKey);
  });
};

// Helper to log within a test
export const logInTest = (message: string, metadata?: any) => {
  const currentTest = getCurrentTestContext();
  if (currentTest?.logger) {
    currentTest.logger.info(message, metadata);
  } else {
    console.log(message, metadata);
  }
};

// Helper to get current test context
export const getCurrentTestContext = (): TestContext | undefined => {
  // Get the most recent test context (last one added)
  const entries = Array.from(testContexts.entries());
  if (entries.length > 0) {
    return entries[entries.length - 1][1];
  }
  return undefined;
};

// Helper to add custom attributes to current test span
export const addTestSpanAttribute = (key: string, value: any) => {
  const context = getCurrentTestContext();
  if (context?.span) {
    context.span.setAttribute(key, value);
  }
};

// Helper to add custom events to current test span
export const addTestSpanEvent = (name: string, attributes?: Record<string, any>) => {
  const context = getCurrentTestContext();
  if (context?.span) {
    context.span.addEvent(name, attributes);
  }
};

// Helper for performance measurement within tests
export const measureTestOperation = async <T>(
  operationName: string,
  fn: () => Promise<T>
): Promise<T> => {
  const start = performance.now();
  const context = getCurrentTestContext();

  try {
    const result = await fn();
    const duration = performance.now() - start;

    if (context?.logger) {
      context.logger.debug(`Operation completed: ${operationName}`, {
        operation: operationName,
        duration: `${duration.toFixed(2)}ms`,
      });
    }

    if (context?.span) {
      context.span.addEvent(`operation.${operationName}`, {
        duration_ms: duration,
      });
    }

    return result;
  } catch (error) {
    const duration = performance.now() - start;

    if (context?.logger) {
      context.logger.error(`Operation failed: ${operationName}`, {
        operation: operationName,
        duration: `${duration.toFixed(2)}ms`,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    if (context?.span) {
      context.span.addEvent(`operation.${operationName}.error`, {
        duration_ms: duration,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    throw error;
  }
};

// Export for use in vitest.config.ts
export default setupTestInstrumentation;

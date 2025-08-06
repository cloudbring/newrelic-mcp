import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { Resource } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { BatchSpanProcessor, ConsoleSpanExporter, SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { WinstonInstrumentation } from '@opentelemetry/instrumentation-winston';
import { trace, SpanStatusCode, SpanKind } from '@opentelemetry/api';

const isTest = process.env.NODE_ENV === 'test';

// Create resource with service information
const createResource = () => {
  return Resource.default().merge(
    new Resource({
      [ATTR_SERVICE_NAME]: process.env.OTEL_SERVICE_NAME || 'newrelic-mcp',
      [ATTR_SERVICE_VERSION]: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      'newrelic.account.id': process.env.NEW_RELIC_ACCOUNT_ID,
    })
  );
};

// Configure trace exporter based on environment
const createTraceExporter = () => {
  if (isTest) {
    // Use console exporter for tests
    return new ConsoleSpanExporter();
  }

  if (process.env.OTEL_EXPORTER_OTLP_ENDPOINT) {
    // Use OTLP exporter for production/staging
    return new OTLPTraceExporter({
      url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT,
      headers: process.env.OTEL_EXPORTER_OTLP_HEADERS 
        ? JSON.parse(process.env.OTEL_EXPORTER_OTLP_HEADERS)
        : undefined,
    });
  }

  // Default to console for development
  return new ConsoleSpanExporter();
};

// Create and configure the OpenTelemetry SDK
let otelSDK: NodeSDK | null = null;

export const initializeOpenTelemetry = () => {
  if (otelSDK) {
    return otelSDK;
  }

  const exporter = createTraceExporter();
  const spanProcessor = isTest 
    ? new SimpleSpanProcessor(exporter)
    : new BatchSpanProcessor(exporter);

  otelSDK = new NodeSDK({
    resource: createResource(),
    spanProcessors: [spanProcessor],
    instrumentations: [
      getNodeAutoInstrumentations({
        '@opentelemetry/instrumentation-fs': {
          enabled: false, // Disable fs instrumentation for tests
        },
        '@opentelemetry/instrumentation-http': {
          enabled: !isTest,
        },
      }),
      new WinstonInstrumentation({
        enabled: true,
        logHook: (span, record) => {
          // Add trace context to log records
          const spanContext = span.spanContext();
          record['trace.id'] = spanContext.traceId;
          record['span.id'] = spanContext.spanId;
          record['trace.flags'] = spanContext.traceFlags;
        },
      }),
    ],
  });

  if (!isTest) {
    otelSDK.start();
    console.log('OpenTelemetry initialized');
  }

  return otelSDK;
};

// Shutdown OpenTelemetry gracefully
export const shutdownOpenTelemetry = async () => {
  if (otelSDK) {
    try {
      await otelSDK.shutdown();
      console.log('OpenTelemetry shut down successfully');
      otelSDK = null;
    } catch (error) {
      console.error('Error shutting down OpenTelemetry', error);
    }
  }
};

// Get the current tracer
export const getTracer = (name: string = 'newrelic-mcp') => {
  return trace.getTracer(name, process.env.npm_package_version || '1.0.0');
};

// Helper to create a span for a tool execution
export const withToolSpan = async <T>(
  toolName: string,
  operation: string,
  fn: () => Promise<T>,
  attributes?: Record<string, any>
): Promise<T> => {
  const tracer = getTracer();
  
  return tracer.startActiveSpan(
    `tool.${toolName}.${operation}`,
    {
      kind: SpanKind.INTERNAL,
      attributes: {
        'tool.name': toolName,
        'tool.operation': operation,
        ...attributes,
      },
    },
    async (span) => {
      try {
        const result = await fn();
        span.setStatus({ code: SpanStatusCode.OK });
        return result;
      } catch (error) {
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: error instanceof Error ? error.message : 'Unknown error',
        });
        span.recordException(error as Error);
        throw error;
      } finally {
        span.end();
      }
    }
  );
};

// Helper to add custom attributes to the current span
export const addSpanAttributes = (attributes: Record<string, any>) => {
  const span = trace.getActiveSpan();
  if (span) {
    Object.entries(attributes).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        span.setAttribute(key, value);
      }
    });
  }
};

// Helper to create a span event
export const addSpanEvent = (name: string, attributes?: Record<string, any>) => {
  const span = trace.getActiveSpan();
  if (span) {
    span.addEvent(name, attributes);
  }
};

// Export for test utilities
export const getTestTracer = () => {
  if (!isTest) {
    throw new Error('getTestTracer should only be used in test environment');
  }
  return getTracer('test');
};